import { Body, Controller, Get, NotFoundException, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsinaService } from './usina.service';
import { UpdatePerfilUsinaDto } from './dto/update-perfil-usina.dto';

@Controller('api/usinas')
export class UsinaController {
  constructor(private readonly service: UsinaService) {}

  @Get('buscar')
  async buscar(@Query('nome') nome?: string, @Query('cnpj') cnpj?: string) {
    const usina = await this.service.buscar(nome, cnpj);
    if (!usina) throw new NotFoundException('Usina nao encontrada. Preencha os dados manualmente.');
    return usina;
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
