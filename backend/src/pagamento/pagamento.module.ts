import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContextoUsuarioModule } from '../contexto-usuario/contexto-usuario.module';
import { NotificacaoModule } from '../notificacao/notificacao.module';
import { Pagamento, Pedido, Proposta } from '../common/entities/core.entities';
import { PagamentoController } from './pagamento.controller';
import { PagamentoService } from './pagamento.service';

@Module({
  imports: [AuthModule, ContextoUsuarioModule, NotificacaoModule, TypeOrmModule.forFeature([Pagamento, Pedido, Proposta])],
  controllers: [PagamentoController],
  providers: [PagamentoService],
})
export class PagamentoModule {}
