import { Field, ID, ObjectType } from '@nestjs/graphql';
import { LoginHistoryEntity } from './login-history.entity';

@ObjectType()
export class DeviceEntity {
  @Field(() => ID)
  id: string;

  @Field()
  browser: string;

  @Field()
  os: string;

  @Field()
  deviceType: string;

  @Field()
  deviceModel: string;

  @Field()
  deviceVendor: string;

  @Field()
  isCurrentDevice: boolean;

  @Field(() => LoginHistoryEntity)
  lastLogin: LoginHistoryEntity;
}
