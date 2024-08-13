export interface I18nValidationError {
  property?: string;

  message?: string;

  children?: I18nValidationError[];
}
