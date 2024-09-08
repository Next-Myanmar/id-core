import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GeoipEntity {
  @Field()
  country: string;

  @Field()
  subDivision1: string;

  @Field()
  subDivision2: string;

  @Field()
  city: string;
}
