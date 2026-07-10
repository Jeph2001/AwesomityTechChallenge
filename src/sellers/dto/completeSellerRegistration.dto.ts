import { IsOptional, IsString, MinLength } from 'class-validator';

export class CompleteSellerRegistrationDto {
    @IsString()
    token: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    storeName?: string;

    @IsOptional()
    @IsString()
    storeDescription?: string;
}
