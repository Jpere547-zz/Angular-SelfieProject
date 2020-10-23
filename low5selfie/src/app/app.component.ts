import { Component, OnInit } from '@angular/core';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { Subject, Observable } from 'rxjs';
import {
  AngularFireStorage,
  AngularFireStorageReference,
  AngularFireUploadTask,
} from '@angular/fire/storage';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'low5selfie';
  public toggleWebcam = true;
  public toggleSnapshotMode = false;
  public webErrors: WebcamInitError[] = []; // Capture ngxWebcam errors
  public allowCameraSwitch = true;
  public webcamSnapshotImg: WebcamImage = null; //Container class for the captured image
  public multipleWebcamsAvailable = false; // Checks if the users has multiple webcams
  private nextCamera: Subject<boolean | string> = new Subject<
    boolean | string
  >(); // Subject Object for Swapping Webcams
  private snapshotTrigger: Subject<void> = new Subject<void>();
  downloadURL: Observable<string>;
  task: AngularFireUploadTask;
  percentage: Observable<number>;
  snapshot: Observable<any>;

  constructor(private storage: AngularFireStorage) {}

  // On Initialization lists available videoInput devices if more than one is avaiable
  public ngOnInit(): void {
    WebcamUtil.getAvailableVideoInputs().then((devices: MediaDeviceInfo[]) => {
      this.multipleWebcamsAvailable = devices && devices.length > 1;
    });
  }

  // Toggle Function to turn on or off the webcam
  public toggleWebcams(): void {
    this.toggleWebcam = !this.toggleWebcam;
  }

  // Toggle Retake Picture
  public toggleRetake(): void {
    this.webcamSnapshotImg = null;
    this.toggleSnapshotMode = false;
  }

  // Toggle function to take snapshot
  public triggerSnapshots(): void {
    this.snapshotTrigger.next();
  }

  // Event Handler Function for when an Image Snapshot is taken
  public imageEventHandler(webcamSnapshotImg: WebcamImage): void {
    this.webcamSnapshotImg = webcamSnapshotImg;
    this.toggleSnapshotMode = true;
  }

  public uploadFirebase(): void {
    const file = this.webcamSnapshotImg.imageAsBase64;
    const path = `images/${new Date().getTime()}`;
    const storageRef = this.storage.ref(path);
    storageRef.putString(file, 'base64', { contentType: 'image/png' });
    // this.task = this.storage.upload(path, file);

    // this.percentage = this.task.percentageChanges();
    // this.snapshot = this.task.snapshotChanges();

    // this.downloadURL = this.task.downloadURL();
  }

  // Creates a new Observable with snapshotTrigger as the source.
  public get triggerSnapshotObservable(): Observable<void> {
    return this.snapshotTrigger.asObservable();
  }

  // Creates a new Observable with nextCamera as the source.
  public get triggerNextWebcame(): Observable<boolean | string> {
    return this.nextCamera.asObservable();
  }
}
