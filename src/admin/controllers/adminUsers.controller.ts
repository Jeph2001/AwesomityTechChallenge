import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/users/enums/role.enum';
import { UsersService } from 'src/users/users.service';
import { UsersQueryDto } from 'src/users/dto/usersQuery.dto';
import { UpdateUserAdminDto } from 'src/users/dto/updateUserAdmin.dto';

@ApiTags('admin-users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @ApiOperation({ summary: 'List all users' })
    findAll(@Query() query: UsersQueryDto) {
        return this.usersService.findAll(query, query.role);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a user by id' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a user (role, status, profile)' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateUserAdminDto,
    ) {
        return this.usersService.updateByAdmin(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a user' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.remove(id);
    }
}
