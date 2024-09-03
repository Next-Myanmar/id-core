import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard as BaseThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerGuard extends BaseThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const type = context.getType();
    if (type === 'rpc') {
      return true;
    }
    return await super.canActivate(context);
  }

  protected getRequestResponse(context: ExecutionContext) {
    const type: string = context.getType();
    if (type === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext<{ req: Request; res: Response }>();
      return { req: ctx.req, res: ctx.res };
    }

    return super.getRequestResponse(context);
  }
}
