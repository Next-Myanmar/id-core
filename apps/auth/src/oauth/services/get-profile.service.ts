import { Profile } from '@app/grpc/auth-oauth';
import { Injectable, Logger } from '@nestjs/common';
import { AuthOauthInfo } from '../../types/auth-oauth-info.interface';
import { TokenInfo } from '../../types/token-info.interface';

@Injectable()
export class GetProfileService {
  private readonly logger = new Logger(GetProfileService.name);

  constructor() {}

  async getProfile({ authInfo }: TokenInfo): Promise<Profile> {
    const authOauthInfo: AuthOauthInfo = authInfo as AuthOauthInfo;

    return authOauthInfo.profile;
  }
}
