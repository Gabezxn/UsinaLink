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
    if (configurado && configurado !== SEGREDO_CONHECIDO) return configurado;
    // Sem segredo (ou com o valor de exemplo, público no repositório): usa um segredo aleatório deste processo.
    // O site continua no ar; as sessões só não sobrevivem a reinícios até o JWT_SECRET ser definido.
    if (!this.segredoAleatorio) {
      this.segredoAleatorio = randomBytes(48).toString('hex');
      new Logger('TokenService').warn('JWT_SECRET ausente ou igual ao exemplo público: usando segredo aleatório temporário. Defina JWT_SECRET no ambiente.');
    }
    return this.segredoAleatorio;
  }
}
