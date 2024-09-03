declare global {
  interface Date {
    toISODateString(): string;
  }
}

Date.prototype.toISODateString = function (): string {
  const dateOnly = new Date(this);
  dateOnly.setHours(0, 0, 0, 0);

  return dateOnly.toISOString().split('T')[0];
};

export function dateReviver(key, value) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
  if (typeof value === 'string' && dateRegex.test(value)) {
    return new Date(value);
  }
  return value;
}
