import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class CreateSolicitacaoDto {
  @IsNotEmpty({ message: 'Informe o nome da peça.' }) @IsString() peca: string;
  @IsNotEmpty({ message: 'Selecione uma categoria.' }) @IsString() categoria: string;
  @IsNotEmpty({ message: 'Informe o material.' }) @IsString() material: string;
  @IsNotEmpty({ message: 'Informe a quantidade.' }) @IsNumberString({}, { message: 'Quantidade deve ser numérica.' }) quantidade: string;
  @IsNotEmpty({ message: 'Informe o prazo desejado.' }) @IsString() prazoDesejado: string;
  @IsNotEmpty({ message: 'Selecione a urgência.' }) @IsString() urgencia: string;
  @IsNotEmpty({ message: 'Informe o local de entrega.' }) @IsString() localEntrega: string;
  @IsNotEmpty({ message: 'Informe a descrição técnica.' }) @IsString() descricao: string;
  @IsNotEmpty({ message: 'Anexe um arquivo técnico.' }) @IsString() arquivoTecnico: string;
  @IsNotEmpty({ message: 'Anexe um arquivo técnico.' }) @IsString() arquivoTecnicoNome: string;
}
