import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Usina } from '../common/entities/core.entities';

@Injectable()
export class UsinaService {
  constructor(@InjectRepository(Usina) private readonly usinas: Repository<Usina>) {}

  buscar(nome?: string, cnpj?: string) {
    if (cnpj) return this.usinas.findOne({ where: { cnpj: String(cnpj).replace(/\D/g, '') } });
    return this.usinas.findOne({ where: [{ nomeFantasia: Like(`%${nome || ''}%`) }, { razaoSocial: Like(`%${nome || ''}%`) }] });
  }

  async porId(id: number) {
    const usina = await this.usinas.findOne({ where: { idUsina: id } });
    if (!usina) throw new NotFoundException('Usina não encontrada.');
    return usina;
  }
}
