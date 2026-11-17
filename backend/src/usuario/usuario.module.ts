import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { TwoFactorService } from '../auth/two-factor.service';
import { Usuario, Empresa, Usina, PessoaFisica, Funcionario, BloqueioUsina, CodigoDoisFatores, RedefinicaoSenha } from '../common/entities/core.entities';
import { RedefinicaoSenhaService } from '../auth/redefinicao-senha.service';
import { UsuarioController } from './usuario.controller';
import { PessoaFisicaController } from './pessoa-fisica.controller';
import { UsuarioService } from './usuario.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Usuario, Empresa, Usina, PessoaFisica, Funcionario, BloqueioUsina, CodigoDoisFatores, RedefinicaoSenha])],
  controllers: [UsuarioController, PessoaFisicaController],
  providers: [UsuarioService, TwoFactorService, RedefinicaoSenhaService],
  exports: [UsuarioService],
})
export class UsuarioModule {}
