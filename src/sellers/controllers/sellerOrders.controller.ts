import {
    Body,
    Controller,
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
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import { Role } from 'src/users/enums/role.enum';
import { User } from 'src/users/entities/user.entity';
import { StoresService } from 'src/stores/stores.service';
import { OrdersService } from 'src/orders/orders.service';
import { OrdersQueryDto } from 'src/orders/dto/ordersQuery.dto';
import { UpdateOrderStatusDto } from 'src/orders/dto/updateOrderStatus.dto';

@ApiTags('seller-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER)
@Controller('sellers/me/orders')
export class SellerOrdersController {
    constructor(
        private readonly storesService: StoresService,
        private readonly ordersService: OrdersService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List orders for the seller store' })
    async findAll(@CurrentUser() user: User, @Query() query: OrdersQueryDto) {
        const store = await this.storesService.getOwnedStore(user.id);
        return this.ordersService.findAll(query, query.status, store.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an order from the seller store' })
    async findOne(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        const store = await this.storesService.getOwnedStore(user.id);
        return this.ordersService.findOneInStore(id, store.id);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update status of an order in the seller store' })
    async updateStatus(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateOrderStatusDto,
    ) {
        const store = await this.storesService.getOwnedStore(user.id);
        return this.ordersService.updateStatusInStore(id, store.id, dto.status);
    }
}
