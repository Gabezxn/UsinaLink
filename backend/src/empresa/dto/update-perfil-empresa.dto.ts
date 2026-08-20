import { IsEmail, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdatePerfilEmpresaDto {
  @IsOptional() @IsString() razaoSocial?: string;
  @IsOptional() @IsString() nomeFantasia?: string;
  @IsOptional() @IsString() setorAtuacao?: string;
  @IsOptional() @IsString() porte?: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsEmail({}, { message: 'E-mail inválido.' }) email?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() site?: string;
  @IsOptional() @IsString() responsavel?: string;
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
