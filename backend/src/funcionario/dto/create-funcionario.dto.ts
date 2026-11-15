import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFuncionarioDto {
  @IsOptional() @IsString() contexto?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsNotEmpty() @IsString() @MaxLength(200) nome: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() @MaxLength(200) cargo?: string;
  @IsOptional() @IsString() tipo?: string;
  @IsOptional() @IsString() conviteToken?: string;
}
