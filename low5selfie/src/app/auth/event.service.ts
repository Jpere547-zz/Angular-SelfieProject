import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class EventService {
  private _eventsUrl = 'http://localhost:3005/server/gallery';
  private _specialEventsUrl = 'http://localhost:3005/server/special';

  constructor(private http: HttpClient) {}

  getEvents() {
    return this.http.get<any>(this._eventsUrl);
  }

  getSpecialEvents() {
    return this.http.get<any>(this._specialEventsUrl);
  }
}
