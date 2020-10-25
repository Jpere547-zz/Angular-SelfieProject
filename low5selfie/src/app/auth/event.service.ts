import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class ImageService {
  private _galleryUrl = 'http://localhost:3005/server/gallery';

  constructor(private http: HttpClient) {}

  getImages() {
    return this.http.get<any>(this._galleryUrl);
  }
}
