import { Field, ObjectType } from '@nestjs/graphql';
import { DeviceEntity } from './device.entity';
import { LoginHistoryEntity } from './login-history.entity';

@ObjectType()
export class DeviceLoginHistoriesEntity extends DeviceEntity {
  @Field(() => [LoginHistoryEntity])
  loginHistories: LoginHistoryEntity[];
}
