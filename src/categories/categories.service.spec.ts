import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
    const categoryRepo = {
        findOne: jest.fn(),
        create: jest.fn((value) => value),
        save: jest.fn(async (value) => ({ id: 'c1', ...value })),
        createQueryBuilder: jest.fn(),
        remove: jest.fn(),
    };

    let service: CategoriesService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new CategoriesService(categoryRepo as any);
    });

    it('creates a category with a slug', async () => {
        categoryRepo.findOne.mockResolvedValue(null);

        const category = await service.create({
            name: 'Electronics',
            description: 'Gadgets',
        });

        expect(category.slug).toBe('electronics');
        expect(category.name).toBe('Electronics');
    });

    it('lists categories', async () => {
        const qb = {
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'c1' }], 1]),
        };
        categoryRepo.createQueryBuilder.mockReturnValue(qb);

        const result = await service.findAll({ page: 1, limit: 20 });
        expect(result.total).toBe(1);
    });
});
