import { Field, ID, ObjectType } from '@nestjs/graphql';
import { LoginHistoryEntity } from './login-history.entity';

@ObjectType()
class BrowserEntity {
  @Field()
  name: string;

  @Field()
  version: string;
}

@ObjectType()
class EngineEntity {
  @Field()
  name: string;

  @Field()
  version: string;
}

@ObjectType()
class OSEntity {
  @Field()
  name: string;

  @Field()
  version: string;
}

@ObjectType()
class DeviceDetailsEntity {
  @Field()
  type: string;

  @Field()
  vendor: string;

  @Field()
  model: string;
}

@ObjectType()
export class DeviceEntity {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  isCurrentDevice: boolean;

  @Field(() => LoginHistoryEntity)
  lastLogin: LoginHistoryEntity;

  @Field(() => BrowserEntity)
  browser: BrowserEntity;

  @Field(() => EngineEntity)
  engine: EngineEntity;

  @Field(() => OSEntity)
  os: OSEntity;

  @Field(() => DeviceDetailsEntity)
  device: DeviceDetailsEntity;
}
