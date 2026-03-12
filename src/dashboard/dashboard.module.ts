import { Module } from '@nestjs/common';
import { LayoutModule } from '../layout/layout.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [LayoutModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
