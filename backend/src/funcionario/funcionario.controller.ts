import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { FuncionarioService } from './funcionario.service';

@Controller('api/funcionarios')
@UseGuards(JwtAuthGuard)
export class FuncionarioController {
  constructor(private readonly service: FuncionarioService) {}
  @Get() findAll(@Req() r: any) { return this.service.findAll(r.user); }
  @Post() async create(@Body() dto: CreateFuncionarioDto, @Req() r: any) { return { message: 'Funcionario criado.', funcionario: await this.service.create(dto, r.user) }; }
  @Get(':id') findOne(@Param('id') id: string, @Req() r: any) { return this.service.findOne(+id, r.user); }
  @Put(':id') async update(@Param('id') id: string, @Body() dto: UpdateFuncionarioDto, @Req() r: any) { return { message: 'Funcionario atualizado.', funcionario: await this.service.update(+id, dto, r.user) }; }
  @Post(':id/reenviar-convite') reenviar() { return { message: 'Convite reenviado com sucesso.' }; }
  @Put(':id/aceitar-convite') async accept(@Param('id') id: string, @Req() r: any) { return { message: 'Convite aceito com sucesso.', funcionario: await this.service.update(+id, { status: 'ativo' }, r.user) }; }
  @Put(':id/inativar') async inactivate(@Param('id') id: string, @Req() r: any) { return { message: 'Funcionario inativado.', funcionario: await this.service.update(+id, { status: 'inativo' }, r.user) }; }
  @Put(':id/ativar') async activate(@Param('id') id: string, @Req() r: any) { return { message: 'Funcionario ativado com sucesso.', funcionario: await this.service.update(+id, { status: 'ativo' }, r.user) }; }
  @Delete(':id') async remove(@Param('id') id: string, @Req() r: any) { return { message: 'Funcionario excluido definitivamente.', funcionario: await this.service.remove(+id, r.user) }; }
}
