import { IsIn, IsOptional, IsString } from 'class-validator';
import { SolicitacaoBloqueioStatus } from '../solicitacao-bloqueio-usina.entity';

const STATUS: SolicitacaoBloqueioStatus[] = ['pendente', 'em_analise', 'aprovada', 'rejeitada', 'cancelada'];

export class UpdateStatusSolicitacaoBloqueioDto {
  @IsIn(STATUS, { message: 'Status invalido.' }) status: SolicitacaoBloqueioStatus;
  @IsOptional() @IsString() respostaModeracao?: string;
  @IsOptional() @IsString() analisadoPor?: string;
}
