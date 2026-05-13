import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiPaginatedResponse = <TModel extends Type>(model: TModel) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        properties: {
          data: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  total: { type: 'number' },
                  totalPages: { type: 'number' },
                },
              },
            },
          },
          timestamp: { type: 'string' },
        },
      },
    }),
  );
