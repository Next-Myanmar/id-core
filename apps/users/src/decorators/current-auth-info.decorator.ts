import { getRequestFromContext } from '@app/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthInfo } from '../types/auth-info.interface';

const getCurrentAuthInfoByContext = (context: ExecutionContext): AuthInfo => {
  const req: any = getRequestFromContext(context);

  return req.headers?.auth;
};

export const CurrentAuthInfo = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getCurrentAuthInfoByContext(context),
);
