import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  Usuario, PessoaFisica, Empresa, Usina, Funcionario, EnderecoEmpresa, EnderecoUsina,
  Pedido, ItemPedido, Proposta, AvaliacaoEntrega, Pagamento, Notificacao,
  Solicitacao, SolicitacaoComercial, SolicitacaoBloqueioUsina, PecaComercial,
} from '../common/entities/core.entities';
import { SeedService } from './seed.service';
import { LimpezaTesteService } from './limpeza-teste.service';
import { LimpezaTesteController } from './limpeza-teste.controller';

@Global()
@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Usuario, PessoaFisica, Empresa, Usina, Funcionario, EnderecoEmpresa, EnderecoUsina,
      Pedido, ItemPedido, Proposta, AvaliacaoEntrega, Pagamento, Notificacao,
      Solicitacao, SolicitacaoComercial, SolicitacaoBloqueioUsina, PecaComercial,
    ]),
  ],
  controllers: [LimpezaTesteController],
  providers: [SeedService, LimpezaTesteService],
})
export class DatabaseModule {}
