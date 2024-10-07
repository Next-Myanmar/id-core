import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthTokenInfo } from '../types/auth-token-info.interface';
import { GqlExecutionContext } from '@nestjs/graphql';

const getCurrentAuthTokenInfoByContext = (
  context: ExecutionContext,
): AuthTokenInfo => {
  const req = GqlExecutionContext.create(context).getContext().req;

  return req.auth;
};

export const CurrentAuthTokenInfo = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getCurrentAuthTokenInfoByContext(context),
);
