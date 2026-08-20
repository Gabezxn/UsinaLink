import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { Empresa, EnderecoEmpresa } from '../common/entities/core.entities';
import { UpdatePerfilEmpresaDto } from './dto/update-perfil-empresa.dto';

@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(EnderecoEmpresa) private readonly enderecos: Repository<EnderecoEmpresa>,
    private readonly ctx: ContextoUsuarioService,
  ) {}

  buscar(nome?: string, cnpj?: string) {
    if (cnpj) return this.empresas.findOne({ where: { cnpj: String(cnpj).replace(/\D/g, '') } });
    return this.empresas.findOne({ where: [{ nomeFantasia: Like(`%${nome || ''}%`) }, { razaoSocial: Like(`%${nome || ''}%`) }] });
  }

  async porId(id: number) {
    const empresa = await this.empresas.findOne({ where: { idEmpresa: id } });
    if (!empresa) throw new NotFoundException('Empresa não encontrada.');
    return empresa;
  }

  async meuPerfil(user: any) {
    const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
    const empresa = await this.porId(idEmpresa);
    const endereco = await this.enderecos.findOne({ where: { idEmpresa } });
    return { ...empresa, endereco: endereco || null };
  }

  async atualizarPerfil(user: any, dto: UpdatePerfilEmpresaDto) {
    const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
    const { cep, rua, numero, bairro, cidade, estado, complemento, ...dadosEmpresa } = dto;
    if (Object.values(dadosEmpresa).some((v) => v !== undefined)) {
      await this.empresas.update({ idEmpresa }, dadosEmpresa);
    }

    const enderecoDto = { cep, rua, numero, bairro, cidade, estado, complemento };
    const temEndereco = Object.values(enderecoDto).some(v => v !== undefined);
    if (temEndereco) {
      const existente = await this.enderecos.findOne({ where: { idEmpresa } });
      if (existente) await this.enderecos.update({ idEndereco: existente.idEndereco }, enderecoDto);
      else await this.enderecos.save(this.enderecos.create({ idEmpresa, ...enderecoDto }));
    }

    return this.meuPerfil(user);
  }
}
