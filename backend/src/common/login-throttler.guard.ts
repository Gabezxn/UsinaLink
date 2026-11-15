import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';

const JANELA_MS = 60_000;
const LIMITE_LOGIN_POR_IP = Number(process.env.LOGIN_IP_LIMIT) || 60;

/**
 * Limite por IP; nas rotas de login, por IP + e-mail (uma sala inteira atrás do mesmo IP não se bloqueia)
 * e, além disso, um teto por IP para impedir "password spraying" (uma senha contra muitos e-mails).
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  private readonly porIp = new Map<string, { inicio: number; total: number }>();

  private ehLogin(req: Record<string, any>) {
    return /\/auth\/login\//.test(req.originalUrl || req.url || '');
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip = req.ip || 'sem-ip';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 120) : '';
    return this.ehLogin(req) && email ? `${ip}|${email}` : ip;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    if (req && this.ehLogin(req)) {
      const ip = req.ip || 'sem-ip';
      const agora = Date.now();
      const atual = this.porIp.get(ip);
      if (!atual || agora - atual.inicio > JANELA_MS) {
        if (this.porIp.size > 5000) this.porIp.clear();
        this.porIp.set(ip, { inicio: agora, total: 1 });
      } else if (++atual.total > LIMITE_LOGIN_POR_IP) {
        throw new ThrottlerException();
      }
    }
    return super.canActivate(context);
  }
}
