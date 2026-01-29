import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose'
import { MainModule } from './modules/app/app.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailSenderModule } from './modules/emailSender/mail-sender.module';
import { WebsocketModule } from './modules/nestSockets/websocket.module';
import { GameModule } from './modules/game/game.module';
import { DepositsModule } from './modules/deposits/deposits.module';
import { AdminModule } from './modules/admin/admin.module';

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
    /* ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client', 'dist'),
      exclude: ['/api/(.*)'],
      renderPath: '/',
    }), */
    MongooseModule.forRoot(process.env.MONGO_URI),
    MainModule,
    AuthModule,
    MailSenderModule,
    WebsocketModule,
    GameModule,
    DepositsModule,
    AdminModule
  ],

})
export class AppModule { }
