import { Injectable } from '@nestjs/common';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

@Injectable()
export class PasswordService {
  async hash(senha: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(senha, salt, 120000, 32, 'sha256').toString('hex');
    return `pbkdf2$${salt}$${hash}`;
  }
  async compare(senha: string, stored: string) {
    if (!stored) return false;
    if (!stored.startsWith('pbkdf2$')) return false; // sem texto puro (SEC-14)
    const [, salt, hash] = stored.split('$');
    const actual = pbkdf2Sync(senha, salt, 120000, 32, 'sha256');
    return timingSafeEqual(Buffer.from(hash, 'hex'), actual);
  }
}
