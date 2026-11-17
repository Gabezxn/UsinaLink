import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('responde ok quando o banco responde ao SELECT 1', async () => {
    const ds = { query: jest.fn().mockResolvedValue([{ '?column?': 1 }]) } as any;
    await expect(new HealthController(ds).check()).resolves.toEqual({ ok: true, db: true });
    expect(ds.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('responde 503 quando o banco cai', async () => {
    const ds = { query: jest.fn().mockRejectedValue(new Error('conexao perdida')) } as any;
    await expect(new HealthController(ds).check()).rejects.toThrow(ServiceUnavailableException);
  });
});
