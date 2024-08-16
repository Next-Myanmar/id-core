import { TokenType } from '@app/common/grpc/auth-users';

export const AccessTokenLifetimeKeys: Record<TokenType, string> = {
  [TokenType.Normal]: 'NORMAL_ACCESS_LIFETIME',
  [TokenType.ActivateUser]: 'ACTIVATE_USER_ACCESS_LIFETIME',
  [TokenType.VerifyLogin]: 'VERIFY_LOGIN_ACCESS_LIFETIME',
  [TokenType.UNRECOGNIZED]: 'UNRECOGNIZED',
};

export const RefreshTokenLifetimeKeys: Record<TokenType, string> = {
  [TokenType.Normal]: 'NORMAL_REFRESH_LIFETIME',
  [TokenType.ActivateUser]: 'ACTIVATE_USER_REFRESH_LIFETIME',
  [TokenType.VerifyLogin]: 'VERIFY_LOGIN_REFRESH_LIFETIME',
  [TokenType.UNRECOGNIZED]: 'UNRECOGNIZED',
};
