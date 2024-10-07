import { Field, ObjectType } from '@nestjs/graphql';
import { GeoipEntity } from './geoip.entity';

@ObjectType()
export class LoginHistoryEntity extends GeoipEntity {
  @Field(() => Date)
  lastLogin: Date;
}
