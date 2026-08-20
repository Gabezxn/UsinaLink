import { Body, Controller, Get, NotFoundException, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaService } from './empresa.service';
import { UpdatePerfilEmpresaDto } from './dto/update-perfil-empresa.dto';

@Controller('api/empresas')
export class EmpresaController {
  constructor(private readonly service: EmpresaService) {}

  @Get('buscar')
  async buscar(@Query('nome') nome?: string, @Query('cnpj') cnpj?: string) {
    const empresa = await this.service.buscar(nome, cnpj);
    if (!empresa) throw new NotFoundException('Empresa nao encontrada. Preencha os dados manualmente.');
    return empresa;
  }

  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  meuPerfil(@Req() r: any) {
    return this.service.meuPerfil(r.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('perfil')
  atualizarPerfil(@Body() dto: UpdatePerfilEmpresaDto, @Req() r: any) {
    return this.service.atualizarPerfil(r.user, dto);
  }
}
