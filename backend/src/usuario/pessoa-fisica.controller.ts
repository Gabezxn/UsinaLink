import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdatePerfilPessoaFisicaDto } from './dto/update-perfil-pessoa-fisica.dto';
import { UsuarioService } from './usuario.service';

@Controller('api/pessoas-fisicas')
@UseGuards(JwtAuthGuard)
export class PessoaFisicaController {
  constructor(private readonly service: UsuarioService) {}

  @Get('perfil') perfil(@Req() r: any) { return this.service.perfilPessoaFisica(r.user); }
  @Patch('perfil') atualizar(@Body() dto: UpdatePerfilPessoaFisicaDto, @Req() r: any) { return this.service.atualizarPerfilPessoaFisica(r.user, dto); }
}
