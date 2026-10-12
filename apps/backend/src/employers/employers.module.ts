import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { RoleContextGuard } from '../common/role-context.guard.js';
import { ShiftsModule } from '../shifts/shifts.module.js';
import { EmployersController } from './employers.controller.js';
import { EmployersService } from './employers.service.js';

@Module({
  imports: [AuthModule, ShiftsModule],
  controllers: [EmployersController],
  providers: [EmployersService, RoleContextGuard],
  exports: [EmployersService],
})
export class EmployersModule {}
