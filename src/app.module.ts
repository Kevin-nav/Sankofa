import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LayoutModule } from './layout/layout.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, LayoutModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
