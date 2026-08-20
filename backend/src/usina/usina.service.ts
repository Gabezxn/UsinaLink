import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { Usina, EnderecoUsina } from '../common/entities/core.entities';
import { UpdatePerfilUsinaDto } from './dto/update-perfil-usina.dto';

@Injectable()
export class UsinaService {
  constructor(
    @InjectRepository(Usina) private readonly usinas: Repository<Usina>,
    @InjectRepository(EnderecoUsina) private readonly enderecos: Repository<EnderecoUsina>,
    private readonly ctx: ContextoUsuarioService,
  ) {}

  buscar(nome?: string, cnpj?: string) {
    if (cnpj) return this.usinas.findOne({ where: { cnpj: String(cnpj).replace(/\D/g, '') } });
    return this.usinas.findOne({ where: [{ nomeFantasia: Like(`%${nome || ''}%`) }, { razaoSocial: Like(`%${nome || ''}%`) }] });
  }

  async porId(id: number) {
    const usina = await this.usinas.findOne({ where: { idUsina: id } });
    if (!usina) throw new NotFoundException('Usina não encontrada.');
    return usina;
  }

  async meuPerfil(user: any) {
    const idUsina = await this.ctx.obterUsinaId(user.sub);
    const usina = await this.porId(idUsina);
    const endereco = await this.enderecos.findOne({ where: { idUsina } });
    return { ...usina, endereco: endereco || null };
  }

  async atualizarPerfil(user: any, dto: UpdatePerfilUsinaDto) {
    const idUsina = await this.ctx.obterUsinaId(user.sub);
    const { cep, rua, numero, bairro, cidade, estado, complemento, ...dadosUsina } = dto;
    if (Object.values(dadosUsina).some((v) => v !== undefined)) {
      await this.usinas.update({ idUsina }, dadosUsina);
    }

    const enderecoDto = { cep, rua, numero, bairro, cidade, estado, complemento };
    const temEndereco = Object.values(enderecoDto).some((v) => v !== undefined);
    if (temEndereco) {
      const existente = await this.enderecos.findOne({ where: { idUsina } });
      if (existente) await this.enderecos.update({ idEndereco: existente.idEndereco }, enderecoDto);
      else await this.enderecos.save(this.enderecos.create({ idUsina, ...enderecoDto }));
    }

    return this.meuPerfil(user);
  }
}
