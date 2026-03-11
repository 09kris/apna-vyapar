import { Request, Response } from 'express';
import User from '../models/User';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    userType: string;
  };
}

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCKOUT_MINUTES = 15;

class VerificationController {
  /**
   * Send OTP to phone number via SMS
   * POST /verification/send-phone-otp
   */
  static async sendPhoneOtp(req: AuthRequest, res: Response) {
    try {
      const { phoneNumber } = req.body;
      const userId = req.user?.userId;

      if (!phoneNumber && !userId) {
        throw new ApiError(400, 'Phone number or user ID is required');
      }

      let user: User | null = null;

      if (userId) {
        user = await User.findByPk(userId);
        if (!user) {
          throw new ApiError(404, 'User not found');
        }
      } else {
        user = await User.findOne({ where: { phoneNumber } });
        if (!user) {
          throw new ApiError(404, 'User with this phone number not found');
        }
      }

      // Check if user is locked out due to too many attempts
      if (user.otpLockedUntil && new Date(user.otpLockedUntil) > new Date()) {
        throw new ApiError(429, 'Too many OTP attempts. Please try again later.');
      }

      // Generate OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpToken = crypto.createHash('sha256').update(otp).digest('hex');
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // Update user with OTP
      await user.update({
        phoneVerificationToken: otpToken,
        phoneVerificationExpiresAt: expiresAt,
        otpAttempts: 0, // Reset attempts on new OTP
        otpLockedUntil: undefined,
      });

      // TODO: Send OTP via SMS provider (Twilio, MSG91, etc.)
      // For development, log the OTP
      console.log(`[DEV] OTP for ${phoneNumber}: ${otp}`);

      return res.status(200).json(
        new ApiResponse(200, {
          message: 'OTP sent successfully',
          expiresIn: OTP_EXPIRY_MINUTES * 60,
          // In production, remove this line
          otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        })
      );
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(error.statusCode, null, error.message));
      } else {
        res.status(500).json(new ApiResponse(500, null, 'Error sending OTP'));
      }
    }
  }

  /**
   * Verify OTP for phone number
   * POST /verification/verify-phone-otp
   */
  static async verifyPhoneOtp(req: AuthRequest, res: Response) {
    try {
      const { phoneNumber, otp } = req.body;
      const userId = req.user?.userId;

      if (!phoneNumber && !userId) {
        throw new ApiError(400, 'Phone number or user ID is required');
      }

      if (!otp) {
        throw new ApiError(400, 'OTP is required');
      }

      let user: User | null = null;

      if (userId) {
        user = await User.findByPk(userId);
      } else {
        user = await User.findOne({ where: { phoneNumber } });
      }

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Check if user is locked out
      if (user.otpLockedUntil && new Date(user.otpLockedUntil) > new Date()) {
        throw new ApiError(429, 'Too many OTP attempts. Please try again later.');
      }

      // Check if OTP token exists and is not expired
      if (!user.phoneVerificationToken || !user.phoneVerificationExpiresAt) {
        throw new ApiError(400, 'No OTP requested. Please request OTP first.');
      }

      if (new Date(user.phoneVerificationExpiresAt) < new Date()) {
        throw new ApiError(400, 'OTP has expired. Please request a new OTP.');
      }

      // Verify OTP
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

      if (otpHash !== user.phoneVerificationToken) {
        // Increment failed attempts
        const attempts = (user.otpAttempts || 0) + 1;

        if (attempts >= MAX_OTP_ATTEMPTS) {
          // Lock user for OTP_LOCKOUT_MINUTES
          await user.update({
            otpAttempts: attempts,
            otpLockedUntil: new Date(Date.now() + OTP_LOCKOUT_MINUTES * 60 * 1000),
          });
          throw new ApiError(
            429,
            `Too many failed OTP attempts. Please try again after ${OTP_LOCKOUT_MINUTES} minutes.`
          );
        }

        await user.update({ otpAttempts: attempts });
        const remainingAttempts = MAX_OTP_ATTEMPTS - attempts;
        throw new ApiError(400, `Invalid OTP. ${remainingAttempts} attempts remaining.`);
      }

      // OTP verified successfully
      await user.update({
        phoneVerified: true,
        phoneVerificationToken: undefined,
        phoneVerificationExpiresAt: undefined,
        otpAttempts: 0,
        otpLockedUntil: undefined,
      });

      return res.status(200).json(
        new ApiResponse(200, {
          message: 'Phone number verified successfully',
          verified: true,
        })
      );
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(error.statusCode, null, error.message));
      } else {
        res.status(500).json(new ApiResponse(500, null, 'Error verifying OTP'));
      }
    }
  }

  /**
   * Send OTP to email address
   * POST /verification/send-email-otp
   */
  static async sendEmailOtp(req: AuthRequest, res: Response) {
    try {
      const { email } = req.body;
      const userId = req.user?.userId;

      if (!email && !userId) {
        throw new ApiError(400, 'Email or user ID is required');
      }

      let user: User | null = null;

      if (userId) {
        user = await User.findByPk(userId);
      } else {
        user = await User.findOne({ where: { email } });
      }

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Check if user is locked out
      if (user.otpLockedUntil && new Date(user.otpLockedUntil) > new Date()) {
        throw new ApiError(429, 'Too many OTP attempts. Please try again later.');
      }

      // Generate OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpToken = crypto.createHash('sha256').update(otp).digest('hex');
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // Update user with OTP
      await user.update({
        emailVerificationToken: otpToken,
        emailVerificationExpiresAt: expiresAt,
        otpAttempts: 0,
        otpLockedUntil: undefined,
      });

      // TODO: Send OTP via email provider (Nodemailer, SendGrid, etc.)
      // For development, log the OTP
      console.log(`[DEV] Email OTP for ${email}: ${otp}`);

      return res.status(200).json(
        new ApiResponse(200, {
          message: 'OTP sent to email successfully',
          expiresIn: OTP_EXPIRY_MINUTES * 60,
          // In production, remove this line
          otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        })
      );
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(error.statusCode, null, error.message));
      } else {
        res.status(500).json(new ApiResponse(500, null, 'Error sending email OTP'));
      }
    }
  }

  /**
   * Verify OTP for email
   * POST /verification/verify-email-otp
   */
  static async verifyEmailOtp(req: AuthRequest, res: Response) {
    try {
      const { email, otp } = req.body;
      const userId = req.user?.userId;

      if (!email && !userId) {
        throw new ApiError(400, 'Email or user ID is required');
      }

      if (!otp) {
        throw new ApiError(400, 'OTP is required');
      }

      let user: User | null = null;

      if (userId) {
        user = await User.findByPk(userId);
      } else {
        user = await User.findOne({ where: { email } });
      }

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Check if user is locked out
      if (user.otpLockedUntil && new Date(user.otpLockedUntil) > new Date()) {
        throw new ApiError(429, 'Too many OTP attempts. Please try again later.');
      }

      // Check if OTP token exists and is not expired
      if (!user.emailVerificationToken || !user.emailVerificationExpiresAt) {
        throw new ApiError(400, 'No OTP requested. Please request OTP first.');
      }

      if (new Date(user.emailVerificationExpiresAt) < new Date()) {
        throw new ApiError(400, 'OTP has expired. Please request a new OTP.');
      }

      // Verify OTP
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

      if (otpHash !== user.emailVerificationToken) {
        // Increment failed attempts
        const attempts = (user.otpAttempts || 0) + 1;

        if (attempts >= MAX_OTP_ATTEMPTS) {
          // Lock user for OTP_LOCKOUT_MINUTES
          await user.update({
            otpAttempts: attempts,
            otpLockedUntil: new Date(Date.now() + OTP_LOCKOUT_MINUTES * 60 * 1000),
          });
          throw new ApiError(
            429,
            `Too many failed OTP attempts. Please try again after ${OTP_LOCKOUT_MINUTES} minutes.`
          );
        }

        await user.update({ otpAttempts: attempts });
        const remainingAttempts = MAX_OTP_ATTEMPTS - attempts;
        throw new ApiError(400, `Invalid OTP. ${remainingAttempts} attempts remaining.`);
      }

      // OTP verified successfully
      await user.update({
        emailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationExpiresAt: undefined,
        otpAttempts: 0,
        otpLockedUntil: undefined,
      });

      return res.status(200).json(
        new ApiResponse(200, {
          message: 'Email verified successfully',
          verified: true,
        })
      );
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(error.statusCode, null, error.message));
      } else {
        res.status(500).json(new ApiResponse(500, null, 'Error verifying email OTP'));
      }
    }
  }

  /**
   * Resend OTP with cooldown
   * POST /verification/resend-otp
   */
  static async resendOtp(req: AuthRequest, res: Response) {
    try {
      const { type, phoneNumber, email } = req.body;
      const userId = req.user?.userId;

      if (!['phone', 'email'].includes(type)) {
        throw new ApiError(400, 'Type must be either "phone" or "email"');
      }

      if (type === 'phone' && !phoneNumber && !userId) {
        throw new ApiError(400, 'Phone number or user ID is required');
      }

      if (type === 'email' && !email && !userId) {
        throw new ApiError(400, 'Email or user ID is required');
      }

      let user: User | null = null;

      if (userId) {
        user = await User.findByPk(userId);
      } else if (type === 'phone') {
        user = await User.findOne({ where: { phoneNumber } });
      } else {
        user = await User.findOne({ where: { email } });
      }

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Check if user is locked out
      if (user.otpLockedUntil && new Date(user.otpLockedUntil) > new Date()) {
        throw new ApiError(429, 'Too many OTP attempts. Please try again later.');
      }

      // Generate new OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpToken = crypto.createHash('sha256').update(otp).digest('hex');
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      if (type === 'phone') {
        await user.update({
          phoneVerificationToken: otpToken,
          phoneVerificationExpiresAt: expiresAt,
          otpAttempts: 0,
          otpLockedUntil: undefined,
        });
        // TODO: Send OTP via SMS
        console.log(`[DEV] Resend OTP to ${phoneNumber}: ${otp}`);
      } else {
        await user.update({
          emailVerificationToken: otpToken,
          emailVerificationExpiresAt: expiresAt,
          otpAttempts: 0,
          otpLockedUntil: undefined,
        });
        // TODO: Send OTP via email
        console.log(`[DEV] Resend OTP to ${email}: ${otp}`);
      }

      return res.status(200).json(
        new ApiResponse(200, {
          message: `OTP resent to ${type} successfully`,
          expiresIn: OTP_EXPIRY_MINUTES * 60,
          // In production, remove this line
          otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        })
      );
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(error.statusCode, null, error.message));
      } else {
        res.status(500).json(new ApiResponse(500, null, 'Error resending OTP'));
      }
    }
  }

  /**
   * Get verification status for a user
   * GET /verification/status
   */
  static async getVerificationStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new ApiError(400, 'User ID is required');
      }

      const user = await User.findByPk(userId, {
        attributes: ['userId', 'email', 'phoneNumber', 'emailVerified', 'phoneVerified'],
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      return res.status(200).json(
        new ApiResponse(200, {
          userId: user.userId,
          email: user.email,
          phoneNumber: user.phoneNumber,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        })
      );
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(error.statusCode, null, error.message));
      } else {
        res.status(500).json(new ApiResponse(500, null, 'Error fetching verification status'));
      }
    }
  }
}

export default VerificationController;
