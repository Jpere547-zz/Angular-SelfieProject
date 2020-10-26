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
import mergeImages from 'merge-images';
import { imageProcessor, mirror } from 'ts-image-processor';

@Component({
  selector: 'app-camera-view',
  templateUrl: './camera-view.component.html',
  styleUrls: ['./camera-view.component.scss'],
})
export class CameraViewComponent implements OnInit {
  constructor(
    private storage: AngularFireStorage,
    private _auth: AuthService,
    private _router: Router
  ) {}

  private nextCamera: Subject<boolean> = new Subject<boolean>(); // Subject Object for Swapping Webcams
  private snapshotTrigger: Subject<void> = new Subject<void>();
  toggleWebcam = true;
  toggleSnapshotMode = false;
  webErrors: WebcamInitError[] = []; // Capture ngxWebcam errors
  allowCameraSwitch = true;
  webcamSnapshotImg: WebcamImage = null; //Container class for the captured image
  multipleWebcamsAvailable = false; // Checks if the users has multiple webcams
  downloadURL: Observable<string>;
  task: AngularFireUploadTask;
  percentage: Observable<number>;
  isUploadComplete = false;
  mergedImageBlob: Blob;
  mergedImageURL;
  imageData = {
    title: '',
    dataurl: '',
  };

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
    this.downloadURL = null;
  }

  // Toggle function to take snapshot
  public triggerSnapshots(): void {
    this.snapshotTrigger.next();
  }

  // Event Handler Function for when an Image Snapshot is taken
  public imageEventHandler(webcamSnapshotImg: WebcamImage): void {
    this.webcamSnapshotImg = webcamSnapshotImg;
    this.toggleSnapshotMode = true;
    this.combImage(
      this.webcamSnapshotImg.imageAsDataUrl,
      this.webcamSnapshotImg.imageAsDataUrl
    );
  }

  // Convert Base64 WebcamImage to File for Local Save
  public imageToBlob(imageBase64: string) {
    imageBase64 = imageBase64.replace(/^[^,]+,/, '');
    const byteString = window.atob(imageBase64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }
    const imageBlob = new Blob([int8Array], { type: 'image/png' });
    this.mergedImageBlob = imageBlob;
    let reader = new FileReader();
    reader.readAsDataURL(imageBlob);
    reader.onloadend = () => {
      this.mergedImageURL = reader.result;
    };
  }

  // Combine Image and Mirrored Together
  public combImage(image1: string, image2: string) {
    imageProcessor
      .src(image2)
      .pipe(mirror())
      .then((mirroredImg) => {
        mergeImages(
          [
            { src: image1, x: 0, y: 0 },
            { src: mirroredImg, x: 640, y: 0 },
          ],
          { width: 1280, height: 480 }
        )
          .then((b64: string) => {
            this.imageToBlob(b64);
          })
          .catch((err) => console.log(err));
      });
  }

  // Save Image File Locally
  public saveLocally(): void {
    const image = this.mergedImageBlob;
    console.log(image);
    saveAs(image, 'image.png');
  }

  // Upload to MongoDB
  public uploadToDB(url: string): void {
    this.imageData.dataurl = url;
    this._auth.postImage(this.imageData).subscribe(
      (res) => {
        localStorage.setItem('token', res.token);
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
    const file = this.mergedImageBlob;
    const path = `images/${this.imageData.title}`;
    const storageRef = this.storage.ref(path);
    this.task = storageRef.put(file);
    this.percentage = this.task.percentageChanges();
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
              this.uploadToDB(url);
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
