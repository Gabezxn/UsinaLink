import { IsOptional, IsString } from 'class-validator';

export class UpdatePropostaDto {
  @IsOptional() @IsString() valor?: string;
  @IsOptional() @IsString() prazo?: string;
  @IsOptional() @IsString() frete?: string;
  @IsOptional() @IsString() observacao?: string;
  @IsOptional() @IsString() status?: string;
}
