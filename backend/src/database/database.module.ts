import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Usuario, PessoaFisica, Empresa, Usina, Funcionario, Pedido, Proposta, AvaliacaoEntrega, Pagamento, Notificacao } from '../common/entities/core.entities';
import { SeedService } from './seed.service';

@Global()
@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Usuario, PessoaFisica, Empresa, Usina, Funcionario, Pedido, Proposta, AvaliacaoEntrega, Pagamento, Notificacao]),
  ],
  providers: [SeedService],
})
export class DatabaseModule {}
