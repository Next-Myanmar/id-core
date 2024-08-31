export function dateReviver(key, value) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
  if (typeof value === 'string' && dateRegex.test(value)) {
    return new Date(value);
  }
  return value;
}
