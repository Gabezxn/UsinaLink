import { BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { SolicitacaoBloqueioUsinaService } from './solicitacao-bloqueio-usina.service';
import { UpdateStatusSolicitacaoBloqueioDto } from './dto/update-status-solicitacao-bloqueio.dto';

describe('SEC-17 decisão do admin sobre bloqueio', () => {
  it('DTO só aceita em_analise, aprovada ou rejeitada', async () => {
    const ok = Object.assign(new UpdateStatusSolicitacaoBloqueioDto(), { status: 'aprovada' });
    const ruim = Object.assign(new UpdateStatusSolicitacaoBloqueioDto(), { status: 'cancelada' });
    expect(await validate(ok)).toHaveLength(0);
    expect(await validate(ruim)).not.toHaveLength(0);
  });

  it('não decide duas vezes e grava o admin do token como analisadoPor', async () => {
    const solicitacoes = { findOne: jest.fn(), update: jest.fn() } as any;
    const bloqueios = { save: jest.fn(x => x), create: jest.fn(x => x) } as any;
    const service = new (SolicitacaoBloqueioUsinaService as any)(solicitacoes, bloqueios, {});
    solicitacoes.findOne.mockResolvedValue({ idSolicitacao: 1, idUsina: 2, status: 'aprovada' });
    await expect(service.updateStatus(1, { status: 'aprovada' }, { sub: 7 })).rejects.toThrow(BadRequestException);
    expect(bloqueios.save).not.toHaveBeenCalled();
    solicitacoes.findOne.mockResolvedValue({ idSolicitacao: 1, idUsina: 2, status: 'pendente' });
    await service.updateStatus(1, { status: 'rejeitada', analisadoPor: 'fake' } as any, { sub: 7 });
    expect(solicitacoes.update).toHaveBeenCalledWith({ idSolicitacao: 1 }, expect.objectContaining({ analisadoPor: '7' }));
  });
});
