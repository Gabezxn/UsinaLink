import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa, Usina, Funcionario } from '../common/entities/core.entities';

@Injectable()
export class ContextoUsuarioService {
  constructor(
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(Usina) private readonly usinas: Repository<Usina>,
    @InjectRepository(Funcionario) private readonly funcionarios: Repository<Funcionario>,
  ) {}

  async obterEmpresaId(idUsuario: number): Promise<number> {
    const empresa = await this.empresas.findOne({ where: { idUsuario } });
    if (empresa) return empresa.idEmpresa;
    const funcionario = await this.funcionarios.findOne({ where: { idUsuario, status: 'ativo' } });
    if (funcionario?.idEmpresa) return funcionario.idEmpresa;
    throw new ForbiddenException('Usuario sem vinculo ativo com empresa.');
  }

  async obterUsinaId(idUsuario: number): Promise<number> {
    const usina = await this.usinas.findOne({ where: { idUsuario } });
    if (usina) return usina.idUsina;
    const funcionario = await this.funcionarios.findOne({ where: { idUsuario, status: 'ativo' } });
    if (funcionario?.idUsina) return funcionario.idUsina;
    throw new ForbiddenException('Usuario sem vinculo ativo com usina.');
  }
}
