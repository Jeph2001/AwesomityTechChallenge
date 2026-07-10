import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from './enums/role.enum';

describe('UsersService', () => {
    const userRepo = {
        findOne: jest.fn(),
        save: jest.fn(),
        createQueryBuilder: jest.fn(),
        remove: jest.fn(),
    };

    let service: UsersService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new UsersService(userRepo as any);
    });

    it('updates a user profile', async () => {
        const user = { id: 'u1', fullName: 'Old Name', email: 'a@b.com', role: Role.SHOPPER };
        userRepo.findOne.mockResolvedValue(user);
        userRepo.save.mockImplementation(async (value) => value);

        const result = await service.updateProfile('u1', { fullName: 'New Name' });

        expect(result.fullName).toBe('New Name');
        expect(userRepo.save).toHaveBeenCalled();
    });

    it('throws when user is missing', async () => {
        userRepo.findOne.mockResolvedValue(null);
        await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lists users with pagination', async () => {
        const qb = {
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'u1' }], 1]),
        };
        userRepo.createQueryBuilder.mockReturnValue(qb);

        const result = await service.findAll({ page: 1, limit: 10 });

        expect(result).toEqual({ data: [{ id: 'u1' }], total: 1, page: 1, limit: 10 });
    });
});
