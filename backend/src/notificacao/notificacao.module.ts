import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Notificacao } from '../common/entities/core.entities';
import { NotificacaoController } from './notificacao.controller';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Notificacao])],
  controllers: [NotificacaoController],
})
export class NotificacaoModule {}
