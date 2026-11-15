import { IsNotEmpty, IsNumberString, IsString, MaxLength } from 'class-validator';
import { IsAnexo } from '../../common/anexo';

export class CreateSolicitacaoDto {
  @IsNotEmpty({ message: 'Informe o nome da peça.' }) @IsString() @MaxLength(200) peca: string;
  @IsNotEmpty({ message: 'Selecione uma categoria.' }) @IsString() @MaxLength(200) categoria: string;
  @IsNotEmpty({ message: 'Informe o material.' }) @IsString() @MaxLength(200) material: string;
  @IsNotEmpty({ message: 'Informe a quantidade.' }) @IsNumberString({}, { message: 'Quantidade deve ser numérica.' }) quantidade: string;
  @IsNotEmpty({ message: 'Informe o prazo desejado.' }) @IsString() prazoDesejado: string;
  @IsNotEmpty({ message: 'Selecione a urgência.' }) @IsString() urgencia: string;
  @IsNotEmpty({ message: 'Informe o local de entrega.' }) @IsString() localEntrega: string;
  @IsNotEmpty({ message: 'Informe a descrição técnica.' }) @IsString() @MaxLength(2000) descricao: string;
  @IsNotEmpty({ message: 'Anexe um arquivo técnico.' }) @IsString() @IsAnexo() arquivoTecnico: string;
  @IsNotEmpty({ message: 'Anexe um arquivo técnico.' }) @IsString() arquivoTecnicoNome: string;
}
