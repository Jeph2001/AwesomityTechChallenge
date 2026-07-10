import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderStatus } from './enums/orderStatus.enum';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    ) { }

    async findAll(query: PaginationQueryDto, status?: OrderStatus) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const qb = this.orderRepo
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.user', 'user')
            .leftJoinAndSelect('order.store', 'store')
            .leftJoinAndSelect('order.items', 'items')
            .orderBy('order.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (status) {
            qb.andWhere('order.status = :status', { status });
        }

        if (query.search) {
            qb.andWhere(
                '(user.email ILIKE :search OR user.fullName ILIKE :search OR store.name ILIKE :search)',
                { search: `%${query.search}%` },
            );
        }

        const [data, total] = await qb.getManyAndCount();
        return { data, total, page, limit };
    }

    async findOne(id: string): Promise<Order> {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations: {
                user: true,
                store: true,
                items: { product: true },
            },
        });
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        return order;
    }

    async updateStatus(id: string, status: OrderStatus): Promise<Order> {
        const order = await this.findOne(id);
        order.status = status;
        return this.orderRepo.save(order);
    }

    async remove(id: string): Promise<{ message: string }> {
        const order = await this.findOne(id);
        await this.orderRepo.remove(order);
        return { message: 'Order deleted successfully' };
    }
}
