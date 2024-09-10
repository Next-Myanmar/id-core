import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

function checkForDuplicates(items: any[], properties: string[]): boolean {
  const seen = new Set();
  return items.every((item) => isUnique(seen, item, properties));
}

function isUnique(seen: Set<any>, item: any, properties: string[]): boolean {
  const identifier = createIdentifier(item, properties);
  if (seen.has(identifier)) {
    return false;
  }
  seen.add(identifier);
  return true;
}

function createIdentifier(item: any, properties: string[]): any {
  return isObject(item) ? createObjectIdentifier(item, properties) : item;
}

function isObject(item: any): boolean {
  return typeof item === 'object' && !Array.isArray(item) && item !== null;
}

function createObjectIdentifier(item: any, properties: string[]): string {
  return properties
    .map((prop) => (item[prop] !== undefined ? item[prop] : ''))
    .join('|');
}

export function IsUnique(
  properties: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUnique',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [properties],
      validator: {
        validate(items: any[], args: ValidationArguments) {
          const [properties] = args.constraints;
          return checkForDuplicates(items, properties);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} contains duplicate values`;
        },
      },
    });
  };
}
