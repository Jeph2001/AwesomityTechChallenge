import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductReview } from './entities/productReview.entity';
import { CreateReviewDto } from 'src/shoppers/dto/createReview.dto';
import { Order } from 'src/orders/entities/order.entity';
import { OrderStatus } from 'src/orders/enums/orderStatus.enum';
import { Product } from 'src/products/entities/product.entity';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(ProductReview)
        private readonly reviewRepo: Repository<ProductReview>,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
    ) { }

    async create(userId: string, dto: CreateReviewDto): Promise<ProductReview> {
        const product = await this.productRepo.findOne({ where: { id: dto.productId } });
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const existing = await this.reviewRepo.findOne({
            where: { userId, productId: dto.productId },
        });
        if (existing) {
            throw new ConflictException('You have already reviewed this product');
        }

        const qualifyingOrder = await this.orderRepo
            .createQueryBuilder('order')
            .innerJoin('order.items', 'item')
            .where('order.userId = :userId', { userId })
            .andWhere('item.productId = :productId', { productId: dto.productId })
            .andWhere('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
            .orderBy('order.createdAt', 'DESC')
            .getOne();

        if (!qualifyingOrder) {
            throw new ForbiddenException(
                'You can only review products from orders you have placed',
            );
        }

        const review = this.reviewRepo.create({
            userId,
            productId: dto.productId,
            orderId: qualifyingOrder.id,
            rating: dto.rating,
            comment: dto.comment ?? null,
        });

        return this.reviewRepo.save(review);
    }

    async findMyReviews(userId: string, query: PaginationQueryDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const qb = this.reviewRepo
            .createQueryBuilder('review')
            .leftJoinAndSelect('review.product', 'product')
            .where('review.userId = :userId', { userId })
            .orderBy('review.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [data, total] = await qb.getManyAndCount();
        return { data, total, page, limit };
    }

    async findByProduct(productId: string, query: PaginationQueryDto) {
        const product = await this.productRepo.findOne({ where: { id: productId } });
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const qb = this.reviewRepo
            .createQueryBuilder('review')
            .leftJoinAndSelect('review.user', 'user')
            .where('review.productId = :productId', { productId })
            .orderBy('review.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [data, total] = await qb.getManyAndCount();

        const avgResult = await this.reviewRepo
            .createQueryBuilder('review')
            .select('AVG(review.rating)', 'average')
            .addSelect('COUNT(review.id)', 'count')
            .where('review.productId = :productId', { productId })
            .getRawOne<{ average: string | null; count: string }>();

        return {
            data,
            total,
            page,
            limit,
            averageRating: avgResult?.average
                ? Number(Number(avgResult.average).toFixed(2))
                : null,
            reviewCount: Number(avgResult?.count ?? 0),
        };
    }

    async update(
        userId: string,
        reviewId: string,
        dto: Partial<Pick<CreateReviewDto, 'rating' | 'comment'>>,
    ): Promise<ProductReview> {
        const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
        if (!review) {
            throw new NotFoundException('Review not found');
        }
        if (review.userId !== userId) {
            throw new ForbiddenException('You can only update your own reviews');
        }

        if (dto.rating !== undefined) {
            if (dto.rating < 1 || dto.rating > 5) {
                throw new BadRequestException('Rating must be between 1 and 5');
            }
            review.rating = dto.rating;
        }
        if (dto.comment !== undefined) {
            review.comment = dto.comment;
        }

        return this.reviewRepo.save(review);
    }

    async remove(userId: string, reviewId: string): Promise<{ message: string }> {
        const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
        if (!review) {
            throw new NotFoundException('Review not found');
        }
        if (review.userId !== userId) {
            throw new ForbiddenException('You can only delete your own reviews');
        }
        await this.reviewRepo.remove(review);
        return { message: 'Review deleted successfully' };
    }
}
