import * as crypto from 'crypto';

export const hashString = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};
