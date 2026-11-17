import { mascararEmail, TwoFactorService } from './two-factor.service';

const config = (valores: Record<string, string>) => ({ get: (k: string) => valores[k] }) as any;
const servico = (valores: Record<string, string>) =>
  new TwoFactorService({} as any, { configurado: () => true } as any, { digest: (t: string) => t } as any, config(valores));

describe('TwoFactorService', () => {
  it('mascara o e-mail sem revelar o nome inteiro', () => {
    expect(mascararEmail('empresa@demo.com')).toBe('em*****@demo.com');
    expect(mascararEmail('a@x.com')).toBe('a**@x.com');
  });

  it('fica desligado por padrão', () => {
    expect(servico({}).exigido('qualquer@teste.com')).toBe(false);
    expect(servico({ TWO_FACTOR_ENABLED: 'false' }).exigido('qualquer@teste.com')).toBe(false);
  });

  it('quando ligado, exige para todos, menos a lista de dispensa (sem diferenciar maiúsculas)', () => {
    const s = servico({ TWO_FACTOR_ENABLED: 'true', TWO_FACTOR_SKIP_EMAILS: 'Demo@Teste.com, outro@teste.com' });
    expect(s.exigido('alguem@teste.com')).toBe(true);
    expect(s.exigido('demo@teste.com')).toBe(false);
    expect(s.exigido('OUTRO@teste.com')).toBe(false);
  });
});
