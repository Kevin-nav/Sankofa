import { Module } from '@nestjs/common';
import { LayoutModule } from '../layout/layout.module';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Module({
  imports: [LayoutModule],
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
