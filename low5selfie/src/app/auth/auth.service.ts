import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable()
export class AuthService {
  private _registerUrl = 'http://localhost:3005/server/register';
  private _loginUrl = 'http://localhost:3005/server/login';
  private _imagePostUrl = 'http://localhost:3005/server/home';

  constructor(private http: HttpClient, private _router: Router) {}

  registerUser(user) {
    return this.http.post<any>(this._registerUrl, user);
  }

  loginUser(user) {
    return this.http.post<any>(this._loginUrl, user);
  }

  logoutUser() {
    localStorage.removeItem('token');
    this._router.navigate(['/home']);
  }

  postImage(user) {
    return this.http.post<any>(this._imagePostUrl, user);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  loggedIn() {
    return !!localStorage.getItem('token');
  }
}
