import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  workerAvailabilityPutSchema,
  workerDocumentCreateSchema,
  workerProfilePatchSchema,
} from '@parton/api-contracts';
import type { Request } from 'express';

import { RequireRoles, RoleContextGuard } from '../common/role-context.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ShiftsService } from '../shifts/shifts.service.js';
import { WorkerDocumentsService } from './worker-documents.service.js';
import { WorkersService } from './workers.service.js';

@Controller('workers/me')
@UseGuards(RoleContextGuard)
@RequireRoles('worker')
export class WorkersController {
  constructor(
    private readonly workers: WorkersService,
    private readonly documents: WorkerDocumentsService,
    private readonly shifts: ShiftsService,
  ) {}

  @Get()
  async getMe(@Req() req: Request) {
    const data = await this.workers.getMe(req.userId!);
    return successResponse(req.requestId ?? '', data);
  }

  @Patch()
  async patchMe(
    @Req() req: Request,
    @Body(new ZodValidationPipe(workerProfilePatchSchema)) body: unknown,
  ) {
    const parsed = workerProfilePatchSchema.parse(body);
    const data = await this.workers.patchMe(req.userId!, parsed);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('calendar')
  async calendar(
    @Req() req: Request,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const [shifts, availability] = await Promise.all([
      this.shifts.listMine(req.userId!, from, to),
      this.workers.getAvailability(req.userId!),
    ]);
    return successResponse(req.requestId ?? '', {
      items: shifts.items,
      windows: availability.windows,
    });
  }

  @Get('availability')
  async getAvailability(@Req() req: Request) {
    const data = await this.workers.getAvailability(req.userId!);
    return successResponse(req.requestId ?? '', data);
  }

  @Put('availability')
  async putAvailability(
    @Req() req: Request,
    @Body(new ZodValidationPipe(workerAvailabilityPutSchema)) body: unknown,
  ) {
    const parsed = workerAvailabilityPutSchema.parse(body);
    const data = await this.workers.putAvailability(
      req.userId!,
      parsed.windows,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('setup-status')
  async setupStatus(@Req() req: Request) {
    const data = await this.workers.getSetupStatus(req.userId!);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('documents')
  async listDocuments(@Req() req: Request) {
    const data = await this.documents.listForUser(req.userId!);
    return successResponse(req.requestId ?? '', data);
  }

  @Post('documents')
  async createDocument(
    @Req() req: Request,
    @Body(new ZodValidationPipe(workerDocumentCreateSchema)) body: unknown,
  ) {
    const parsed = workerDocumentCreateSchema.parse(body);
    const data = await this.documents.createUpload(req.userId!, parsed);
    return successResponse(req.requestId ?? '', data);
  }

  @Post('documents/:id/complete')
  async completeDocument(@Req() req: Request, @Param('id') id: string) {
    const data = await this.documents.finalizeUpload(req.userId!, id);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('documents/:id/download-url')
  async documentDownloadUrl(@Req() req: Request, @Param('id') id: string) {
    const data = await this.documents.downloadUrl(req.userId!, id);
    return successResponse(req.requestId ?? '', data);
  }
}
