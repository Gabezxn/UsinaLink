import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSolicitacaoBloqueioUsinaDto {
  @IsNotEmpty() @IsString() usinaId: string;
  @IsOptional() @IsString() pedidoId?: string;
  @IsNotEmpty({ message: 'Informe o motivo do bloqueio.' }) @IsString() motivo: string;
  @IsNotEmpty({ message: 'Descreva o ocorrido.' }) @IsString() descricao: string;
}
