import { IsString, MinLength } from "class-validator";

export class RegisterDto {
    @IsString()
    @MinLength(3)
    fullName: string;

    @IsString()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;
}