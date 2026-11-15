import { IsEmail, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePerfilEmpresaDto {
  @IsOptional() @IsString() @MaxLength(200) razaoSocial?: string;
  @IsOptional() @IsString() @MaxLength(200) nomeFantasia?: string;
  @IsOptional() @IsString() setorAtuacao?: string;
  @IsOptional() @IsString() porte?: string;
  @IsOptional() @IsString() @MaxLength(2000) descricao?: string;
  @IsOptional() @IsEmail({}, { message: 'E-mail inválido.' }) email?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() site?: string;
  @IsOptional() @IsString() @MaxLength(200) responsavel?: string;
  @IsOptional() @IsString() cep?: string;
  @IsOptional() @IsString() rua?: string;
  @IsOptional() @IsString() numero?: string;
  @IsOptional() @IsString() bairro?: string;
  @IsOptional() @IsString() cidade?: string;
  @IsOptional() @IsString() estado?: string;
  @IsOptional() @IsString() complemento?: string;
  @IsOptional() @IsString() inscricaoEstadual?: string;
  @IsOptional() @IsString() contratoSocialArquivo?: string;
  @IsOptional() @IsString() contratoSocialNome?: string;
  @IsOptional() @IsString() alvaraArquivo?: string;
  @IsOptional() @IsString() alvaraNome?: string;
  @IsOptional() @IsString() certificacoes?: string;
  @IsOptional() @IsObject() notificacoes?: Record<string, boolean>;
}
