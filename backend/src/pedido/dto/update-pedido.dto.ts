import { IsOptional, IsString } from 'class-validator';

export class UpdatePedidoDto {
  @IsOptional() @IsString() urgencia?: string;
  @IsOptional() @IsString() observacoes?: string;
  @IsOptional() @IsString() prazoEntregaDias?: string;
}
