import { PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new BadRequestException({ message: errors, error: 'Validation Error' });
    }

    return result.data;
  }
}
