import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
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
import { OrdersService } from 'src/orders/orders.service';
import { PlaceOrderDto } from '../dto/placeOrder.dto';
import { OrdersQueryDto } from 'src/orders/dto/ordersQuery.dto';

@ApiTags('shopper-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SHOPPER)
@Controller('shoppers/me/orders')
export class ShopperOrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @ApiOperation({ summary: 'Place a new order' })
    placeOrder(@CurrentUser() user: User, @Body() dto: PlaceOrderDto) {
        return this.ordersService.placeOrder(user.id, dto);
    }

    @Get()
    @ApiOperation({ summary: 'View order history' })
    findAll(@CurrentUser() user: User, @Query() query: OrdersQueryDto) {
        return this.ordersService.findAll(query, query.status, undefined, user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Track a specific order status' })
    findOne(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.ordersService.findOneForUser(id, user.id);
    }
}
