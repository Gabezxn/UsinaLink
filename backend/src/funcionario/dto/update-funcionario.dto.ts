import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateFuncionarioDto {
  @IsOptional() @IsString() @MaxLength(200) nome?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(200) cargo?: string;
  @IsOptional() @IsString() tipo?: string;
  @IsOptional() @IsString() status?: string;
}
