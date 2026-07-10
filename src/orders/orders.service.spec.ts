import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatus } from './enums/orderStatus.enum';

describe('OrdersService', () => {
    const orderRepo = {
        findOne: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        createQueryBuilder: jest.fn(),
    };
    const productRepo = {
        find: jest.fn(),
    };
    const dataSource = {
        transaction: jest.fn(),
    };
    const mailService = {
        sendMail: jest.fn(),
    };

    let service: OrdersService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new OrdersService(
            orderRepo as any,
            productRepo as any,
            dataSource as any,
            mailService as any,
        );
    });

    it('rejects duplicate products in place order payload', async () => {
        await expect(
            service.placeOrder('user-1', {
                shippingAddress: 'Kigali',
                items: [
                    { productId: 'p1', quantity: 1 },
                    { productId: 'p1', quantity: 2 },
                ],
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns an order for its owner', async () => {
        orderRepo.findOne.mockResolvedValue({
            id: 'o1',
            userId: 'user-1',
            status: OrderStatus.PENDING,
        });

        const order = await service.findOneForUser('o1', 'user-1');
        expect(order.id).toBe('o1');
    });

    it('updates order status and attempts email notification', async () => {
        orderRepo.findOne
            .mockResolvedValueOnce({
                id: 'o1',
                userId: 'user-1',
                status: OrderStatus.PENDING,
                totalAmount: 10,
                user: { email: 'a@b.com', fullName: 'Sam' },
            })
            .mockResolvedValueOnce({
                id: 'o1',
                userId: 'user-1',
                status: OrderStatus.CONFIRMED,
                totalAmount: 10,
                user: { email: 'a@b.com', fullName: 'Sam' },
            });
        orderRepo.save.mockImplementation(async (value) => value);
        mailService.sendMail.mockResolvedValue(undefined);

        const result = await service.updateStatus('o1', OrderStatus.CONFIRMED);

        expect(result.status).toBe(OrderStatus.CONFIRMED);
        expect(mailService.sendMail).toHaveBeenCalled();
    });
});
