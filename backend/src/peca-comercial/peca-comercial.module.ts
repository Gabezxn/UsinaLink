import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContextoUsuarioModule } from '../contexto-usuario/contexto-usuario.module';
import { PecaComercial, Usina } from '../common/entities/core.entities';
import { PecaComercialController } from './peca-comercial.controller';
import { PecaComercialService } from './peca-comercial.service';

@Module({
  imports: [AuthModule, ContextoUsuarioModule, TypeOrmModule.forFeature([PecaComercial, Usina])],
  controllers: [PecaComercialController],
  providers: [PecaComercialService],
})
export class PecaComercialModule {}
