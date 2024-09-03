import { registerEnumType } from '@nestjs/graphql';

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
  NotSpecified = 'NotSpecified',
}

registerEnumType(Gender, {
  name: 'Gender',
});
