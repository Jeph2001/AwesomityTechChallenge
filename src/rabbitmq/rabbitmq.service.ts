import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);
  private client: ClientProxy;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('rabbitmq.host');
    const port = this.configService.get<number>('rabbitmq.port');
    const username = this.configService.get<string>('rabbitmq.username');
    const password = this.configService.get<string>('rabbitmq.password');
    const queue = this.configService.get<string>('rabbitmq.queue');

    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${username}:${password}@${host}:${port}`],
        queue,
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
      this.logger.log('Connected to RabbitMQ');
    } catch (error) {
      this.logger.warn('RabbitMQ connection failed on startup', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }

  async emit<T>(pattern: string, data: T): Promise<void> {
    await firstValueFrom(this.client.emit(pattern, data));
    this.logger.log(`Event emitted: ${pattern}`);
  }

  async send<T, R>(pattern: string, data: T): Promise<R> {
    return firstValueFrom(this.client.send<R>(pattern, data));
  }
}
