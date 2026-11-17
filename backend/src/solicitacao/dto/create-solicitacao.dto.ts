import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsAnexo } from '../../common/anexo';
import { IsDataFutura, IsInteiroPositivoTexto, IsUrgencia } from '../../common/numeros';

export class CreateSolicitacaoDto {
  @IsNotEmpty({ message: 'Informe o nome da peça.' }) @IsString() @MaxLength(200) peca: string;
  @IsNotEmpty({ message: 'Selecione uma categoria.' }) @IsString() @MaxLength(200) categoria: string;
  @IsNotEmpty({ message: 'Informe o material.' }) @IsString() @MaxLength(200) material: string;
  @IsNotEmpty({ message: 'Informe a quantidade.' }) @IsInteiroPositivoTexto('Quantidade deve ser um número inteiro maior que zero.') quantidade: string;
  @IsNotEmpty({ message: 'Informe o prazo desejado.' }) @IsDataFutura('Informe uma data de prazo válida, de hoje em diante.') prazoDesejado: string;
  @IsNotEmpty({ message: 'Selecione a urgência.' }) @IsUrgencia() urgencia: string;
  @IsNotEmpty({ message: 'Informe o local de entrega.' }) @IsString() @MaxLength(300) localEntrega: string;
  @IsNotEmpty({ message: 'Informe a descrição técnica.' }) @IsString() @MaxLength(2000) descricao: string;
  @IsNotEmpty({ message: 'Anexe um arquivo técnico.' }) @IsString() @IsAnexo() arquivoTecnico: string;
  @IsNotEmpty({ message: 'Anexe um arquivo técnico.' }) @IsString() @MaxLength(200) arquivoTecnicoNome: string;
}
