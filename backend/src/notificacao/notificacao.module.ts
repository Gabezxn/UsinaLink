import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Notificacao } from '../common/entities/core.entities';
import { NotificacaoController } from './notificacao.controller';
import { NotificacaoService } from './notificacao.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Notificacao])],
  controllers: [NotificacaoController],
  providers: [NotificacaoService],
  exports: [NotificacaoService],
})
export class NotificacaoModule {}
