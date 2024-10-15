import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { TokenInfo } from '../types/token-info.interface';

const getCurrentTokenInfoByContext = (context: ExecutionContext): TokenInfo => {
  const req = GqlExecutionContext.create(context).getContext().req;

  return req.auth;
};

export const CurrentTokenInfo = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getCurrentTokenInfoByContext(context),
);
