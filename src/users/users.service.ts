import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { UpdateUserAdminDto } from './dto/updateUserAdmin.dto';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';
import { Role } from './enums/role.enum';

@Injectable()
export class UsersService {
    constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) { }

    async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        Object.assign(user, dto);
        return this.userRepo.save(user);
    }

    async findAll(query: PaginationQueryDto, role?: Role) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const qb = this.userRepo
            .createQueryBuilder('user')
            .orderBy('user.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (role) {
            qb.andWhere('user.role = :role', { role });
        }

        if (query.search) {
            qb.andWhere(
                '(user.fullName ILIKE :search OR user.email ILIKE :search)',
                { search: `%${query.search}%` },
            );
        }

        const [data, total] = await qb.getManyAndCount();
        return { data, total, page, limit };
    }

    async findOne(id: string): Promise<User> {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    async updateByAdmin(id: string, dto: UpdateUserAdminDto): Promise<User> {
        const user = await this.findOne(id);
        Object.assign(user, dto);
        return this.userRepo.save(user);
    }

    async remove(id: string): Promise<{ message: string }> {
        const user = await this.findOne(id);
        await this.userRepo.remove(user);
        return { message: 'User deleted successfully' };
    }
}
