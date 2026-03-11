import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = signal(false);
  error = signal('');
  emailSent = signal(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.email) {
      this.error.set('Please enter your email');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email: this.email })
      .subscribe({
        next: (response: any) => {
          this.isLoading.set(false);
          if (response.success) {
            this.emailSent.set(true);
          } else {
            this.error.set(response.message);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set(err.error?.message || 'Failed to send reset email. Please try again.');
        }
      });
  }
}
