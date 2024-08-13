import * as bcrypt from 'bcrypt';

export async function hash(
  hashStr: string,
  salt: number = 10,
): Promise<string> {
  return await bcrypt.hash(hashStr, salt);
}

export async function compareHash(
  compareStr: string,
  hashedStr: string,
): Promise<boolean> {
  return await bcrypt.compare(compareStr, hashedStr);
}
