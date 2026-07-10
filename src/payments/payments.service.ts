import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Payment } from './entities/payment.entity';
import { PayOrderDto } from './dto/payOrder.dto';
import { PaymentMethod } from './enums/paymentMethod.enum';
import { PaymentStatus } from './enums/paymentStatus.enum';
import { OrdersService } from 'src/orders/orders.service';
import { OrderStatus } from 'src/orders/enums/orderStatus.enum';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
        private readonly ordersService: OrdersService,
    ) { }

    async payForOrder(userId: string, orderId: string, dto: PayOrderDto) {
        const order = await this.ordersService.findOneForUser(orderId, userId);

        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Cannot pay for a cancelled order');
        }

        const existingSuccess = await this.paymentRepo.findOne({
            where: { orderId, status: PaymentStatus.SUCCESS },
        });
        if (existingSuccess) {
            throw new ConflictException('This order has already been paid');
        }

        if (order.status !== OrderStatus.PENDING) {
            throw new BadRequestException(
                'Only pending orders can be paid. Current status: ' + order.status,
            );
        }

        const mockResult = this.mockCharge(dto);
        const providerReference = `MOCK-${dto.method.toUpperCase()}-${crypto
            .randomBytes(6)
            .toString('hex')
            .toUpperCase()}`;

        const payment = await this.paymentRepo.save(
            this.paymentRepo.create({
                orderId: order.id,
                method: dto.method,
                status: mockResult.success
                    ? PaymentStatus.SUCCESS
                    : PaymentStatus.FAILED,
                amount: Number(order.totalAmount),
                currency: 'RWF',
                providerReference,
                maskedAccount: mockResult.maskedAccount,
                mobileMoneyProvider:
                    dto.method === PaymentMethod.MOBILE_MONEY
                        ? (dto.provider ?? null)
                        : null,
                failureReason: mockResult.success ? null : mockResult.failureReason,
                metadata: {
                    mocked: true,
                    method: dto.method,
                    ...mockResult.metadata,
                },
            }),
        );

        if (!mockResult.success) {
            return {
                message: 'Payment failed',
                payment,
                order,
            };
        }

        const confirmedOrder = await this.ordersService.updateStatus(
            order.id,
            OrderStatus.CONFIRMED,
        );

        return {
            message: 'Payment successful',
            payment,
            order: confirmedOrder,
        };
    }

    async findByOrder(orderId: string): Promise<Payment[]> {
        return this.paymentRepo.find({
            where: { orderId },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Payment> {
        const payment = await this.paymentRepo.findOne({
            where: { id },
            relations: { order: true },
        });
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }
        return payment;
    }

    private mockCharge(dto: PayOrderDto): {
        success: boolean;
        maskedAccount: string;
        failureReason?: string;
        metadata: Record<string, unknown>;
    } {
        if (dto.method === PaymentMethod.CARD) {
            const cardNumber = dto.cardNumber!;
            const last4 = cardNumber.slice(-4);
            const maskedAccount = `**** **** **** ${last4}`;

            // Mock rule: cards ending with an even digit succeed.
            // Use 4242424242424242 for success, 4000000000000002 for failure examples.
            const lastDigit = Number(cardNumber[cardNumber.length - 1]);
            const success = lastDigit % 2 === 0;

            return {
                success,
                maskedAccount,
                failureReason: success
                    ? undefined
                    : 'Mock card payment declined by issuer',
                metadata: {
                    cardHolderName: dto.cardHolderName,
                    expiryMonth: dto.expiryMonth,
                    expiryYear: dto.expiryYear,
                    brand: cardNumber.startsWith('4') ? 'visa' : 'mastercard',
                },
            };
        }

        if (dto.method === PaymentMethod.MOBILE_MONEY) {
            const phoneNumber = dto.phoneNumber!.replace(/\s+/g, '');
            const maskedAccount = `${phoneNumber.slice(0, 4)}****${phoneNumber.slice(-3)}`;
            const lastDigit = Number(phoneNumber[phoneNumber.length - 1]);

            // Mock rule: phone numbers ending with 0-7 succeed; 8-9 fail.
            const success = lastDigit <= 7;

            return {
                success,
                maskedAccount,
                failureReason: success
                    ? undefined
                    : 'Mock mobile money payment was rejected by the wallet provider',
                metadata: {
                    provider: dto.provider,
                    phoneNumber: maskedAccount,
                },
            };
        }

        throw new BadRequestException('Unsupported payment method');
    }
}
