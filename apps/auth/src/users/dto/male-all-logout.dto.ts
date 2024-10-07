import { IsNotEmpty } from 'class-validator';

export class MakeAllLogoutDto {
  @IsNotEmpty()
  refreshTokenLifetime: number;

  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  currentDeviceId: string;
}
