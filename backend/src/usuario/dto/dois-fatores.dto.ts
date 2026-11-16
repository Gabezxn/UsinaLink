import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerificarDoisFatoresDto {
  @IsString() @Length(48, 48, { message: 'Desafio invalido.' }) desafio: string;
  @IsNotEmpty({ message: 'Informe o codigo.' }) @IsString() codigo: string;
}

export class ReenviarDoisFatoresDto {
  @IsString() @Length(48, 48, { message: 'Desafio invalido.' }) desafio: string;
}
