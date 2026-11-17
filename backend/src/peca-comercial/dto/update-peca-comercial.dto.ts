import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsImagem } from '../../common/anexo';

// Campo vazio no formulario vira null (limpa o valor); campo ausente nao altera nada.
const vazioViraNulo = ({ value }: { value: unknown }) => (value === '' ? null : value);

export class UpdatePecaComercialDto {
  @IsOptional() @IsNotEmpty({ message: 'Informe o nome da peça.' }) @IsString() @MaxLength(200) nome?: string;
  @Transform(vazioViraNulo) @IsOptional() @IsString() @MaxLength(200) material?: string | null;
  @Transform(vazioViraNulo) @IsOptional() @IsString() @MaxLength(200) categoria?: string | null;
  @Transform(vazioViraNulo) @IsOptional() @IsString() @MaxLength(2000) descricao?: string | null;
  @Transform(vazioViraNulo) @IsOptional() @IsString() @IsImagem() imagem?: string | null;
  @Transform(vazioViraNulo) @IsOptional() @IsNumberString({}, { message: 'Estoque deve ser numérico.' }) estoque?: string | null;
  @Transform(vazioViraNulo) @IsOptional() @IsString() unidadeEstoque?: string | null;
  @Transform(vazioViraNulo) @IsOptional() @IsNumberString({}, { message: 'Valor unitário deve ser numérico.' }) valorUnitario?: string | null;
  @Transform(vazioViraNulo) @IsOptional() @IsNumberString({}, { message: 'Prazo de entrega deve ser numérico.' }) prazoEntregaDias?: string | null;
}
