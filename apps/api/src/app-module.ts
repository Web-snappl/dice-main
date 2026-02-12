import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose'
import { MainModule } from './modules/app/app.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailSenderModule } from './modules/emailSender/mail-sender.module';
import { WebsocketModule } from './modules/nestSockets/websocket.module';
import { GameModule } from './modules/game/game.module';
import { DepositsModule } from './modules/deposits/deposits.module';
import { AdminModule } from './admin/admin.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { MtnModule } from './modules/mtn/mtn.module';
import { KkiapayModule } from './modules/kkiapay/kkiapay.module';
import { DebugModule } from './modules/debug/debug.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '..', '..', '..', '.env.local'),
        join(__dirname, '..', '..', '..', '.env'),
        join(__dirname, '.env'),
      ],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client', 'dist'),
      exclude: ['/api{/*path}', '/admin{/*path}'],
      renderPath: '/',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'api', 'public', 'admin'),
      serveRoot: '/admin',
      exclude: ['/api{/*path}'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    MainModule,
    AuthModule,
    MailSenderModule,
    WebsocketModule,
    GameModule,
    DepositsModule,
    AdminModule, // Admin Panel Module
    StripeModule,
    TransactionsModule,
    MtnModule,
    KkiapayModule,
    KkiapayModule,
    DebugModule,
  ],
  controllers: [HealthController],
})
export class AppModule { }

