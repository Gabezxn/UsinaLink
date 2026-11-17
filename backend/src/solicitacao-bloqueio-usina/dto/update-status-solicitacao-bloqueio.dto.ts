import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { SolicitacaoBloqueioStatus } from '../solicitacao-bloqueio-usina.entity';

const STATUS: SolicitacaoBloqueioStatus[] = ['em_analise', 'aprovada', 'rejeitada']; // admin decide; 'cancelada' é só do solicitante

export class UpdateStatusSolicitacaoBloqueioDto {
  @IsIn(STATUS, { message: 'Status invalido.' }) status: SolicitacaoBloqueioStatus;
  @IsOptional() @IsString() @MaxLength(1000) respostaModeracao?: string;
}
