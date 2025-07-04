import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { TokenInfo } from '../types/token-info.interface';

const getCurrentTokenInfoByContext = (context: ExecutionContext): TokenInfo => {
  const type: string = context.getType();

  let req: any;
  if (type === 'http') {
    req = context.switchToHttp().getRequest();
  } else if (type === 'graphql') {
    req = GqlExecutionContext.create(context).getContext().req;
  } else {
    throw new InternalServerErrorException(
      `CurrentTokenInfo: Unsupported context type: ${type}`,
    );
  }

  return req.auth;
};

export const CurrentTokenInfo = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getCurrentTokenInfoByContext(context),
);
