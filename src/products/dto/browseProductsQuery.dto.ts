import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';

export class BrowseProductsQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsUUID()
    categoryId?: string;
}
