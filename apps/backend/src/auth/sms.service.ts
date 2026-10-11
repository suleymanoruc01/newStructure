import { Injectable, Logger } from '@nestjs/common';
import Twilio from 'twilio';

import { AppConfigService } from '../config/app-config.service.js';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: Twilio.Twilio;

  constructor(private readonly config: AppConfigService) {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = this.config.env;
    this.client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }

  async sendOtp(phoneE164: string, code: string): Promise<void> {
    const from = this.config.env.TWILIO_FROM_NUMBER;
    const body = `PartOn doğrulama kodunuz: ${code}`;
    try {
      await this.client.messages.create({
        to: phoneE164,
        from,
        body,
      });
    } catch (error) {
      this.logger.error(`Twilio SMS failed for ${phoneE164}`, error);
      throw error;
    }
  }
}
