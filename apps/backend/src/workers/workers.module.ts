import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { RoleContextGuard } from '../common/role-context.guard.js';
import { ShiftsModule } from '../shifts/shifts.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { WorkersController } from './workers.controller.js';
import { WorkerDocumentsService } from './worker-documents.service.js';
import { WorkersService } from './workers.service.js';

@Module({
  imports: [AuthModule, StorageModule, ShiftsModule],
  controllers: [WorkersController],
  providers: [WorkersService, WorkerDocumentsService, RoleContextGuard],
  exports: [WorkersService, WorkerDocumentsService],
})
export class WorkersModule {}
