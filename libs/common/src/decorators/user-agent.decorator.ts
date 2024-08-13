import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getUserAgentDetails, UserAgentDetails } from '../utils';

const getCurrentUserAgentByContext = (
  context: ExecutionContext,
): UserAgentDetails => {
  let req: any;
  if (context.getType() === 'http') {
    req = context.switchToHttp().getRequest();
  } else {
    req = context.getArgs()[2]?.req;
  }

  const userAgentDetails = getUserAgentDetails(req.headers['user-agent']);
  return userAgentDetails;
};

export const CurrentUserAgent = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getCurrentUserAgentByContext(context),
);
