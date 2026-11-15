import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePropostaDto {
  @IsOptional() @IsString() valor?: string;
  @IsOptional() @IsString() prazo?: string;
  @IsOptional() @IsString() frete?: string;
  @IsOptional() @IsString() @MaxLength(2000) observacao?: string;
  @IsOptional() @IsString() status?: string;
}
