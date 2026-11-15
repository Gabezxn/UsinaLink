import { Body, Controller, Get, NotFoundException, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsinaService } from './usina.service';
import { UpdatePerfilUsinaDto } from './dto/update-perfil-usina.dto';

@Controller('api/usinas')
export class UsinaController {
  constructor(private readonly service: UsinaService) {}

  @UseGuards(JwtAuthGuard)
  @Get('buscar')
  async buscar(@Query('nome') nome?: string, @Query('cnpj') cnpj?: string) {
    const usina = await this.service.buscar(nome, cnpj);
    if (!usina) throw new NotFoundException('Usina nao encontrada. Preencha os dados manualmente.');
    // Só dados públicos: nada de CNPJ, contato ou anexos.
    return { nomeFantasia: usina.nomeFantasia, razaoSocial: usina.razaoSocial };
  }

  // Diretorio visto por compradores logados (empresa ou pessoa fisica).
  @UseGuards(JwtAuthGuard)
  @Get('diretorio')
  diretorio() {
    return this.service.diretorio();
  }

  @UseGuards(JwtAuthGuard)
  @Get('diretorio/:id')
  diretorioDetalhe(@Param('id') id: string) {
    return this.service.diretorioDetalhe(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  meuPerfil(@Req() r: any) {
    return this.service.meuPerfil(r.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('perfil')
  atualizarPerfil(@Body() dto: UpdatePerfilUsinaDto, @Req() r: any) {
    return this.service.atualizarPerfil(r.user, dto);
  }
}
