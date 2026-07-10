import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/createStore.dto';
import { UpdateStoreDto } from './dto/updateStore.dto';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';
import { uniqueSlug } from 'src/common/utils/slug.util';

@Injectable()
export class StoresService {
    constructor(
        @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
    ) { }

    async create(ownerId: string, dto: CreateStoreDto): Promise<Store> {
        const store = this.storeRepo.create({
            name: dto.name,
            slug: uniqueSlug(dto.name),
            description: dto.description ?? null,
            isActive: dto.isActive ?? true,
            ownerId,
        });
        return this.storeRepo.save(store);
    }

    async findAll(query: PaginationQueryDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const qb = this.storeRepo
            .createQueryBuilder('store')
            .leftJoinAndSelect('store.owner', 'owner')
            .orderBy('store.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (query.search) {
            qb.andWhere(
                '(store.name ILIKE :search OR store.slug ILIKE :search OR owner.email ILIKE :search)',
                { search: `%${query.search}%` },
            );
        }

        const [data, total] = await qb.getManyAndCount();
        return { data, total, page, limit };
    }

    async findOne(id: string): Promise<Store> {
        const store = await this.storeRepo.findOne({
            where: { id },
            relations: { owner: true },
        });
        if (!store) {
            throw new NotFoundException('Store not found');
        }
        return store;
    }

    async update(id: string, dto: UpdateStoreDto): Promise<Store> {
        const store = await this.findOne(id);

        if (dto.name && dto.name !== store.name) {
            store.name = dto.name;
            store.slug = uniqueSlug(dto.name);
        }
        if (dto.description !== undefined) {
            store.description = dto.description;
        }
        if (dto.isActive !== undefined) {
            store.isActive = dto.isActive;
        }

        return this.storeRepo.save(store);
    }

    async remove(id: string): Promise<{ message: string }> {
        const store = await this.findOne(id);
        await this.storeRepo.remove(store);
        return { message: 'Store deleted successfully' };
    }

    async ensureOwnerHasNoStore(ownerId: string): Promise<void> {
        const existing = await this.storeRepo.findOne({ where: { ownerId } });
        if (existing) {
            throw new ConflictException('Owner already has a store');
        }
    }
}
