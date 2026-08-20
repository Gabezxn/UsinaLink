import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { ENTITIES } from './common/entities/core.entities';
import { EmpresaModule } from './empresa/empresa.module';
import { FuncionarioModule } from './funcionario/funcionario.module';
import { PedidoModule } from './pedido/pedido.module';
import { PropostaModule } from './proposta/proposta.module';
import { AvaliacaoModule } from './avaliacao/avaliacao.module';
import { SolicitacaoBloqueioUsinaModule } from './solicitacao-bloqueio-usina/solicitacao-bloqueio-usina.module';
import { SolicitacaoModule } from './solicitacao/solicitacao.module';
import { SolicitacaoComercialModule } from './solicitacao-comercial/solicitacao-comercial.module';
import { PecaComercialModule } from './peca-comercial/peca-comercial.module';
import { UsuarioModule } from './usuario/usuario.module';
import { AuthModule } from './auth/auth.module';
import { ContextoUsuarioModule } from './contexto-usuario/contexto-usuario.module';
import { UsinaModule } from './usina/usina.module';
import { NotificacaoModule } from './notificacao/notificacao.module';
import { PagamentoModule } from './pagamento/pagamento.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbType = config.get<string>('DB_TYPE', 'mysql') as 'mysql' | 'postgres';
        const useSsl = config.get<string>('DB_SSL', 'false') === 'true';
        return {
          type: dbType,
          host: config.get<string>('DB_HOST', 'localhost'),
          port: config.get<number>('DB_PORT', dbType === 'postgres' ? 5432 : 3306),
          username: config.get<string>('DB_USERNAME', 'root'),
          password: config.get<string>('DB_PASSWORD', ''),
          database: config.get<string>('DB_NAME', 'usinalink'),
          entities: ENTITIES,
          synchronize: config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
          ...(dbType === 'mysql' ? { charset: 'utf8mb4' } : {}),
          ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
        };
      },
    }),
    DatabaseModule,
    AuthModule,
    ContextoUsuarioModule,
    EmpresaModule,
    UsinaModule,
    UsuarioModule,
    FuncionarioModule,
    PedidoModule,
    PropostaModule,
    AvaliacaoModule,
    SolicitacaoBloqueioUsinaModule,
    SolicitacaoModule,
    SolicitacaoComercialModule,
    PecaComercialModule,
    NotificacaoModule,
    PagamentoModule
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
})
export class AppModule {}
