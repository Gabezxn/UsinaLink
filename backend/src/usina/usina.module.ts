import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContextoUsuarioModule } from '../contexto-usuario/contexto-usuario.module';
import { Usina, EnderecoUsina } from '../common/entities/core.entities';
import { UsinaController } from './usina.controller';
import { UsinaService } from './usina.service';

@Module({
  imports: [AuthModule, ContextoUsuarioModule, TypeOrmModule.forFeature([Usina, EnderecoUsina])],
  controllers: [UsinaController],
  providers: [UsinaService],
})
export class UsinaModule {}
