import { SeedService } from './seed.service';

describe('SeedService.garantirAdminDemo (SEC-1)', () => {
  const montar = (existente: any) => {
    const usuarios = { findOne: jest.fn().mockResolvedValue(existente), update: jest.fn(), create: jest.fn((d) => d), save: jest.fn() };
    const passwords = { hash: jest.fn().mockResolvedValue('hash-novo') };
    const svc = new (SeedService as any)(usuarios, ...Array(16).fill(undefined), passwords) as SeedService;
    return { svc, usuarios, passwords };
  };

  it('sem SEED_ADMIN_PASSWORD desativa o admin demo existente e não cria outro', async () => {
    const { svc, usuarios } = montar({ idUsuario: 9, status: 'ativo' });
    await svc.garantirAdminDemo(undefined);
    expect(usuarios.update).toHaveBeenCalledWith({ idUsuario: 9 }, { status: 'inativo' });
    expect(usuarios.save).not.toHaveBeenCalled();
  });

  it('sem SEED_ADMIN_PASSWORD e sem admin existente não faz nada', async () => {
    const { svc, usuarios } = montar(null);
    await svc.garantirAdminDemo(undefined);
    expect(usuarios.update).not.toHaveBeenCalled();
    expect(usuarios.save).not.toHaveBeenCalled();
  });

  it('com SEED_ADMIN_PASSWORD cria o admin com essa senha (e nunca Demo@123)', async () => {
    const { svc, usuarios, passwords } = montar(null);
    await svc.garantirAdminDemo('Segredo-do-ambiente-1');
    expect(passwords.hash).toHaveBeenCalledWith('Segredo-do-ambiente-1');
    expect(usuarios.save).toHaveBeenCalled();
  });

  it('com SEED_ADMIN_PASSWORD atualiza a senha do admin existente e o reativa', async () => {
    const { svc, usuarios } = montar({ idUsuario: 9, status: 'inativo' });
    await svc.garantirAdminDemo('Segredo-do-ambiente-1');
    expect(usuarios.update).toHaveBeenCalledWith({ idUsuario: 9 }, { senhaHash: 'hash-novo', status: 'ativo' });
  });
});
