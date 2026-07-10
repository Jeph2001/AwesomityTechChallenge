import { ConflictException } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { SellerApplicationStatus } from './enums/sellerApplicationStatus.enum';

describe('SellersService', () => {
    const applicationRepo = {
        findOne: jest.fn(),
        create: jest.fn((value) => value),
        save: jest.fn(async (value) => ({ id: 'app-1', ...value })),
        createQueryBuilder: jest.fn(),
    };
    const userRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };
    const storeRepo = {
        save: jest.fn(),
        create: jest.fn(),
    };
    const mailService = { sendMail: jest.fn() };
    const configService = { get: jest.fn().mockReturnValue('http://localhost:3000') };

    let service: SellersService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new SellersService(
            applicationRepo as any,
            userRepo as any,
            storeRepo as any,
            mailService as any,
            configService as any,
        );
    });

    it('applies with email only and defaults name/business', async () => {
        userRepo.findOne.mockResolvedValue(null);
        applicationRepo.findOne.mockResolvedValue(null);

        const result = await service.apply({ email: 'seller@example.com' });

        expect(result.message).toContain('submitted successfully');
        expect(applicationRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'seller@example.com',
                fullName: 'seller',
                businessName: "seller's Store",
                status: SellerApplicationStatus.PENDING,
            }),
        );
    });

    it('rejects apply when email already has an account', async () => {
        userRepo.findOne.mockResolvedValue({ id: 'u1' });

        await expect(service.apply({ email: 'exists@example.com' })).rejects.toBeInstanceOf(
            ConflictException,
        );
    });

    it('rejects duplicate pending applications', async () => {
        userRepo.findOne.mockResolvedValue(null);
        applicationRepo.findOne.mockResolvedValue({
            status: SellerApplicationStatus.PENDING,
        });

        await expect(service.apply({ email: 'pending@example.com' })).rejects.toBeInstanceOf(
            ConflictException,
        );
    });
});
