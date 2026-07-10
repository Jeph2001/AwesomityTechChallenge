export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    username: process.env.POSTGRES_USER ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    database: process.env.POSTGRES_DB ?? 'awesomity_db',
    synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
    logging: process.env.TYPEORM_LOGGING === 'true',
  },
  rabbitmq: {
    host: process.env.RABBITMQ_HOST ?? 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT ?? '5672', 10),
    username: process.env.RABBITMQ_USER ?? 'guest',
    password: process.env.RABBITMQ_PASSWORD ?? 'guest',
    queue: process.env.RABBITMQ_QUEUE ?? 'awesomity_queue',
  },
  mail: {
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER ?? '',
    password: process.env.MAIL_PASSWORD ?? '',
    from: process.env.MAIL_FROM ?? 'Awesomity API <noreply@awesomity.com>',
  },
  jwt: {
    accessTokenSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
    accessTokenExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-jwt-refresh-secret',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  app: {
    baseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3000',
  },
});
