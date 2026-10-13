import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateAvaliacaoDto {
  @IsOptional() @IsString() pedidoId?: string;
  @IsOptional() @IsString() solicitacaoComercialId?: string;
  @IsInt() @Min(1) @Max(5) notaGeral: number;
  @IsInt() @Min(1) @Max(5) qualidade: number;
  @IsInt() @Min(1) @Max(5) prazo: number;
  @IsInt() @Min(1) @Max(5) comunicacao: number;
  @IsOptional() @IsString() comentario?: string;
  @IsOptional() @IsString() empresaId?: string;
  @IsOptional() @IsString() usinaId?: string;
}
