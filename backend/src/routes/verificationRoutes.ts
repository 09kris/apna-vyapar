import { Router, Request, Response } from 'express';
import VerificationController from '../controller/VerificationController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Extend Request to include user
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    userType: string;
  };
}

/**
 * Send OTP to phone number
 * POST /api/verification/send-phone-otp
 * Body: { phoneNumber?: string } (optional if authenticated)
 */
router.post('/send-phone-otp', (req: AuthRequest, res: Response) => {
  VerificationController.sendPhoneOtp(req, res);
});

/**
 * Verify OTP for phone number
 * POST /api/verification/verify-phone-otp
 * Body: { phoneNumber?: string, otp: string }
 */
router.post('/verify-phone-otp', (req: AuthRequest, res: Response) => {
  VerificationController.verifyPhoneOtp(req, res);
});

/**
 * Send OTP to email
 * POST /api/verification/send-email-otp
 * Body: { email?: string } (optional if authenticated)
 */
router.post('/send-email-otp', (req: AuthRequest, res: Response) => {
  VerificationController.sendEmailOtp(req, res);
});

/**
 * Verify OTP for email
 * POST /api/verification/verify-email-otp
 * Body: { email?: string, otp: string }
 */
router.post('/verify-email-otp', (req: AuthRequest, res: Response) => {
  VerificationController.verifyEmailOtp(req, res);
});

/**
 * Resend OTP with cooldown
 * POST /api/verification/resend-otp
 * Body: { type: 'phone' | 'email', phoneNumber?: string, email?: string }
 */
router.post('/resend-otp', (req: AuthRequest, res: Response) => {
  VerificationController.resendOtp(req, res);
});

/**
 * Get verification status
 * GET /api/verification/status
 * Protected: Requires authentication
 */
router.get('/status', authMiddleware, (req: AuthRequest, res: Response) => {
  VerificationController.getVerificationStatus(req, res);
});

export default router;
