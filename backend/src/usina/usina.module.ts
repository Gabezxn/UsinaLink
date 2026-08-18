import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContextoUsuarioModule } from '../contexto-usuario/contexto-usuario.module';
import { Usina } from '../common/entities/core.entities';
import { UsinaController } from './usina.controller';
import { UsinaService } from './usina.service';

@Module({
  imports: [ContextoUsuarioModule, TypeOrmModule.forFeature([Usina])],
  controllers: [UsinaController],
  providers: [UsinaService],
})
export class UsinaModule {}
