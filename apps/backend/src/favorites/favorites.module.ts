import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { RoleContextGuard } from '../common/role-context.guard.js';
import { FavoritesController } from './favorites.controller.js';
import { FavoritesService } from './favorites.service.js';

@Module({
  imports: [AuthModule],
  controllers: [FavoritesController],
  providers: [FavoritesService, RoleContextGuard],
  exports: [FavoritesService],
})
export class FavoritesModule {}
