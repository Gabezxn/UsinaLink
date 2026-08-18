import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContextoUsuarioModule } from '../contexto-usuario/contexto-usuario.module';
import { Proposta, Pedido, Usina, BloqueioUsina } from '../common/entities/core.entities';
import { PropostaController } from './proposta.controller';
import { PropostaService } from './proposta.service';

@Module({
  imports: [AuthModule, ContextoUsuarioModule, TypeOrmModule.forFeature([Proposta, Pedido, Usina, BloqueioUsina])],
  controllers: [PropostaController],
  providers: [PropostaService],
})
export class PropostaModule {}
