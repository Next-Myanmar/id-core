import { ExecutionContext, Injectable } from '@nestjs/common';
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
}
