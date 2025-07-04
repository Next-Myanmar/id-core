export function base64encode(str: string | Buffer): string {
  if (typeof str === 'string') str = Buffer.from(str);
  return str.toString('base64');
}

export function base64urlencode(str: string | Buffer): string {
  return base64encode(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
