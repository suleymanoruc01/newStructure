import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { AppConfigService } from '../config/app-config.service.js';
import { AdaptyService } from './adapty.service.js';

export type TopUpPaymentOutcome = 'approve' | 'decline' | 'cancel';

@Injectable()
export class TopUpProvider {
  constructor(
    private readonly config: AppConfigService,
    private readonly adapty: AdaptyService,
  ) {}

  async assertPaymentAllowed(input: {
    paymentOutcome?: TopUpPaymentOutcome;
    adaptyTransactionId?: string;
  }): Promise<void> {
    if (await this.adapty.isActive()) {
      if (!input.adaptyTransactionId) {
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_FAILED,
          'Adapty işlem kimliği gerekli.',
        );
      }
      return;
    }
    const ledgerDirect = this.config.env.TOKEN_TOPUP_LEDGER_CREDIT;
    if (ledgerDirect) {
      if (input.paymentOutcome && input.paymentOutcome !== 'approve') {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.PAYMENT_DECLINED,
          'Ödeme tamamlanamadı.',
        );
      }
      return;
    }

    if (!input.paymentOutcome) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Ödeme sonucu gerekli.',
      );
    }
    if (input.paymentOutcome !== 'approve') {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.PAYMENT_DECLINED,
        input.paymentOutcome === 'cancel'
          ? 'Ödeme iptal edildi.'
          : 'Ödeme reddedildi.',
      );
    }
  }
}
