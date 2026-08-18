import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Usuario, Empresa, Usina, PessoaFisica, Funcionario, BloqueioUsina } from '../common/entities/core.entities';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Usuario, Empresa, Usina, PessoaFisica, Funcionario, BloqueioUsina])],
  controllers: [UsuarioController],
  providers: [UsuarioService],
  exports: [UsuarioService],
})
export class UsuarioModule {}
