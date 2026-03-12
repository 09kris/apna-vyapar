import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  userType: 'SHOP_OWNER' | 'CUSTOMER' = 'SHOP_OWNER';
  
  isLoading = signal(false);
  error = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.firstName || !this.lastName || !this.email || !this.phone || !this.password) {
      this.error.set('Please fill in all fields');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match');
      return;
    }

    if (this.password.length < 6) {
      this.error.set('Password must be at least 6 characters');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    // Build registration data - Part 1: User details only
    const fullName = `${this.firstName} ${this.lastName}`.trim();
    const registerData = { 
      fullName: fullName,
      email: this.email, 
      phoneNumber: this.phone,
      password: this.password,
      userType: this.userType
    };

    this.authService.register(registerData).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        if (response.success) {
          // Check if user needs to complete shop owner profile
          if (response.data?.needsShopOwnerProfile) {
            // Redirect to complete profile page for shop owners
            this.router.navigate(['/complete-profile']);
          } else {
            // Redirect to dashboard for customers
            this.router.navigate(['/dashboard']);
          }
        } else {
          this.error.set(response.message);
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
      }
    });
  }
}
