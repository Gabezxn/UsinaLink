import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContextoUsuarioModule } from '../contexto-usuario/contexto-usuario.module';
import { NotificacaoModule } from '../notificacao/notificacao.module';
import { SolicitacaoComercial, PecaComercial, Usina, Empresa, PessoaFisica, AvaliacaoEntrega } from '../common/entities/core.entities';
import { SolicitacaoComercialController } from './solicitacao-comercial.controller';
import { SolicitacaoComercialService } from './solicitacao-comercial.service';

@Module({
  imports: [
    AuthModule,
    ContextoUsuarioModule,
    NotificacaoModule,
    TypeOrmModule.forFeature([SolicitacaoComercial, PecaComercial, Usina, Empresa, PessoaFisica, AvaliacaoEntrega]),
  ],
  controllers: [SolicitacaoComercialController],
  providers: [SolicitacaoComercialService],
})
export class SolicitacaoComercialModule {}
