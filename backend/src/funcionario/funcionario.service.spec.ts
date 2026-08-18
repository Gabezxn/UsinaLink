import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { FuncionarioService } from './funcionario.service';

function repoMock() {
  return { findOne: jest.fn(), find: jest.fn(), create: jest.fn(x => x), save: jest.fn(x => x), update: jest.fn(), delete: jest.fn() } as any;
}

describe('FuncionarioService', () => {
  let funcionarios: ReturnType<typeof repoMock>;
  let ctx: any;
  let service: FuncionarioService;
  const userEmpresa = { sub: 1 };

  beforeEach(() => {
    funcionarios = repoMock();
    ctx = { obterEmpresaId: jest.fn().mockResolvedValue(10), obterUsinaId: jest.fn().mockResolvedValue(20) };
    service = new FuncionarioService(funcionarios, ctx);
  });

  it('findAll filtra pela empresa do token quando o usuario e de empresa', async () => {
    await service.findAll(userEmpresa);
    expect(funcionarios.find).toHaveBeenCalledWith({ where: { idEmpresa: 10 } });
  });

  it('findAll filtra pela usina do token quando o usuario nao tem empresa vinculada', async () => {
    ctx.obterEmpresaId.mockRejectedValue(new ForbiddenException());
    await service.findAll({ sub: 2 });
    expect(funcionarios.find).toHaveBeenCalledWith({ where: { idUsina: 20 } });
  });

  it('create() ignora idEmpresa enviado pelo cliente e usa o da empresa autenticada', async () => {
    await service.create({ idEmpresa: 999, nome: 'Fulano', email: 'f@x.com' } as any, userEmpresa);
    expect(funcionarios.create).toHaveBeenCalledWith(expect.objectContaining({ idEmpresa: 10, status: 'pendente' }));
  });

  it('findOne rejeita quando o funcionario pertence a outra empresa', async () => {
    funcionarios.findOne.mockResolvedValue({ idFuncionario: 5, idEmpresa: 999 });
    await expect(service.findOne(5, userEmpresa)).rejects.toThrow(ForbiddenException);
  });

  it('findOne permite quando o funcionario pertence a empresa do token', async () => {
    funcionarios.findOne.mockResolvedValue({ idFuncionario: 5, idEmpresa: 10 });
    await expect(service.findOne(5, userEmpresa)).resolves.toMatchObject({ idFuncionario: 5 });
  });

  it('findOne lanca NotFoundException quando o id nao existe', async () => {
    funcionarios.findOne.mockResolvedValue(null);
    await expect(service.findOne(999, userEmpresa)).rejects.toThrow(NotFoundException);
  });
});
