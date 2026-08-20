import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { TrocarSenhaDto } from './dto/trocar-senha.dto';
import { UsuarioService } from './usuario.service';

const LOGIN_THROTTLE = { default: { limit: 5, ttl: 60000 } };

@Controller('api')
export class UsuarioController {
  constructor(private readonly service: UsuarioService) {}

  @Throttle(LOGIN_THROTTLE)
  @Post('auth/login/empresa') loginEmpresa(@Body() dto: LoginDto) { return this.service.loginArea(dto, 'empresa'); }
  @Throttle(LOGIN_THROTTLE)
  @Post('auth/login/usina') loginUsina(@Body() dto: LoginDto) { return this.service.loginArea(dto, 'usina'); }
  @Throttle(LOGIN_THROTTLE)
  @Post('auth/login/pessoa_fisica') loginPessoaFisica(@Body() dto: LoginDto) { return this.service.loginArea(dto, 'pessoa_fisica'); }
  @Throttle(LOGIN_THROTTLE)
  @Post('auth/login/admin') loginAdmin(@Body() dto: LoginDto) { return this.service.loginAdmin(dto); }

  @Post('cadastro/empresa') empresa(@Body() dto: CreateUsuarioDto) { return this.service.cadastrar(dto, 'empresa'); }
  @Post('cadastro/usina') usina(@Body() dto: CreateUsuarioDto) { return this.service.cadastrar(dto, 'usina'); }
  @Post('cadastro/pessoa_fisica') pessoaFisica(@Body() dto: CreateUsuarioDto) { return this.service.cadastrar(dto, 'pessoa_fisica'); }

  @UseGuards(JwtAuthGuard)
  @Get('usuarios/:id') porId(@Param('id') id: string) { return this.service.buscarPorId(+id); }

  @UseGuards(JwtAuthGuard)
  @Get('usuarios') listar(@Query('tipo') tipo?: string, @Query('status') status?: string) {
    return tipo ? this.service.buscarPorTipo(tipo) : status ? this.service.buscarPorStatus(status) : [];
  }

  @UseGuards(JwtAuthGuard)
  @Patch('usuarios/senha') trocarSenha(@Body() dto: TrocarSenhaDto, @Req() r: any) {
    return this.service.trocarSenha(r.user, dto);
  }
}
