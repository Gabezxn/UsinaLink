import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario, Empresa, Usina, Funcionario, PessoaFisica } from '../common/entities/core.entities';
import { ContextoUsuarioService } from './contexto-usuario.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Empresa, Usina, Funcionario, PessoaFisica])],
  providers: [ContextoUsuarioService],
  exports: [ContextoUsuarioService],
})
export class ContextoUsuarioModule {}
