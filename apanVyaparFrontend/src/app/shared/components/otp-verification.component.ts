import { Component, OnInit, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type OTPType = 'phone' | 'email';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="otp-verification-container">
      <div class="otp-header">
        <h2>{{ title() }}</h2>
        <p class="otp-subtitle">{{ subtitle }}</p>
      </div>

      <div class="otp-content">
        <!-- Step 1: Select Type and Enter Contact Info -->
        <div *ngIf="step() === 1" class="step-1">
          <div class="form-group">
            <label>Verification Type</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" [(ngModel)]="otpType" value="phone" (change)="onTypeChange()" />
                Phone Number
              </label>
              <label class="radio-label">
                <input type="radio" [(ngModel)]="otpType" value="email" (change)="onTypeChange()" />
                Email Address
              </label>
            </div>
          </div>

          <div class="form-group" *ngIf="otpType === 'phone'">
            <label>Phone Number</label>
            <input
              type="tel"
              [(ngModel)]="contactInfo"
              placeholder="+91 98765 43210"
              (keyup.enter)="sendOtp()"
            />
          </div>

          <div class="form-group" *ngIf="otpType === 'email'">
            <label>Email Address</label>
            <input
              type="email"
              [(ngModel)]="contactInfo"
              placeholder="your@email.com"
              (keyup.enter)="sendOtp()"
            />
          </div>

          <button class="btn-primary" (click)="sendOtp()" [disabled]="!contactInfo.trim() || loading()">
            <span *ngIf="!loading()">Send OTP</span>
            <span *ngIf="loading()">Sending...</span>
          </button>

          <div class="error-message" *ngIf="error()">
            {{ error() }}
          </div>
        </div>

        <!-- Step 2: Enter OTP -->
        <div *ngIf="step() === 2" class="step-2">
          <div class="form-group">
            <label>Enter OTP</label>
            <div class="otp-inputs">
              <input
                *ngFor="let i of [0, 1, 2, 3, 4, 5]"
                type="text"
                maxlength="1"
                [(ngModel)]="otpDigits[i]"
                (input)="onOtpInput(i)"
                (keydown)="onOtpKeydown($event, i)"
                class="otp-input"
                #otpInput
              />
            </div>
          </div>

          <p class="countdown" *ngIf="otpExpiry() > 0">
            OTP expires in {{ otpExpiry() }} seconds
          </p>
          <p class="expired" *ngIf="otpExpiry() <= 0">
            OTP has expired. Please request a new one.
          </p>

          <div class="action-buttons">
            <button class="btn-secondary" (click)="goBack()">Back</button>
            <button class="btn-primary" (click)="verifyOtp()" [disabled]="otp().length !== 6 || loading()">
              <span *ngIf="!loading()">Verify OTP</span>
              <span *ngIf="loading()">Verifying...</span>
            </button>
          </div>

          <div class="resend-section">
            <p *ngIf="resendCountdown() === 0">
              Didn't receive OTP?
              <button class="btn-link" (click)="resendOtp()">Resend</button>
            </p>
            <p *ngIf="resendCountdown() > 0">
              Resend OTP in {{ resendCountdown() }} seconds
            </p>
          </div>

          <div class="error-message" *ngIf="error()">
            {{ error() }}
          </div>
        </div>

        <!-- Step 3: Success -->
        <div *ngIf="step() === 3" class="step-3">
          <div class="success-icon">✓</div>
          <h3>Verification Successful!</h3>
          <p>{{ otpType === 'phone' ? 'Phone number' : 'Email' }} verified successfully.</p>
          <button class="btn-primary" (click)="close()">Continue</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .otp-verification-container {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .otp-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .otp-header h2 {
      margin: 0 0 10px;
      color: #333;
      font-size: 20px;
    }

    .otp-subtitle {
      color: #666;
      margin: 0;
      font-size: 14px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }

    .form-group input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-group input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .radio-group {
      display: flex;
      gap: 20px;
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-weight: normal;
    }

    .radio-label input {
      width: auto;
      margin: 0;
    }

    .otp-inputs {
      display: flex;
      gap: 8px;
      justify-content: center;
    }

    .otp-input {
      width: 40px;
      height: 40px;
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      border: 2px solid #ddd;
      border-radius: 4px;
      padding: 0;
    }

    .otp-input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .countdown {
      text-align: center;
      color: #f39c12;
      font-size: 13px;
      margin: 10px 0;
    }

    .expired {
      text-align: center;
      color: #e74c3c;
      font-size: 13px;
      margin: 10px 0;
    }

    .action-buttons {
      display: flex;
      gap: 10px;
      margin: 20px 0;
    }

    .btn-primary,
    .btn-secondary,
    .btn-link {
      padding: 10px 16px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
      flex: 1;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #f0f0f0;
      color: #333;
      flex: 1;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #ddd;
    }

    .btn-link {
      background: none;
      color: #007bff;
      padding: 0;
      text-decoration: underline;
      cursor: pointer;
    }

    .btn-link:hover {
      color: #0056b3;
    }

    .btn-primary:disabled,
    .btn-secondary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .resend-section {
      text-align: center;
      margin-top: 15px;
      font-size: 13px;
    }

    .resend-section p {
      margin: 0;
      color: #666;
    }

    .error-message {
      padding: 10px;
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      margin-top: 15px;
      font-size: 13px;
    }

    .step-3 {
      text-align: center;
    }

    .success-icon {
      font-size: 48px;
      color: #28a745;
      margin: 20px 0;
    }

    .step-3 h3 {
      color: #28a745;
      margin: 10px 0 5px;
    }

    .step-3 p {
      color: #666;
      margin: 0 0 20px;
    }
  `]
})
export class OtpVerificationComponent implements OnInit {
  @Input() title = signal('Verify Your Contact Information');
  @Input() subtitle = 'Verification helps secure your account';
  @Input() userId?: string;
  @Output() onVerified = new EventEmitter<{ type: OTPType; value: string }>();
  @Output() onClosed = new EventEmitter<void>();

  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  // State
  step = signal<1 | 2 | 3>(1);
  otpType: OTPType = 'phone';
  contactInfo = '';
  otpDigits = ['', '', '', '', '', ''];
  loading = signal(false);
  error = signal<string | null>(null);
  otpExpiry = signal(0);
  resendCountdown = signal(0);

  get otp(): () => string {
    return () => this.otpDigits.join('');
  }

  ngOnInit(): void {
    // Start countdown timers if needed
  }

  onTypeChange(): void {
    this.contactInfo = '';
    this.error.set(null);
  }

  sendOtp(): void {
    if (!this.contactInfo.trim()) {
      this.error.set('Please enter your contact information');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const endpoint = this.otpType === 'phone' ? 'send-phone-otp' : 'send-email-otp';
    const payload = this.otpType === 'phone'
      ? { phoneNumber: this.contactInfo }
      : { email: this.contactInfo };

    this.http.post<any>(`${this.API_URL}/verification/${endpoint}`, payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.step.set(2);
          this.otpExpiry.set(response.data.expiresIn);
          this.startOtpExpiryCountdown();
          this.loading.set(false);

          // Log OTP in development
          if (response.data.otp) {
            console.log('[DEV] OTP:', response.data.otp);
          }
        } else {
          this.error.set(response.message || 'Failed to send OTP');
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || `Failed to send ${this.otpType} OTP`);
        this.loading.set(false);
      }
    });
  }

  verifyOtp(): void {
    if (this.otp().length !== 6) {
      this.error.set('Please enter all 6 digits');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const endpoint = this.otpType === 'phone' ? 'verify-phone-otp' : 'verify-email-otp';
    const payload = this.otpType === 'phone'
      ? { phoneNumber: this.contactInfo, otp: this.otp() }
      : { email: this.contactInfo, otp: this.otp() };

    this.http.post<any>(`${this.API_URL}/verification/${endpoint}`, payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.step.set(3);
          this.loading.set(false);
          setTimeout(() => {
            this.onVerified.emit({ type: this.otpType, value: this.contactInfo });
          }, 1500);
        } else {
          this.error.set(response.message || 'Failed to verify OTP');
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Invalid OTP');
        this.loading.set(false);
      }
    });
  }

  resendOtp(): void {
    this.loading.set(true);
    this.error.set(null);

    const payload = {
      type: this.otpType,
      [this.otpType === 'phone' ? 'phoneNumber' : 'email']: this.contactInfo
    };

    this.http.post<any>(`${this.API_URL}/verification/resend-otp`, payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.otpDigits = ['', '', '', '', '', ''];
          this.otpExpiry.set(response.data.expiresIn);
          this.resendCountdown.set(60);
          this.startResendCountdown();
          this.loading.set(false);

          if (response.data.otp) {
            console.log('[DEV] New OTP:', response.data.otp);
          }
        } else {
          this.error.set(response.message || 'Failed to resend OTP');
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to resend OTP');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.step.set(1);
    this.otpDigits = ['', '', '', '', '', ''];
    this.error.set(null);
  }

  close(): void {
    this.onClosed.emit();
  }

  onOtpInput(index: number): void {
    if (this.otpDigits[index].length > 1) {
      this.otpDigits[index] = this.otpDigits[index].slice(-1);
    }

    // Auto-focus next input
    if (this.otpDigits[index].length === 1 && index < 5) {
      const nextInput = document.querySelectorAll('.otp-input')[index + 1] as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    // Handle backspace
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = document.querySelectorAll('.otp-input')[index - 1] as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }

    // Only allow digits
    if (!/[0-9]/.test(event.key) && event.key !== 'Backspace') {
      event.preventDefault();
    }
  }

  private startOtpExpiryCountdown(): void {
    const interval = setInterval(() => {
      const current = this.otpExpiry();
      if (current > 0) {
        this.otpExpiry.set(current - 1);
      } else {
        clearInterval(interval);
      }
    }, 1000);
  }

  private startResendCountdown(): void {
    const interval = setInterval(() => {
      const current = this.resendCountdown();
      if (current > 0) {
        this.resendCountdown.set(current - 1);
      } else {
        clearInterval(interval);
      }
    }, 1000);
  }
}
