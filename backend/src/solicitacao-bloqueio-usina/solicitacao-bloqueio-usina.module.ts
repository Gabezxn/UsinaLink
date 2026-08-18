import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContextoUsuarioModule } from '../contexto-usuario/contexto-usuario.module';
import { SolicitacaoBloqueioUsina, BloqueioUsina } from '../common/entities/core.entities';
import { SolicitacaoBloqueioUsinaController } from './solicitacao-bloqueio-usina.controller';
import { SolicitacaoBloqueioUsinaService } from './solicitacao-bloqueio-usina.service';

@Module({
  imports: [AuthModule, ContextoUsuarioModule, TypeOrmModule.forFeature([SolicitacaoBloqueioUsina, BloqueioUsina])],
  controllers: [SolicitacaoBloqueioUsinaController],
  providers: [SolicitacaoBloqueioUsinaService],
  exports: [SolicitacaoBloqueioUsinaService],
})
export class SolicitacaoBloqueioUsinaModule {}
