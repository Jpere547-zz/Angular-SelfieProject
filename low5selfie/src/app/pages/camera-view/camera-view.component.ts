import { Component, OnInit } from '@angular/core';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { Subject, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  AngularFireStorage,
  AngularFireUploadTask,
} from '@angular/fire/storage';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-camera-view',
  templateUrl: './camera-view.component.html',
  styleUrls: ['./camera-view.component.scss'],
})
export class CameraViewComponent implements OnInit {
  toggleWebcam = true;
  toggleSnapshotMode = false;
  webErrors: WebcamInitError[] = []; // Capture ngxWebcam errors
  allowCameraSwitch = true;
  webcamSnapshotImg: WebcamImage = null; //Container class for the captured image
  multipleWebcamsAvailable = false; // Checks if the users has multiple webcams
  private nextCamera: Subject<boolean> = new Subject<boolean>(); // Subject Object for Swapping Webcams
  private snapshotTrigger: Subject<void> = new Subject<void>();
  downloadURL: Observable<string>;
  task: AngularFireUploadTask;
  percentage: Observable<number>;
  isUploadComplete = false;
  snapshot: Observable<any>;
  imageData = {
    title: '',
    dataurl: '',
  };
  constructor(
    private storage: AngularFireStorage,
    private _auth: AuthService,
    private _router: Router
  ) {}

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

  // Toggle Function to Rotation between cameras
  public toggleNextWebcam(): void {
    this.nextCamera.next(true);
  }

  // Toggle Retake Picture
  public toggleRetake(): void {
    this.webcamSnapshotImg = null;
    this.toggleSnapshotMode = false;
    this.isUploadComplete = false;
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

  // Convert Base64 WebcamImage to File for Local Save
  public imageToBlob(imageBase64) {
    const byteString = window.atob(imageBase64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }
    const imageBlob = new Blob([int8Array], { type: 'image/png' });
    return imageBlob;
  }

  // Save Image File Locally
  public saveLocally(): void {
    const image = this.imageToBlob(this.webcamSnapshotImg.imageAsBase64);
    saveAs(image, 'image.png');
  }

  // Upload to MongoDB
  public uploadToDB(): void {
    this.imageData.dataurl = this.webcamSnapshotImg.imageAsDataUrl;
    this._auth.postImage(this.imageData).subscribe(
      (res) => {
        localStorage.setItem('token', res.token);
        this._router.navigate(['gallery']);
      },
      (err) => console.log(err)
    );
  }

  // Download from Firebase
  public downloadImage(): void {
    saveAs(this.downloadURL, 'image.png');
  }

  // Upload to Firebase
  public uploadFirebase(): void {
    const file = this.imageToBlob(this.webcamSnapshotImg.imageAsBase64);
    const path = `images/${this.imageData.title}`;
    const storageRef = this.storage.ref(path);
    this.task = storageRef.put(file);
    this.percentage = this.task.percentageChanges();

    this.snapshot = this.task.snapshotChanges();
    this.task
      .snapshotChanges()
      .pipe(
        finalize(() => {
          this.isUploadComplete = true;
          this.storage
            .ref(path)
            .getDownloadURL()
            .subscribe((url) => {
              this.downloadURL = url;
            });
        })
      )
      .subscribe();
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
