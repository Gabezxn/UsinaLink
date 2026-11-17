import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsNaoNegativoTexto, IsPositivoTexto } from '../../common/numeros';
import { IsImagem } from '../../common/anexo';

export class CreatePecaComercialDto {
  @IsNotEmpty({ message: 'Informe o nome da peça.' }) @IsString() @MaxLength(200) nome: string;
  @IsOptional() @IsString() @MaxLength(200) material?: string;
  @IsOptional() @IsString() @MaxLength(200) categoria?: string;
  @IsOptional() @IsString() @MaxLength(2000) descricao?: string;
  @IsOptional() @IsString() @IsImagem() imagem?: string;
  @IsOptional() @IsNaoNegativoTexto('Estoque deve ser um número de zero em diante.') estoque?: string;
  @IsOptional() @IsString() @MaxLength(30) unidadeEstoque?: string;
  @IsNotEmpty({ message: 'Informe o valor unitário da peça.' }) @IsPositivoTexto('O valor unitário deve ser maior que zero.') valorUnitario: string;
  @IsOptional() @IsNaoNegativoTexto('Prazo de entrega deve ser um número de dias.') prazoEntregaDias?: string;
}
