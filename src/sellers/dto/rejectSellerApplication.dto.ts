import { IsOptional, IsString } from 'class-validator';

export class RejectSellerApplicationDto {
    @IsOptional()
    @IsString()
    reason?: string;
}
