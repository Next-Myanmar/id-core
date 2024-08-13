export interface I18nEmailSubject {
  key: string;
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
}
