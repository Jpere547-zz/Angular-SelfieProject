import { Component, OnInit } from '@angular/core';
import { ImageService } from '../../auth/event.service';

@Component({
  selector: 'app-gallery-page',
  templateUrl: './gallery-page.component.html',
  styleUrls: ['./gallery-page.component.scss'],
})
export class GalleryPageComponent implements OnInit {
  images = [];
  constructor(private _imageService: ImageService) {}

  ngOnInit(): void {
    this._imageService.getImages().subscribe(
      (res) => (this.images = res),
      (err) => console.log(err)
    );
  }
}
