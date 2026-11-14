import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/** Limite por IP; nas rotas de login, por IP + e-mail (uma sala inteira atrás do mesmo IP não se bloqueia). */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip = req.ip || 'sem-ip';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 120) : '';
    return /\/auth\/login\//.test(req.originalUrl || req.url || '') && email ? `${ip}|${email}` : ip;
  }
}
