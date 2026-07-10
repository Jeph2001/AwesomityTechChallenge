import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { OrderStatus } from 'src/orders/enums/orderStatus.enum';

describe('ReviewsService', () => {
    const reviewRepo = {
        findOne: jest.fn(),
        create: jest.fn((value) => value),
        save: jest.fn(async (value) => ({ id: 'r1', ...value })),
        remove: jest.fn(),
        createQueryBuilder: jest.fn(),
    };
    const orderRepo = {
        createQueryBuilder: jest.fn(),
    };
    const productRepo = {
        findOne: jest.fn(),
    };

    let service: ReviewsService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ReviewsService(
            reviewRepo as any,
            orderRepo as any,
            productRepo as any,
        );
    });

    it('creates a review when the shopper ordered the product', async () => {
        productRepo.findOne.mockResolvedValue({ id: 'p1' });
        reviewRepo.findOne.mockResolvedValue(null);
        const qb = {
            innerJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue({ id: 'o1', status: OrderStatus.PENDING }),
        };
        orderRepo.createQueryBuilder.mockReturnValue(qb);

        const review = await service.create('user-1', {
            productId: 'p1',
            rating: 5,
            comment: 'Great',
        });

        expect(review.rating).toBe(5);
        expect(review.orderId).toBe('o1');
    });

    it('blocks reviews for products never ordered', async () => {
        productRepo.findOne.mockResolvedValue({ id: 'p1' });
        reviewRepo.findOne.mockResolvedValue(null);
        const qb = {
            innerJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
        };
        orderRepo.createQueryBuilder.mockReturnValue(qb);

        await expect(
            service.create('user-1', { productId: 'p1', rating: 4 }),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('blocks duplicate reviews', async () => {
        productRepo.findOne.mockResolvedValue({ id: 'p1' });
        reviewRepo.findOne.mockResolvedValue({ id: 'existing' });

        await expect(
            service.create('user-1', { productId: 'p1', rating: 3 }),
        ).rejects.toBeInstanceOf(ConflictException);
    });
});
