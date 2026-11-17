import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Favorito } from '../common/entities/core.entities';
import { FavoritoController } from './favorito.controller';
import { FavoritoService } from './favorito.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Favorito])],
  controllers: [FavoritoController],
  providers: [FavoritoService],
})
export class FavoritoModule {}
