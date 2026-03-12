import {
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard';

@Controller('system')
@UseGuards(SessionGuard)
export class SystemController {
  @Get('test-error')
  forceError(): never {
    if (process.env.NODE_ENV !== 'test') {
      throw new NotFoundException('Record not found.');
    }

    throw new InternalServerErrorException(
      'Synthetic failure raised for end-to-end error page coverage.',
    );
  }
}
