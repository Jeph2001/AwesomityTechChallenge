import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';
import { OrderStatus } from '../enums/orderStatus.enum';

export class OrdersQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;
}
