import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

function contextComHeader(authorization?: string) {
  const req: any = { headers: { authorization } };
  return { switchToHttp: () => ({ getRequest: () => req }) } as any;
}

describe('JwtAuthGuard', () => {
  it('rejeita quando nao ha cabecalho Authorization', () => {
    const tokens = { verify: jest.fn() } as any;
    const guard = new JwtAuthGuard(tokens);
    expect(() => guard.canActivate(contextComHeader(undefined))).toThrow(UnauthorizedException);
    expect(tokens.verify).not.toHaveBeenCalled();
  });

  it('rejeita quando o cabecalho nao comeca com Bearer', () => {
    const tokens = { verify: jest.fn() } as any;
    const guard = new JwtAuthGuard(tokens);
    expect(() => guard.canActivate(contextComHeader('Token abc'))).toThrow(UnauthorizedException);
  });

  it('aceita e injeta req.user quando o token e valido', () => {
    const tokens = { verify: jest.fn().mockReturnValue({ sub: 1, tipoUsuario: 'empresa' }) } as any;
    const guard = new JwtAuthGuard(tokens);
    const context = contextComHeader('Bearer token-valido');
    expect(guard.canActivate(context)).toBe(true);
    expect(tokens.verify).toHaveBeenCalledWith('token-valido');
    expect(context.switchToHttp().getRequest().user).toEqual({ sub: 1, tipoUsuario: 'empresa' });
  });
});
