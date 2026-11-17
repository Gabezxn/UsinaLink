import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContextoUsuarioModule } from '../contexto-usuario/contexto-usuario.module';
import { NotificacaoModule } from '../notificacao/notificacao.module';
import { Proposta, Pedido, Usina, BloqueioUsina, Solicitacao, PessoaFisica } from '../common/entities/core.entities';
import { PropostaController } from './proposta.controller';
import { PropostaService } from './proposta.service';

@Module({
  imports: [AuthModule, ContextoUsuarioModule, NotificacaoModule, TypeOrmModule.forFeature([Proposta, Pedido, Usina, BloqueioUsina, Solicitacao, PessoaFisica])],
  controllers: [PropostaController],
  providers: [PropostaService],
})
export class PropostaModule {}
