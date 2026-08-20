import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { PecaComercial, Usina } from '../common/entities/core.entities';
import { CreatePecaComercialDto } from './dto/create-peca-comercial.dto';

@Injectable()
export class PecaComercialService {
  constructor(
    @InjectRepository(PecaComercial) private readonly pecas: Repository<PecaComercial>,
    @InjectRepository(Usina) private readonly usinas: Repository<Usina>,
    private readonly ctx: ContextoUsuarioService,
  ) {}

  private async enrich(peca: PecaComercial) {
    const usina = await this.usinas.findOne({ where: { idUsina: peca.idUsina } });
    return { ...peca, usina };
  }

  async criar(dto: CreatePecaComercialDto, user: any) {
    const idUsina = await this.ctx.obterUsinaId(user.sub);
    const peca = await this.pecas.save(this.pecas.create({
      idUsina,
      nome: dto.nome,
      material: dto.material,
      categoria: dto.categoria,
      descricao: dto.descricao,
      estoque: dto.estoque ? Number(dto.estoque) : undefined,
      unidadeEstoque: dto.unidadeEstoque || 'unidades',
      valorUnitario: dto.valorUnitario ? Number(dto.valorUnitario) : undefined,
      prazoEntregaDias: dto.prazoEntregaDias ? Number(dto.prazoEntregaDias) : undefined,
      ativo: true,
    }));
    return this.enrich(peca);
  }

  async listar() {
    const pecas = await this.pecas.find({ where: { ativo: true }, order: { criadoEm: 'DESC' } });
    return Promise.all(pecas.map((p) => this.enrich(p)));
  }

  async minhas(user: any) {
    const idUsina = await this.ctx.obterUsinaId(user.sub);
    return this.pecas.find({ where: { idUsina }, order: { criadoEm: 'DESC' } });
  }

  async remover(id: number, user: any) {
    const idUsina = await this.ctx.obterUsinaId(user.sub);
    const peca = await this.pecas.findOne({ where: { idPecaComercial: id } });
    if (!peca) throw new NotFoundException('Peça comercial não encontrada.');
    if (peca.idUsina !== idUsina) throw new ForbiddenException();
    await this.pecas.update({ idPecaComercial: id }, { ativo: false });
    return { ok: true };
  }
}
