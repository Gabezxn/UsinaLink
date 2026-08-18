import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateEmpresaDto {
  @IsNotEmpty() @IsString() nome: string;
  @IsNotEmpty() @IsString() cnpj: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() razaoSocial?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() responsavel?: string;
  @IsOptional() @IsString() cargo?: string;
  @IsOptional() @IsObject() endereco?: Record<string, unknown>;
}
