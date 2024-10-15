import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import * as URI from 'uri-js';

export function IsURI(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isURI',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) {
            return false;
          }
          const result = URI.parse(value);
          return result.scheme !== undefined;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} is invalid`;
        },
      },
    });
  };
}
