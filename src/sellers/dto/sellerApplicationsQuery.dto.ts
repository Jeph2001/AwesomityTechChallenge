import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';
import { SellerApplicationStatus } from '../enums/sellerApplicationStatus.enum';

export class SellerApplicationsQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsEnum(SellerApplicationStatus)
    status?: SellerApplicationStatus;
}
