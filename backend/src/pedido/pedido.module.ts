import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContextoUsuarioModule } from '../contexto-usuario/contexto-usuario.module';
import { NotificacaoModule } from '../notificacao/notificacao.module';
import { Pedido, ItemPedido, ArquivoPedido, HistoricoStatusPedido, Proposta, Empresa, PessoaFisica, Solicitacao } from '../common/entities/core.entities';
import { PedidoController } from './pedido.controller';
import { PedidoService } from './pedido.service';

@Module({
  imports: [AuthModule, ContextoUsuarioModule, NotificacaoModule, TypeOrmModule.forFeature([Pedido, ItemPedido, ArquivoPedido, HistoricoStatusPedido, Proposta, Empresa, PessoaFisica, Solicitacao])],
  controllers: [PedidoController],
  providers: [PedidoService],
  exports: [PedidoService],
})
export class PedidoModule {}
