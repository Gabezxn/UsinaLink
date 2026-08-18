import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContextoUsuarioModule } from '../contexto-usuario/contexto-usuario.module';
import { Empresa } from '../common/entities/core.entities';
import { EmpresaController } from './empresa.controller';
import { EmpresaService } from './empresa.service';

@Module({
  imports: [ContextoUsuarioModule, TypeOrmModule.forFeature([Empresa])],
  controllers: [EmpresaController],
  providers: [EmpresaService],
})
export class EmpresaModule {}
