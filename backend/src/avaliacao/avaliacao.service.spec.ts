import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AvaliacaoService } from './avaliacao.service';

function repoMock() {
  return { findOne: jest.fn(), find: jest.fn(), create: jest.fn(x => x), save: jest.fn(x => x), update: jest.fn() } as any;
}

describe('AvaliacaoService', () => {
  let avaliacoes: ReturnType<typeof repoMock>;
  let pedidos: ReturnType<typeof repoMock>;
  let propostas: ReturnType<typeof repoMock>;
  let compras: ReturnType<typeof repoMock>;
  let ctx: any;
  let service: AvaliacaoService;
  const user = { sub: 10 };

  beforeEach(() => {
    avaliacoes = repoMock();
    pedidos = repoMock();
    propostas = repoMock();
    compras = repoMock();
    ctx = {
      obterEmpresaId: jest.fn().mockResolvedValue(1),
      obterUsinaId: jest.fn().mockResolvedValue(2),
      obterComprador: jest.fn().mockResolvedValue({ idEmpresa: 1 }),
    };
    service = new AvaliacaoService(avaliacoes, pedidos, propostas, compras, ctx);
  });

  it('rejeita nota fora do intervalo de 1 a 5', async () => {
    await expect(service.create({ pedidoId: '1', notaGeral: 9, qualidade: 5, prazo: 5, comunicacao: 5 } as any, user)).rejects.toThrow(BadRequestException);
  });

  it('rejeita quando o pedido nao existe ou nao esta em status avaliavel', async () => {
    pedidos.findOne.mockResolvedValue(null);
    await expect(service.create({ pedidoId: '1', notaGeral: 5, qualidade: 5, prazo: 5, comunicacao: 5 } as any, user)).rejects.toThrow(BadRequestException);
  });

  it('rejeita quando o pedido nao pertence a empresa do token (nao deixa avaliar pedido de outra empresa)', async () => {
    pedidos.findOne.mockResolvedValue({ idPedido: 1, status: 'em_negociacao', idEmpresaCompradora: 999 });
    await expect(service.create({ pedidoId: '1', notaGeral: 5, qualidade: 5, prazo: 5, comunicacao: 5 } as any, user)).rejects.toThrow(ForbiddenException);
  });

  it('rejeita quando o pedido ja foi avaliado', async () => {
    pedidos.findOne.mockResolvedValue({ idPedido: 1, status: 'em_negociacao', idEmpresaCompradora: 1 });
    propostas.findOne.mockResolvedValue({ idUsina: 5 });
    avaliacoes.findOne.mockResolvedValue({ idAvaliacao: 1 });
    await expect(service.create({ pedidoId: '1', notaGeral: 5, qualidade: 5, prazo: 5, comunicacao: 5 } as any, user)).rejects.toThrow(BadRequestException);
  });

  it('cria a avaliacao com as 4 notas quando tudo esta correto', async () => {
    pedidos.findOne.mockResolvedValue({ idPedido: 1, status: 'em_negociacao', idEmpresaCompradora: 1 });
    propostas.findOne.mockResolvedValue({ idUsina: 5 });
    avaliacoes.findOne.mockResolvedValue(null);
    const resultado = await service.create({ pedidoId: '1', notaGeral: 4, qualidade: 3, prazo: 5, comunicacao: 2, comentario: 'ok' } as any, user);
    expect(resultado).toMatchObject({ idPedido: 1, idEmpresaAvaliadora: 1, idUsinaAvaliada: 5, nota: 4, qualidade: 3, prazo: 5, comunicacao: 2 });
  });

  it('pessoa fisica avalia uma compra do catalogo somente depois de entregue', async () => {
    ctx.obterComprador.mockResolvedValue({ idPessoaFisica: 7 });
    compras.findOne.mockResolvedValue({ idSolicitacaoComercial: 3, idPessoaFisica: 7, idUsina: 5, status: 'enviada' });
    await expect(service.create({ solicitacaoComercialId: '3', notaGeral: 5, qualidade: 5, prazo: 5, comunicacao: 5 } as any, user)).rejects.toThrow(BadRequestException);

    compras.findOne.mockResolvedValue({ idSolicitacaoComercial: 3, idPessoaFisica: 7, idUsina: 5, status: 'entregue' });
    avaliacoes.findOne.mockResolvedValue(null);
    const resultado = await service.create({ solicitacaoComercialId: '3', notaGeral: 4, qualidade: 4, prazo: 4, comunicacao: 4 } as any, user);
    expect(resultado).toMatchObject({ idSolicitacaoComercial: 3, idPessoaFisicaAvaliadora: 7, idUsinaAvaliada: 5, nota: 4 });
  });

  it('nao deixa avaliar a compra de outra pessoa', async () => {
    ctx.obterComprador.mockResolvedValue({ idPessoaFisica: 7 });
    compras.findOne.mockResolvedValue({ idSolicitacaoComercial: 3, idPessoaFisica: 99, idUsina: 5, status: 'entregue' });
    await expect(service.create({ solicitacaoComercialId: '3', notaGeral: 5, qualidade: 5, prazo: 5, comunicacao: 5 } as any, user)).rejects.toThrow(ForbiddenException);
  });

  it('answer() so deixa a usina responder avaliacao sobre ela mesma', async () => {
    avaliacoes.findOne.mockResolvedValue({ idAvaliacao: 1, idUsinaAvaliada: 999 });
    await expect(service.answer(1, { respostaDaUsina: 'oi' } as any, user)).rejects.toThrow(ForbiddenException);
  });
});
