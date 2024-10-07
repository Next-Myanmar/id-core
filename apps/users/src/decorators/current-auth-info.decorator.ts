import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthInfo } from '../types/auth-info.interface';

const getCurrentAuthInfoByContext = (context: ExecutionContext): AuthInfo => {
  const type: string = context.getType();
  if (type !== 'http' && type !== 'graphql') {
    return null;
  }

  let req: any;
  if (type === 'http') {
    req = context.switchToHttp().getRequest();
  } else {
    req = GqlExecutionContext.create(context).getContext().req;
  }

  return req.auth;
};

export const CurrentAuthInfo = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getCurrentAuthInfoByContext(context),
);
