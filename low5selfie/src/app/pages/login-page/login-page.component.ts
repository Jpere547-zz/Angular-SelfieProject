import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent implements OnInit {
  loginUserData = {
    email: '',
    password: '',
  };

  constructor(private _auth: AuthService, private _router: Router) {}

  ngOnInit() {}

  loginUser() {
    this._auth.loginUser(this.loginUserData).subscribe(
      (res) => {
        localStorage.setItem('token', res.token);
        this._router.navigate(['/home']);
      },
      (err) => console.log(err)
    );
  }
}
