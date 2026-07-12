import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // exception-কে any দিলাম সহজে প্রোপার্টি চেক করার জন্য
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    const exceptionObject =
      typeof exception === 'object' && exception !== null
        ? (exception as { code?: string; message?: unknown })
        : undefined;

    // ১. আপনার কাস্টম লজিক: Prisma P1001 এরর হ্যান্ডলিং
    if (
      exceptionObject &&
      (exceptionObject.code === 'P1001' ||
        (typeof exceptionObject.message === 'string' &&
          exceptionObject.message.includes('P1001')))
    ) {
      status = HttpStatus.SERVICE_UNAVAILABLE; // 503 Status Code
      message =
        'Our database system is temporarily offline. Please ensure the Docker container is running.';
    }
    // ২. রেগুলার NestJS HttpException হ্যান্ডলিং
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as
        | string
        | { message?: string | string[]; [key: string]: unknown };

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseMessage =
          'message' in exceptionResponse
            ? exceptionResponse.message
            : undefined;

        if (typeof responseMessage === 'string') {
          message = responseMessage;
        } else if (Array.isArray(responseMessage)) {
          message = responseMessage.join(', ');
        } else {
          message = JSON.stringify(exceptionResponse);
        }
      }
    }
    // ৩. অন্যান্য সাধারণ Node.js এরর হ্যান্ডলিং
    else if (exception instanceof Error) {
      message = exception.message;
    }

    // সুন্দর এবং কাস্টমাইজড রেসপন্স ফরম্যাট
    response.status(status).json({
      success: false,
      statusCode: status,
      errorCode: exceptionObject?.code || 'UNKNOWN_ERROR', // চাইলে এরর কোডটাও পাঠাতে পারেন (যেমন: P1001)
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}
