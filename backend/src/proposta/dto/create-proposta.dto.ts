import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreatePropostaDto {
  @IsOptional() @IsString() pedidoId?: string;
  @IsOptional() @IsString() solicitacaoId?: string;
  @IsOptional() @IsString() usinaId?: string;
  @IsOptional() @IsString() empresaId?: string;
  @IsOptional() @IsString() usina?: string;
  @IsOptional() @IsString() cliente?: string;
  @IsOptional() @IsString() peca?: string;
  @IsNotEmpty({ message: 'Informe o valor da proposta.' }) @IsNumberString({}, { message: 'Valor deve ser numerico.' }) valor: string;
  @IsNotEmpty({ message: 'Informe o prazo da proposta.' }) @IsString() prazo: string;
  @IsOptional() @IsString() frete?: string;
  @IsOptional() @IsString() avaliacao?: string;
  @IsOptional() @IsString() observacao?: string;
}
