import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNotFutureDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'string' || value instanceof Date
            ? new Date(value) <= new Date()
            : false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} should not be a future date`;
        },
      },
    });
  };
}
