import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsMinDate(
  minDate: Date,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isMinDate',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [minDate],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [minDateConstraint] = args.constraints;
          return typeof value === 'string' || value instanceof Date
            ? new Date(value) >= new Date(minDateConstraint)
            : false;
        },
        defaultMessage(args: ValidationArguments) {
          const [minDateConstraint] = args.constraints;
          return `${args.property} must not be earlier than ${minDateConstraint.toDateString()}`;
        },
      },
    });
  };
}
