import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private config: ConfigService) {}

  generateOtp(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  async sendOtp(phone: string, otp: string): Promise<void> {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    // Try MSG91 first
    const apiKey = this.config.get('MSG91_API_KEY');
    if (apiKey) {
      await this.sendViaMSG91(phoneWithCode, otp, apiKey);
      return;
    }

    // Fallback: log in development
    this.logger.log(`[DEV] OTP for ${phone}: ${otp}`);
  }

  private async sendViaMSG91(phone: string, otp: string, apiKey: string) {
    try {
      const templateId = this.config.get('MSG91_TEMPLATE_ID');
      await axios.post('https://api.msg91.com/api/v5/otp', null, {
        params: {
          authkey: apiKey,
          mobile: phone,
          otp,
          template_id: templateId,
        },
        timeout: 8000,
      });
      this.logger.log(`OTP sent via MSG91 to ${phone}`);
    } catch (err) {
      this.logger.error(`MSG91 error: ${err.message}`);
      throw new Error('Failed to send OTP. Please try again.');
    }
  }
}
