import { Controller, Get } from '@nestjs/common';
import { LimpezaTesteService } from './limpeza-teste.service';

/** TEMPORÁRIO: confere de fora se a limpeza já rodou (só contagens, sem dados de ninguém). Sai junto com ela. */
@Controller('api/health')
export class LimpezaTesteController {
  constructor(private readonly limpeza: LimpezaTesteService) {}

  @Get('limpeza')
  estado() {
    return this.limpeza.resumo;
  }
}
