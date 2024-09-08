import { Field, ObjectType } from '@nestjs/graphql';
import { Gender } from '../../enums/gender.enum';

@ObjectType()
export class PersonalDetailsEntity {
  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  dateOfBirth?: string;

  @Field(() => Gender, { nullable: true })
  gender?: Gender;
}
