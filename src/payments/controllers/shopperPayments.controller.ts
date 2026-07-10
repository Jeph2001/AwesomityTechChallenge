import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import { Role } from 'src/users/enums/role.enum';
import { User } from 'src/users/entities/user.entity';
import { PaymentsService } from '../payments.service';
import { PayOrderDto } from '../dto/payOrder.dto';
import { OrdersService } from 'src/orders/orders.service';

@ApiTags('shopper-payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SHOPPER)
@Controller('shoppers/me/orders')
export class ShopperPaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly ordersService: OrdersService,
    ) { }

    @Post(':id/pay')
    @ApiOperation({
        summary: 'Pay for an order using mocked card or mobile money',
        description:
            'Card: 16-digit number ending in an even digit succeeds (e.g. 4242424242424242). Odd digit fails. Mobile money: phone ending in 0-7 succeeds; 8-9 fails.',
    })
    pay(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: PayOrderDto,
    ) {
        return this.paymentsService.payForOrder(user.id, id, dto);
    }

    @Get(':id/payments')
    @ApiOperation({ summary: 'List payment attempts for an order' })
    async listPayments(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        await this.ordersService.findOneForUser(id, user.id);
        return this.paymentsService.findByOrder(id);
    }
}
