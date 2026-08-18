import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { Funcionario } from '../common/entities/core.entities';

@Injectable()
export class FuncionarioService {
  constructor(
    @InjectRepository(Funcionario) private readonly funcionarios: Repository<Funcionario>,
    private readonly ctx: ContextoUsuarioService,
  ) {}

  private async donoDoChamador(user: any): Promise<{ idEmpresa?: number; idUsina?: number }> {
    try {
      return { idEmpresa: await this.ctx.obterEmpresaId(user.sub) };
    } catch {
      return { idUsina: await this.ctx.obterUsinaId(user.sub) };
    }
  }

  async findAll(user: any) {
    const { idEmpresa, idUsina } = await this.donoDoChamador(user);
    return this.funcionarios.find({ where: idEmpresa ? { idEmpresa } : { idUsina } });
  }

  async findOne(id: number, user: any) {
    const funcionario = await this.funcionarios.findOne({ where: { idFuncionario: id } });
    if (!funcionario) throw new NotFoundException('Funcionario não encontrado.');
    const { idEmpresa, idUsina } = await this.donoDoChamador(user);
    const pertence = (idEmpresa && funcionario.idEmpresa === idEmpresa) || (idUsina && funcionario.idUsina === idUsina);
    if (!pertence) throw new ForbiddenException('Funcionario nao pertence a sua empresa/usina.');
    return funcionario;
  }

  async create(dto: Partial<Funcionario>, user: any) {
    const { idEmpresa, idUsina } = await this.donoDoChamador(user);
    return this.funcionarios.save(this.funcionarios.create({ ...dto, idEmpresa, idUsina, status: 'pendente' }));
  }

  async update(id: number, dto: Partial<Funcionario>, user: any) {
    await this.findOne(id, user);
    await this.funcionarios.update({ idFuncionario: id }, dto);
    return this.findOne(id, user);
  }

  async remove(id: number, user: any) {
    const funcionario = await this.findOne(id, user);
    if (funcionario.status !== 'inativo') {
      await this.funcionarios.update({ idFuncionario: id }, { status: 'inativo' });
      return this.findOne(id, user);
    }
    await this.funcionarios.delete({ idFuncionario: id });
    return funcionario;
  }
}
