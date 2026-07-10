import { ConflictException, NotFoundException } from '@nestjs/common';
import { StoresService } from './stores.service';

describe('StoresService', () => {
    const storeRepo = {
        findOne: jest.fn(),
        create: jest.fn((value) => value),
        save: jest.fn(async (value) => ({ id: 'store-1', ...value })),
        remove: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    let service: StoresService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new StoresService(storeRepo as any);
    });

    it('creates a store when owner has none', async () => {
        storeRepo.findOne.mockResolvedValue(null);

        const store = await service.create('owner-1', {
            name: 'My Shop',
            description: 'Nice things',
        });

        expect(store.name).toBe('My Shop');
        expect(store.ownerId).toBe('owner-1');
        expect(store.slug).toContain('my-shop-');
    });

    it('enforces one store per seller', async () => {
        storeRepo.findOne.mockResolvedValue({ id: 'existing' });

        await expect(
            service.create('owner-1', { name: 'Second Shop' }),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws when owned store is missing', async () => {
        storeRepo.findOne.mockResolvedValue(null);
        await expect(service.getOwnedStore('owner-1')).rejects.toBeInstanceOf(NotFoundException);
    });
});
