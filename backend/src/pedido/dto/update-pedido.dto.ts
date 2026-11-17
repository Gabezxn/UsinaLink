import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePedidoDto {
  @IsOptional() @IsString() urgencia?: string;
  @IsOptional() @IsString() @MaxLength(2000) observacoes?: string;
  @IsOptional() @IsString() prazoEntregaDias?: string;
}
