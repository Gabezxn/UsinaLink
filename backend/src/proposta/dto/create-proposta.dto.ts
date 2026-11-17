import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsNaoNegativoTexto, IsPositivoTexto } from '../../common/numeros';

export class CreatePropostaDto {
  @IsOptional() @IsString() pedidoId?: string;
  @IsOptional() @IsString() solicitacaoId?: string;
  @IsOptional() @IsString() usinaId?: string;
  @IsOptional() @IsString() empresaId?: string;
  @IsOptional() @IsString() usina?: string;
  @IsOptional() @IsString() cliente?: string;
  @IsOptional() @IsString() @MaxLength(200) peca?: string;
  @IsNotEmpty({ message: 'Informe o valor da proposta.' }) @IsPositivoTexto('Informe um valor de proposta maior que zero.') valor: string;
  @IsNotEmpty({ message: 'Informe o prazo da proposta.' }) @IsString() @MaxLength(100, { message: 'Prazo muito longo (máximo de 100 caracteres).' }) prazo: string;
  @IsOptional() @IsNaoNegativoTexto('Frete deve ser um valor de zero em diante.') frete?: string;
  @IsOptional() @IsString() avaliacao?: string;
  @IsOptional() @IsString() @MaxLength(2000) observacao?: string;
}
