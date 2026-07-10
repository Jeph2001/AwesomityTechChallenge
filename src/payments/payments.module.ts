import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';
import { ShopperPaymentsController } from './controllers/shopperPayments.controller';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
    imports: [TypeOrmModule.forFeature([Payment]), OrdersModule],
    controllers: [ShopperPaymentsController],
    providers: [PaymentsService],
    exports: [PaymentsService, TypeOrmModule],
})
export class PaymentsModule { }
