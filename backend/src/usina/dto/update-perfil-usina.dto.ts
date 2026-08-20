import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdatePerfilUsinaDto {
  @IsOptional() @IsString() razaoSocial?: string;
  @IsOptional() @IsString() nomeFantasia?: string;
  @IsOptional() @IsString() especialidade?: string;
  @IsOptional() @IsString() capacidadeProducao?: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsEmail({}, { message: 'E-mail inválido.' }) email?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() responsavel?: string;
  @IsOptional() @IsString() cep?: string;
  @IsOptional() @IsString() rua?: string;
  @IsOptional() @IsString() numero?: string;
  @IsOptional() @IsString() bairro?: string;
  @IsOptional() @IsString() cidade?: string;
  @IsOptional() @IsString() estado?: string;
  @IsOptional() @IsString() complemento?: string;
}
