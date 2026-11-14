import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

const SEGREDO_CONHECIDO = 'usinalink-dev-secret';

@Injectable()
export class TokenService {
  private segredoAleatorio?: string;
  constructor(private readonly jwt: JwtService, private readonly config: ConfigService) {}

  sign(payload: Record<string, unknown>) {
    return this.jwt.sign(payload, { secret: this.secret(), expiresIn: '24h', algorithm: 'HS256' });
  }

  verify(token: string) {
    try {
      return this.jwt.verify(token, { secret: this.secret(), algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedException('Token invalido ou expirado.');
    }
  }

  private secret() {
    const configurado = this.config.get<string>('JWT_SECRET');
    // Segredos públicos (exemplos do repositório) ou curtos demais são tratados como ausentes.
    const fraco = !configurado || configurado.length < 32 || /^(troque|usinalink)/i.test(configurado) || configurado === SEGREDO_CONHECIDO;
    if (!fraco) return configurado as string;
    // Sem segredo (ou com o valor de exemplo, público no repositório): usa um segredo aleatório deste processo.
    // O site continua no ar; as sessões só não sobrevivem a reinícios até o JWT_SECRET ser definido.
    if (!this.segredoAleatorio) {
      this.segredoAleatorio = randomBytes(48).toString('hex');
      new Logger('TokenService').warn('JWT_SECRET ausente, curto (< 32 caracteres) ou igual a um exemplo público: usando segredo aleatório temporário. Defina um JWT_SECRET forte no ambiente.');
    }
    return this.segredoAleatorio;
  }
}
