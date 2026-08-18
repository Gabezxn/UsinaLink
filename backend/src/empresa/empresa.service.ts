import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Empresa } from '../common/entities/core.entities';

@Injectable()
export class EmpresaService {
  constructor(@InjectRepository(Empresa) private readonly empresas: Repository<Empresa>) {}

  buscar(nome?: string, cnpj?: string) {
    if (cnpj) return this.empresas.findOne({ where: { cnpj: String(cnpj).replace(/\D/g, '') } });
    return this.empresas.findOne({ where: [{ nomeFantasia: Like(`%${nome || ''}%`) }, { razaoSocial: Like(`%${nome || ''}%`) }] });
  }

  async porId(id: number) {
    const empresa = await this.empresas.findOne({ where: { idEmpresa: id } });
    if (!empresa) throw new NotFoundException('Empresa não encontrada.');
    return empresa;
  }
}
