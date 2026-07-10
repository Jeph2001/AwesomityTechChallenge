import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { OrderStatus } from './enums/orderStatus.enum';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';
import { PlaceOrderDto } from 'src/shoppers/dto/placeOrder.dto';
import { Product } from 'src/products/entities/product.entity';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        private readonly dataSource: DataSource,
        private readonly mailService: MailService,
    ) { }

    async placeOrder(userId: string, dto: PlaceOrderDto): Promise<Order[]> {
        const productIds = dto.items.map((item) => item.productId);
        const uniqueIds = [...new Set(productIds)];
        if (uniqueIds.length !== productIds.length) {
            throw new BadRequestException('Duplicate products in order items are not allowed');
        }

        const products = await this.productRepo.find({
            where: { id: In(uniqueIds) },
            relations: { store: true },
        });

        if (products.length !== uniqueIds.length) {
            throw new NotFoundException('One or more products were not found');
        }

        for (const product of products) {
            if (!product.isActive) {
                throw new BadRequestException(`Product "${product.name}" is not available`);
            }
            if (!product.store?.isActive) {
                throw new BadRequestException(`Store for "${product.name}" is not available`);
            }
        }

        const quantityByProduct = new Map(
            dto.items.map((item) => [item.productId, item.quantity]),
        );

        for (const product of products) {
            const quantity = quantityByProduct.get(product.id)!;
            if (product.stock < quantity) {
                throw new BadRequestException(
                    `Insufficient stock for "${product.name}". Available: ${product.stock}`,
                );
            }
        }

        const productsByStore = new Map<string, Product[]>();
        for (const product of products) {
            const list = productsByStore.get(product.storeId) ?? [];
            list.push(product);
            productsByStore.set(product.storeId, list);
        }

        const createdOrders = await this.dataSource.transaction(async (manager) => {
            const orders: Order[] = [];

            for (const [storeId, storeProducts] of productsByStore.entries()) {
                let totalAmount = 0;
                const itemPayloads: Array<{
                    product: Product;
                    quantity: number;
                    unitPrice: number;
                    subtotal: number;
                }> = [];

                for (const product of storeProducts) {
                    const quantity = quantityByProduct.get(product.id)!;
                    const unitPrice = Number(product.price);
                    const subtotal = Number((unitPrice * quantity).toFixed(2));
                    totalAmount += subtotal;
                    itemPayloads.push({ product, quantity, unitPrice, subtotal });

                    const updateResult = await manager
                        .createQueryBuilder()
                        .update(Product)
                        .set({ stock: () => 'stock - :quantity' })
                        .where('id = :id AND stock >= :quantity', {
                            id: product.id,
                            quantity,
                        })
                        .execute();

                    if (!updateResult.affected) {
                        throw new BadRequestException(
                            `Insufficient stock for "${product.name}"`,
                        );
                    }
                }

                const order = manager.create(Order, {
                    userId,
                    storeId,
                    status: OrderStatus.PENDING,
                    totalAmount: Number(totalAmount.toFixed(2)),
                    shippingAddress: dto.shippingAddress,
                });
                const savedOrder = await manager.save(order);

                const items = itemPayloads.map((payload) =>
                    manager.create(OrderItem, {
                        orderId: savedOrder.id,
                        productId: payload.product.id,
                        productName: payload.product.name,
                        quantity: payload.quantity,
                        unitPrice: payload.unitPrice,
                        subtotal: payload.subtotal,
                    }),
                );
                await manager.save(items);
                orders.push(savedOrder);
            }

            return orders;
        });

        const hydrated: Order[] = [];
        for (const order of createdOrders) {
            hydrated.push(await this.findOne(order.id));
        }

        try {
            await this.sendOrderPlacedEmail(hydrated[0]);
            for (const order of hydrated.slice(1)) {
                await this.sendOrderPlacedEmail(order);
            }
        } catch (error) {
            console.error('Failed to send order placed email', error);
        }

        return hydrated;
    }

    async findAll(
        query: PaginationQueryDto,
        status?: OrderStatus,
        storeId?: string,
        userId?: string,
    ) {
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

        if (storeId) {
            qb.andWhere('order.storeId = :storeId', { storeId });
        }

        if (userId) {
            qb.andWhere('order.userId = :userId', { userId });
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
                payments: true,
            },
        });
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        return order;
    }

    async findOneForUser(id: string, userId: string): Promise<Order> {
        const order = await this.findOne(id);
        if (order.userId !== userId) {
            throw new ForbiddenException('This order does not belong to you');
        }
        return order;
    }

    async findOneInStore(id: string, storeId: string): Promise<Order> {
        const order = await this.findOne(id);
        if (order.storeId !== storeId) {
            throw new ForbiddenException('This order does not belong to your store');
        }
        return order;
    }

    async updateStatus(id: string, status: OrderStatus): Promise<Order> {
        const order = await this.findOne(id);
        const previousStatus = order.status;

        if (previousStatus === status) {
            return order;
        }

        order.status = status;
        const saved = await this.orderRepo.save(order);

        try {
            await this.sendOrderStatusEmail(saved, previousStatus);
        } catch (error) {
            console.error('Failed to send order status email', error);
        }

        return this.findOne(saved.id);
    }

    async updateStatusInStore(
        id: string,
        storeId: string,
        status: OrderStatus,
    ): Promise<Order> {
        await this.findOneInStore(id, storeId);
        return this.updateStatus(id, status);
    }

    async remove(id: string): Promise<{ message: string }> {
        const order = await this.findOne(id);
        await this.orderRepo.remove(order);
        return { message: 'Order deleted successfully' };
    }

    private async sendOrderPlacedEmail(order: Order): Promise<void> {
        if (!order.user?.email) {
            return;
        }

        await this.mailService.sendMail({
            to: order.user.email,
            subject: `Order placed (#${order.id.slice(0, 8)})`,
            text: `Hi ${order.user.fullName}, your order has been placed successfully. Status: ${order.status}. Total: ${order.totalAmount}.`,
            html: `<p>Hi ${order.user.fullName},</p>
<p>Your order <strong>#${order.id.slice(0, 8)}</strong> has been placed successfully.</p>
<p>Status: <strong>${order.status}</strong></p>
<p>Total: <strong>${order.totalAmount}</strong></p>
<p>Shipping to: ${order.shippingAddress}</p>`,
        });
    }

    private async sendOrderStatusEmail(
        order: Order,
        previousStatus: OrderStatus,
    ): Promise<void> {
        const hydrated = order.user?.email ? order : await this.findOne(order.id);
        if (!hydrated.user?.email) {
            return;
        }

        await this.mailService.sendMail({
            to: hydrated.user.email,
            subject: `Order status update (#${hydrated.id.slice(0, 8)})`,
            text: `Hi ${hydrated.user.fullName}, your order status changed from ${previousStatus} to ${hydrated.status}.`,
            html: `<p>Hi ${hydrated.user.fullName},</p>
<p>Your order <strong>#${hydrated.id.slice(0, 8)}</strong> status has been updated.</p>
<p>Previous status: <strong>${previousStatus}</strong></p>
<p>Current status: <strong>${hydrated.status}</strong></p>
<p>Total: <strong>${hydrated.totalAmount}</strong></p>`,
        });
    }
}
