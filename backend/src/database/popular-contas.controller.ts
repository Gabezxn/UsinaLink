import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracaoSistema } from '../common/entities/core.entities';

/** TEMPORÁRIO: só para conferir de fora se a rotina de popular contas já rodou (sem dados de ninguém, só contagens). Sai junto com ela. */
@Controller('api/health')
export class PopularContasController {
  constructor(@InjectRepository(ConfiguracaoSistema) private readonly configuracao: Repository<ConfiguracaoSistema>) {}

  @Get('popular-contas')
  async estado() {
    const marca = await this.configuracao.findOne({ where: { chave: 'popular_contas_executado' } });
    let resumo: unknown = null;
    try { resumo = marca?.valor ? JSON.parse(marca.valor) : null; } catch { resumo = null; }
    return { rodou: !!marca, resumo };
  }
}
