import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';
import { StoresService } from 'src/stores/stores.service';
import { CategoriesService } from 'src/categories/categories.service';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        private readonly storesService: StoresService,
        private readonly categoriesService: CategoriesService,
    ) { }

    async create(dto: CreateProductDto): Promise<Product> {
        await this.storesService.findOne(dto.storeId);

        if (dto.categoryId) {
            await this.categoriesService.findOne(dto.categoryId);
        }

        const product = this.productRepo.create({
            name: dto.name,
            description: dto.description ?? null,
            price: dto.price,
            stock: dto.stock,
            storeId: dto.storeId,
            categoryId: dto.categoryId ?? null,
            imageUrl: dto.imageUrl ?? null,
            isFeatured: dto.isFeatured ?? false,
            isActive: dto.isActive ?? true,
        });

        return this.productRepo.save(product);
    }

    async createForStore(
        storeId: string,
        dto: Omit<CreateProductDto, 'storeId' | 'isFeatured'>,
    ): Promise<Product> {
        return this.create({
            ...dto,
            storeId,
            isFeatured: false,
        });
    }

    async findAll(
        query: PaginationQueryDto,
        featuredOnly = false,
        storeId?: string,
        categoryId?: string,
        activeOnly = false,
    ) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const qb = this.productRepo
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.store', 'store')
            .leftJoinAndSelect('product.category', 'category')
            .orderBy('product.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (featuredOnly) {
            qb.andWhere('product.isFeatured = true');
        }

        if (storeId) {
            qb.andWhere('product.storeId = :storeId', { storeId });
        }

        if (categoryId) {
            qb.andWhere('product.categoryId = :categoryId', { categoryId });
        }

        if (activeOnly) {
            qb.andWhere('product.isActive = true');
            qb.andWhere('store.isActive = true');
        }

        if (query.search) {
            qb.andWhere(
                '(product.name ILIKE :search OR product.description ILIKE :search)',
                { search: `%${query.search}%` },
            );
        }

        const [data, total] = await qb.getManyAndCount();
        return { data, total, page, limit };
    }

    async findOnePublic(id: string): Promise<Product> {
        const product = await this.findOne(id);
        if (!product.isActive || !product.store?.isActive) {
            throw new NotFoundException('Product not found');
        }
        return product;
    }

    async findOne(id: string): Promise<Product> {
        const product = await this.productRepo.findOne({
            where: { id },
            relations: { store: true, category: true },
        });
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        return product;
    }

    async findOneInStore(id: string, storeId: string): Promise<Product> {
        const product = await this.findOne(id);
        if (product.storeId !== storeId) {
            throw new ForbiddenException('This product does not belong to your store');
        }
        return product;
    }

    async update(id: string, dto: UpdateProductDto): Promise<Product> {
        const product = await this.findOne(id);

        if (dto.categoryId) {
            await this.categoriesService.findOne(dto.categoryId);
        }

        Object.assign(product, {
            ...dto,
            categoryId: dto.categoryId === undefined ? product.categoryId : dto.categoryId,
        });

        return this.productRepo.save(product);
    }

    async updateInStore(
        id: string,
        storeId: string,
        dto: Omit<UpdateProductDto, 'isFeatured'>,
    ): Promise<Product> {
        await this.findOneInStore(id, storeId);
        return this.update(id, dto);
    }

    async setFeatured(id: string, isFeatured: boolean): Promise<Product> {
        const product = await this.findOne(id);
        product.isFeatured = isFeatured;
        return this.productRepo.save(product);
    }

    async remove(id: string): Promise<{ message: string }> {
        const product = await this.findOne(id);
        await this.productRepo.remove(product);
        return { message: 'Product deleted successfully' };
    }

    async removeInStore(id: string, storeId: string): Promise<{ message: string }> {
        await this.findOneInStore(id, storeId);
        return this.remove(id);
    }
}
