import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService, private readonly config: ConfigService) {}

  sign(payload: Record<string, unknown>) {
    return this.jwt.sign(payload, { secret: this.secret(), expiresIn: '24h' });
  }

  verify(token: string) {
    try {
      return this.jwt.verify(token, { secret: this.secret() });
    } catch {
      throw new UnauthorizedException('Token invalido ou expirado.');
    }
  }

  private secret() {
    return this.config.get<string>('JWT_SECRET') || 'usinalink-dev-secret';
  }
}
