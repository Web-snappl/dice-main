import { Module } from '@nestjs/common';
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
      exclude: ['/api*'],
      renderPath: '/',
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
  ],

})
export class AppModule { }

