import { ConflictException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentMethod } from './enums/paymentMethod.enum';
import { PaymentStatus } from './enums/paymentStatus.enum';
import { OrderStatus } from 'src/orders/enums/orderStatus.enum';
import { MobileMoneyProvider } from './enums/mobileMoneyProvider.enum';

describe('PaymentsService', () => {
    const paymentRepo = {
        findOne: jest.fn(),
        create: jest.fn((value) => value),
        save: jest.fn(async (value) => ({ id: 'pay-1', ...value })),
        find: jest.fn(),
    };
    const ordersService = {
        findOneForUser: jest.fn(),
        updateStatus: jest.fn(),
    };

    let service: PaymentsService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new PaymentsService(paymentRepo as any, ordersService as any);
        ordersService.findOneForUser.mockResolvedValue({
            id: 'o1',
            status: OrderStatus.PENDING,
            totalAmount: 100,
        });
        paymentRepo.findOne.mockResolvedValue(null);
    });

    it('succeeds for card numbers ending with an even digit', async () => {
        ordersService.updateStatus.mockResolvedValue({
            id: 'o1',
            status: OrderStatus.CONFIRMED,
        });

        const result = await service.payForOrder('user-1', 'o1', {
            method: PaymentMethod.CARD,
            cardNumber: '4242424242424242',
            cardHolderName: 'Sam',
            expiryMonth: '12',
            expiryYear: '28',
            cvv: '123',
        });

        expect(result.message).toBe('Payment successful');
        expect(result.payment.status).toBe(PaymentStatus.SUCCESS);
        expect(ordersService.updateStatus).toHaveBeenCalledWith('o1', OrderStatus.CONFIRMED);
    });

    it('fails for card numbers ending with an odd digit', async () => {
        const result = await service.payForOrder('user-1', 'o1', {
            method: PaymentMethod.CARD,
            cardNumber: '4000000000000001',
            cardHolderName: 'Sam',
            expiryMonth: '12',
            expiryYear: '28',
            cvv: '123',
        });

        expect(result.message).toBe('Payment failed');
        expect(result.payment.status).toBe(PaymentStatus.FAILED);
        expect(ordersService.updateStatus).not.toHaveBeenCalled();
    });

    it('succeeds for mobile money numbers ending in 0-7', async () => {
        ordersService.updateStatus.mockResolvedValue({
            id: 'o1',
            status: OrderStatus.CONFIRMED,
        });

        const result = await service.payForOrder('user-1', 'o1', {
            method: PaymentMethod.MOBILE_MONEY,
            provider: MobileMoneyProvider.MTN,
            phoneNumber: '+250788123456',
        });

        expect(result.message).toBe('Payment successful');
        expect(result.payment.method).toBe(PaymentMethod.MOBILE_MONEY);
    });

    it('rejects paying an already paid order', async () => {
        paymentRepo.findOne.mockResolvedValue({ id: 'existing', status: PaymentStatus.SUCCESS });

        await expect(
            service.payForOrder('user-1', 'o1', {
                method: PaymentMethod.CARD,
                cardNumber: '4242424242424242',
                cardHolderName: 'Sam',
                expiryMonth: '12',
                expiryYear: '28',
                cvv: '123',
            }),
        ).rejects.toBeInstanceOf(ConflictException);
    });
});
