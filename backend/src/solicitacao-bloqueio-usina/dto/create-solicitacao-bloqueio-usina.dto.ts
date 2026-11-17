import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSolicitacaoBloqueioUsinaDto {
  @IsNotEmpty() @IsString() usinaId: string;
  @IsOptional() @IsString() pedidoId?: string;
  @IsNotEmpty({ message: 'Informe o motivo do bloqueio.' }) @IsString() @MaxLength(2000) motivo: string;
  @IsNotEmpty({ message: 'Descreva o ocorrido.' }) @IsString() @MaxLength(2000) descricao: string;
}
