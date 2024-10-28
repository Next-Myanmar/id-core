import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

const getCurrentOriginByContext = (
  context: ExecutionContext,
): string | null => {
  const type: string = context.getType();

  let req: any;
  if (type === 'http') {
    req = context.switchToHttp().getRequest();
  } else if (type === 'graphql') {
    req = GqlExecutionContext.create(context).getContext().req;
  } else {
    throw new InternalServerErrorException(
      `CurrentOrigin: Unsupported context type: ${type}`,
    );
  }

  return req.header.origin;
};

export const CurrentOrigin = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getCurrentOriginByContext(context),
);
