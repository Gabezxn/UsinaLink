import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('gera hashes diferentes para a mesma senha (salt aleatorio)', async () => {
    const a = await service.hash('minhaSenha123');
    const b = await service.hash('minhaSenha123');
    expect(a).not.toEqual(b);
  });

  it('confere corretamente uma senha certa', async () => {
    const hash = await service.hash('minhaSenha123');
    await expect(service.compare('minhaSenha123', hash)).resolves.toBe(true);
  });

  it('rejeita uma senha errada', async () => {
    const hash = await service.hash('minhaSenha123');
    await expect(service.compare('senhaErrada', hash)).resolves.toBe(false);
  });

  it('rejeita quando nao ha hash guardado', async () => {
    await expect(service.compare('qualquer', '')).resolves.toBe(false);
  });
});
