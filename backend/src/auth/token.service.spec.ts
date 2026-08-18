import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service';

describe('TokenService', () => {
  const config = { get: jest.fn().mockReturnValue('segredo-de-teste') } as any;
  const service = new TokenService(new JwtService(), config);

  it('assina e verifica um token valido', () => {
    const token = service.sign({ sub: 1, tipoUsuario: 'empresa' });
    const payload = service.verify(token) as any;
    expect(payload.sub).toBe(1);
    expect(payload.tipoUsuario).toBe('empresa');
  });

  it('rejeita um token adulterado', () => {
    const token = service.sign({ sub: 1 });
    const adulterado = token.slice(0, -2) + 'xx';
    expect(() => service.verify(adulterado)).toThrow(UnauthorizedException);
  });

  it('rejeita um token invalido/vazio', () => {
    expect(() => service.verify('token-invalido')).toThrow(UnauthorizedException);
  });
});
