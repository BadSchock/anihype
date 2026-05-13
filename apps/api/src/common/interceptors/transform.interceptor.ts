import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Request } from 'express';

export interface ResponseEnvelope<T> {
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T>> {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseEnvelope<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - startTime;
        this.logger.log(`${method} ${url} → ${elapsed}ms`);
      }),
      map((data: T) => ({
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
