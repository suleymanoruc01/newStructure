import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { AppConfigService } from '../config/app-config.service.js';

export type TopUpPaymentOutcome = 'approve' | 'decline' | 'cancel';

@Injectable()
export class TopUpProvider {
  constructor(private readonly config: AppConfigService) {}

  /**
   * Validates sandbox PSP outcome. Direct ledger credit skips PSP when enabled.
   */
  assertPaymentAllowed(paymentOutcome?: TopUpPaymentOutcome): void {
    const ledgerDirect = this.config.env.TOKEN_TOPUP_LEDGER_CREDIT;
    if (ledgerDirect) {
      if (paymentOutcome && paymentOutcome !== 'approve') {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.PAYMENT_DECLINED,
          'Ödeme tamamlanamadı.',
        );
      }
      return;
    }

    if (!paymentOutcome) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Ödeme sonucu gerekli (sandbox PSP).',
      );
    }
    if (paymentOutcome !== 'approve') {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.PAYMENT_DECLINED,
        paymentOutcome === 'cancel'
          ? 'Ödeme iptal edildi.'
          : 'Ödeme reddedildi.',
      );
    }
  }
}
