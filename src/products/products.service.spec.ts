import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
    const productRepo = {
        findOne: jest.fn(),
        create: jest.fn((value) => value),
        save: jest.fn(async (value) => value),
        remove: jest.fn(),
        createQueryBuilder: jest.fn(),
    };
    const storesService = {
        findOne: jest.fn(),
    };
    const categoriesService = {
        findOne: jest.fn(),
    };

    let service: ProductsService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ProductsService(
            productRepo as any,
            storesService as any,
            categoriesService as any,
        );
    });

    it('returns a public product when active', async () => {
        productRepo.findOne.mockResolvedValue({
            id: 'p1',
            isActive: true,
            store: { isActive: true },
        });

        const product = await service.findOnePublic('p1');
        expect(product.id).toBe('p1');
    });

    it('hides inactive products from public browse', async () => {
        productRepo.findOne.mockResolvedValue({
            id: 'p1',
            isActive: false,
            store: { isActive: true },
        });

        await expect(service.findOnePublic('p1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('browses products with category and search filters', async () => {
        const qb = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'p1' }], 1]),
        };
        productRepo.createQueryBuilder.mockReturnValue(qb);

        const result = await service.findAll(
            { page: 1, limit: 10, search: 'mug' },
            false,
            undefined,
            'cat-1',
            true,
        );

        expect(result.total).toBe(1);
        expect(qb.andWhere).toHaveBeenCalled();
    });
});
