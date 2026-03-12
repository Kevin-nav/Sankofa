import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ViewExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    if (response.headersSent) {
      return;
    }

    if (exception instanceof ForbiddenException) {
      response.status(HttpStatus.FORBIDDEN).render('errors/access-denied', {
        title: 'Access Denied',
        requestPath: request.path,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const message = this.getMessage(exception);
      const title =
        statusCode === HttpStatus.NOT_FOUND
          ? 'Record Not Found'
          : statusCode === HttpStatus.INTERNAL_SERVER_ERROR
            ? 'Internal System Error'
            : 'Request Error';

      response.status(statusCode).render('errors/error-page', {
        title,
        statusCode,
        summary: message,
      });
      return;
    }

    console.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).render('errors/error-page', {
      title: 'Internal System Error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      summary: 'The platform could not complete this request. Review the internal logs and retry.',
    });
  }

  private getMessage(exception: HttpException): string {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && response && 'message' in response) {
      const message = (response as { message?: string | string[] }).message;
      if (Array.isArray(message)) {
        return message.join(', ');
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return exception.message;
  }
}
