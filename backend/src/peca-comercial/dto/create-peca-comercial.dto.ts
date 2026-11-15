import { IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsImagem } from '../../common/anexo';

export class CreatePecaComercialDto {
  @IsNotEmpty({ message: 'Informe o nome da peça.' }) @IsString() @MaxLength(200) nome: string;
  @IsOptional() @IsString() @MaxLength(200) material?: string;
  @IsOptional() @IsString() @MaxLength(200) categoria?: string;
  @IsOptional() @IsString() @MaxLength(2000) descricao?: string;
  @IsOptional() @IsString() @IsImagem() imagem?: string;
  @IsOptional() @IsNumberString({}, { message: 'Estoque deve ser numérico.' }) estoque?: string;
  @IsOptional() @IsString() unidadeEstoque?: string;
  @IsNotEmpty({ message: 'Informe o valor unitário da peça.' }) @IsNumberString({}, { message: 'Valor unitário deve ser numérico.' }) valorUnitario: string;
  @IsOptional() @IsNumberString({}, { message: 'Prazo de entrega deve ser numérico.' }) prazoEntregaDias?: string;
}
