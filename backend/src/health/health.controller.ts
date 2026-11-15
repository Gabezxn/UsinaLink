import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/** Saúde do serviço: usada pelo keep-alive (Render dorme sem tráfego) e mantém o banco ativo. Sem autenticação e sem dados sensíveis. */
@Controller('api/health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @SkipThrottle()
  @Get()
  async check() {
    try {
      await this.dataSource.query('SELECT 1');
      return { ok: true, db: true };
    } catch {
      throw new ServiceUnavailableException({ ok: false, db: false });
    }
  }
}
