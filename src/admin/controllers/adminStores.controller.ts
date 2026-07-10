import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/users/enums/role.enum';
import { StoresService } from 'src/stores/stores.service';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';
import { UpdateStoreDto } from 'src/stores/dto/updateStore.dto';
import { AdminCreateStoreDto } from '../dto/adminCreateStore.dto';

@ApiTags('admin-stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/stores')
export class AdminStoresController {
    constructor(private readonly storesService: StoresService) { }

    @Get()
    @ApiOperation({ summary: 'List all stores' })
    findAll(@Query() query: PaginationQueryDto) {
        return this.storesService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a store by id' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.storesService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a store for a user' })
    create(@Body() dto: AdminCreateStoreDto) {
        return this.storesService.create(dto.ownerId, dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a store' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateStoreDto,
    ) {
        return this.storesService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a store' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.storesService.remove(id);
    }
}
