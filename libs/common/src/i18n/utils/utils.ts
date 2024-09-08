import { ValidationError } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { I18nValidationError } from '../interfaces';

export function i18nValidationMessage({
  property,
  message,
  args,
}: {
  property?: string;
  message: string;
  args?:
    | (
        | {
            [k: string]: any;
          }
        | string
      )[]
    | {
        [k: string]: any;
      };
}): string {
  return JSON.stringify({ property, message, args });
}

export function i18nErrorMessage({
  message,
  args,
}: {
  message?: string;
  code?: string;
  args?:
    | (
        | {
            [k: string]: any;
          }
        | string
      )[]
    | {
        [k: string]: any;
      };
}) {
  return JSON.stringify({ message, args });
}

export function validationErrorToI18n(
  error: ValidationError,
): I18nValidationError {
  const children = error.children?.map(validationErrorToI18n);

  const constraintKey = Object.keys(error.constraints ?? {})[0];
  const message = constraintKey ? error.constraints[constraintKey] : undefined;

  return {
    property: error.property,
    message,
    children,
  };
}

export function formatI18nErrors(
  validationErrors: I18nValidationError[],
  i18n: I18nService,
  { lang }: { lang: string },
): I18nValidationError[] {
  return validationErrors.map((error) => {
    let messageTranslation = undefined;
    if (error.message) {
      try {
        const { property, message, args } = JSON.parse(error.message);

        const propertyTranslation = property
          ? i18n.translate(property, { lang })
          : undefined;
        messageTranslation = i18n.translate(message, {
          lang,
          args: { ...args, property: propertyTranslation },
        });
      } catch {
        messageTranslation = error.message;
      }
    }

    const formattedChildren = error.children
      ? formatI18nErrors(error.children, i18n, { lang })
      : [];

    return {
      ...error,
      message: messageTranslation,
      children: formattedChildren,
    };
  });
}
