import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUsinaDto {
  @IsNotEmpty() @IsString() @MaxLength(200) nome: string;
  @IsNotEmpty() @IsString() cnpj: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() @MaxLength(200) razaoSocial?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() @MaxLength(200) responsavel?: string;
  @IsOptional() @IsString() especialidade?: string;
  @IsOptional() @IsObject() endereco?: Record<string, unknown>;
}
