import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** When Verimor is off in admin, every challenge uses this code. */
export const FALLBACK_OTP = '290821';

export const VERIMOR_OTP_URL = 'https://sms.verimor.com.tr/v2/otp';

export function verimorDest(phoneE164: string): string {
  return phoneE164.replace(/^\+/, '');
}

export function verimorActive(settings: {
  verimorEnabled: boolean;
  username: string;
  password: string;
}): boolean {
  return (
    settings.verimorEnabled &&
    settings.username.trim().length > 0 &&
    settings.password.length > 0
  );
}

export function buildVerimorOtpBody(input: {
  username: string;
  password: string;
  header: string;
  phoneE164: string;
  code: string;
  customId?: string;
}): Record<string, string> {
  const body: Record<string, string> = {
    username: input.username,
    password: input.password,
    dest: verimorDest(input.phoneE164),
    code: input.code,
    msg: 'PartOn doğrulama kodunuz: {code}',
  };
  const header = input.header.trim();
  if (header) {
    body.header = header;
  }
  if (input.customId) {
    body.custom_id = input.customId.slice(0, 50);
  }
  return body;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async loadSettings() {
    const row = await this.prisma.smsSettings.findUnique({
      where: { id: 'default' },
    });
    return (
      row ?? {
        id: 'default',
        verimorEnabled: false,
        username: '',
        password: '',
        header: '',
        updatedAt: new Date(0),
      }
    );
  }

  async isVerimorActive(): Promise<boolean> {
    return verimorActive(await this.loadSettings());
  }

  async sendOtp(
    phoneE164: string,
    code: string,
    customId?: string,
  ): Promise<void> {
    const settings = await this.loadSettings();
    if (!verimorActive(settings)) {
      return;
    }
    const response = await fetch(VERIMOR_OTP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        buildVerimorOtpBody({
          username: settings.username,
          password: settings.password,
          header: settings.header,
          phoneE164,
          code,
          customId,
        }),
      ),
    });
    if (!response.ok) {
      const detail = await response.text();
      this.logger.error(`Verimor OTP HTTP ${response.status} ${detail}`);
      throw new ApiException(
        HttpStatus.BAD_GATEWAY,
        ErrorCode.INTERNAL_ERROR,
        'SMS gönderilemedi.',
      );
    }
  }
}
