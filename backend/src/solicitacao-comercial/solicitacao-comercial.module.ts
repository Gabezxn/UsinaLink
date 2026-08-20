import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContextoUsuarioModule } from '../contexto-usuario/contexto-usuario.module';
import { SolicitacaoComercial } from '../common/entities/core.entities';
import { SolicitacaoComercialController } from './solicitacao-comercial.controller';
import { SolicitacaoComercialService } from './solicitacao-comercial.service';

@Module({
  imports: [AuthModule, ContextoUsuarioModule, TypeOrmModule.forFeature([SolicitacaoComercial])],
  controllers: [SolicitacaoComercialController],
  providers: [SolicitacaoComercialService],
})
export class SolicitacaoComercialModule {}
