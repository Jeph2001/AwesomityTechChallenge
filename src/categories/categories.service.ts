import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/createCategory.dto';
import { UpdateCategoryDto } from './dto/updateCategory.dto';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';
import { slugify, uniqueSlug } from 'src/common/utils/slug.util';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,
    ) { }

    async create(dto: CreateCategoryDto): Promise<Category> {
        const baseSlug = slugify(dto.name);
        const existing = await this.categoryRepo.findOne({ where: { slug: baseSlug } });
        const slug = existing ? uniqueSlug(dto.name) : baseSlug;

        const category = this.categoryRepo.create({
            name: dto.name,
            slug,
            description: dto.description ?? null,
            isActive: dto.isActive ?? true,
        });

        return this.categoryRepo.save(category);
    }

    async findAll(query: PaginationQueryDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const qb = this.categoryRepo
            .createQueryBuilder('category')
            .orderBy('category.name', 'ASC')
            .skip((page - 1) * limit)
            .take(limit);

        if (query.search) {
            qb.andWhere(
                '(category.name ILIKE :search OR category.slug ILIKE :search)',
                { search: `%${query.search}%` },
            );
        }

        const [data, total] = await qb.getManyAndCount();
        return { data, total, page, limit };
    }

    async findOne(id: string): Promise<Category> {
        const category = await this.categoryRepo.findOne({ where: { id } });
        if (!category) {
            throw new NotFoundException('Category not found');
        }
        return category;
    }

    async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
        const category = await this.findOne(id);

        if (dto.name && dto.name !== category.name) {
            const baseSlug = slugify(dto.name);
            const conflict = await this.categoryRepo.findOne({ where: { slug: baseSlug } });
            if (conflict && conflict.id !== category.id) {
                throw new ConflictException('Category slug already exists');
            }
            category.name = dto.name;
            category.slug = conflict ? uniqueSlug(dto.name) : baseSlug;
        }

        if (dto.description !== undefined) {
            category.description = dto.description;
        }
        if (dto.isActive !== undefined) {
            category.isActive = dto.isActive;
        }

        return this.categoryRepo.save(category);
    }

    async remove(id: string): Promise<{ message: string }> {
        const category = await this.findOne(id);
        await this.categoryRepo.remove(category);
        return { message: 'Category deleted successfully' };
    }
}
