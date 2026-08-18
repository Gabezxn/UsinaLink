import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContextoUsuarioModule } from '../contexto-usuario/contexto-usuario.module';
import { AvaliacaoEntrega, Pedido, Proposta } from '../common/entities/core.entities';
import { AvaliacaoController } from './avaliacao.controller';
import { AvaliacaoService } from './avaliacao.service';

@Module({
  imports: [AuthModule, ContextoUsuarioModule, TypeOrmModule.forFeature([AvaliacaoEntrega, Pedido, Proposta])],
  controllers: [AvaliacaoController],
  providers: [AvaliacaoService],
})
export class AvaliacaoModule {}
