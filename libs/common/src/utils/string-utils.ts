declare global {
  interface String {
    toBoolean(): boolean;
  }
}

String.prototype.toBoolean = function (): boolean {
  const value = this.trim().toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`Invalid boolean value: ${this}`);
};

export {};
