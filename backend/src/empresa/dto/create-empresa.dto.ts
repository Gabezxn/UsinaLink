import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEmpresaDto {
  @IsNotEmpty() @IsString() @MaxLength(200) nome: string;
  @IsNotEmpty() @IsString() cnpj: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() @MaxLength(200) razaoSocial?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() @MaxLength(200) responsavel?: string;
  @IsOptional() @IsString() @MaxLength(200) cargo?: string;
  @IsOptional() @IsObject() endereco?: Record<string, unknown>;
}
