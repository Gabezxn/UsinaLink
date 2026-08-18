import { ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

function contextComUser(user: any) {
  return { switchToHttp: () => ({ getRequest: () => ({ user }) }) } as any;
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('permite quando o usuario e admin', () => {
    expect(guard.canActivate(contextComUser({ tipoUsuario: 'admin' }))).toBe(true);
  });

  it('bloqueia quando o usuario nao e admin', () => {
    expect(() => guard.canActivate(contextComUser({ tipoUsuario: 'empresa' }))).toThrow(ForbiddenException);
  });

  it('bloqueia quando nao ha usuario no request', () => {
    expect(() => guard.canActivate(contextComUser(undefined))).toThrow(ForbiddenException);
  });
});
