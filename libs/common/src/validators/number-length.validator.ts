import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function NumberLength(
  min: number,
  max: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'numberLength',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [min, max],
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) {
            return false;
          }
          const [minLength, maxLength] = args.constraints;
          const length = value.toString().length;
          return (
            typeof value === 'number' &&
            length >= minLength &&
            length <= maxLength
          );
        },
        defaultMessage(args: ValidationArguments) {
          const [minLength, maxLength] = args.constraints;
          if (minLength === maxLength) {
            return `The ${args.property} must have exactly ${minLength} digits.`;
          }
          return `The ${args.property} must have between ${minLength} and ${maxLength} digits.`;
        },
      },
    });
  };
}
