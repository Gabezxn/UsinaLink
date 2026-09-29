import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario, Empresa, Usina, Funcionario } from '../common/entities/core.entities';
import { ContextoUsuarioService } from './contexto-usuario.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Empresa, Usina, Funcionario])],
  providers: [ContextoUsuarioService],
  exports: [ContextoUsuarioService],
})
export class ContextoUsuarioModule {}
