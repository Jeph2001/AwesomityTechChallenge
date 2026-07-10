import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';
import { Role } from '../enums/role.enum';

export class UsersQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}
