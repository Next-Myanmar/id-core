import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';

export function getRequestFromContext(context: ExecutionContext): Request {
  const type = context.getType();
  if (type === 'http') {
    return context.switchToHttp().getRequest();
  }

  return GqlExecutionContext.create(context).getContext().req;
}
