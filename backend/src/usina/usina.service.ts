import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { Usina, EnderecoUsina, PecaComercial, AvaliacaoEntrega } from '../common/entities/core.entities';
import { UpdatePerfilUsinaDto } from './dto/update-perfil-usina.dto';

@Injectable()
export class UsinaService {
  constructor(
    @InjectRepository(Usina) private readonly usinas: Repository<Usina>,
    @InjectRepository(EnderecoUsina) private readonly enderecos: Repository<EnderecoUsina>,
    @InjectRepository(PecaComercial) private readonly pecas: Repository<PecaComercial>,
    @InjectRepository(AvaliacaoEntrega) private readonly avaliacoes: Repository<AvaliacaoEntrega>,
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

  /** Dados que podem ser vistos por qualquer comprador (sem CNPJ, e-mail pessoal etc. de outros campos internos). */
  private async publico(usina: Usina) {
    const [endereco, pecas, avaliacoes] = await Promise.all([
      this.enderecos.findOne({ where: { idUsina: usina.idUsina } }),
      this.pecas.count({ where: { idUsina: usina.idUsina, ativo: true } }),
      this.avaliacoes.find({ where: { idUsinaAvaliada: usina.idUsina }, order: { criadoEm: 'DESC' } }),
    ]);
    const notas = avaliacoes.map(a => a.nota).filter((n): n is number => typeof n === 'number');
    return {
      idUsina: usina.idUsina,
      nome: usina.nomeFantasia || usina.razaoSocial,
      razaoSocial: usina.razaoSocial,
      especialidade: usina.especialidade,
      descricao: usina.descricao,
      capacidadeMensal: usina.capacidadeMensal,
      prazoMedio: usina.prazoMedio,
      turnos: usina.turnos,
      maquinasDisponiveis: usina.maquinasDisponiveis,
      certificacoes: usina.certificacoes || [],
      email: usina.email,
      telefone: usina.telefone,
      cidade: endereco?.cidade,
      estado: endereco?.estado,
      quantidadePecas: pecas,
      quantidadeAvaliacoes: notas.length,
      mediaAvaliacoes: notas.length ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10 : 0,
      avaliacoes,
    };
  }

  async diretorio() {
    const usinas = await this.usinas.find({ order: { nomeFantasia: 'ASC' } });
    const lista = await Promise.all(usinas.map(u => this.publico(u)));
    // a lista nao precisa do texto de cada avaliacao
    return lista.map(({ avaliacoes, ...resto }) => resto);
  }

  async diretorioDetalhe(id: number) {
    const usina = await this.porId(id);
    const dados = await this.publico(usina);
    const pecas = await this.pecas.find({ where: { idUsina: id, ativo: true }, order: { criadoEm: 'DESC' } });
    return { ...dados, pecas };
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
