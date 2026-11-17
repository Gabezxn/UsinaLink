import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  Usuario, PessoaFisica, Empresa, Usina, Funcionario, EnderecoEmpresa, EnderecoUsina,
  Pedido, ItemPedido, Proposta, AvaliacaoEntrega, Pagamento, Notificacao,
  Solicitacao, SolicitacaoComercial, SolicitacaoBloqueioUsina, PecaComercial, HistoricoStatusPedido, ConfiguracaoSistema,
} from '../common/entities/core.entities';
import { SeedService } from './seed.service';
import { PopularContasService } from './popular-contas.service';
import { PopularContasController } from './popular-contas.controller';

@Global()
@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Usuario, PessoaFisica, Empresa, Usina, Funcionario, EnderecoEmpresa, EnderecoUsina,
      Pedido, ItemPedido, Proposta, AvaliacaoEntrega, Pagamento, Notificacao,
      Solicitacao, SolicitacaoComercial, SolicitacaoBloqueioUsina, PecaComercial, HistoricoStatusPedido, ConfiguracaoSistema,
    ]),
  ],
  controllers: [PopularContasController],
  providers: [SeedService, PopularContasService],
})
export class DatabaseModule {}
