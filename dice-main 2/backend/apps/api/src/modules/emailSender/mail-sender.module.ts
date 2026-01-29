import { Module } from '@nestjs/common';
import { MailSenderController } from './mail-sender.controller';
import { MailSenderService } from './mail-sender.service';


import { MongooseModule } from '@nestjs/mongoose';
import { users } from '../auth/auth.mongoSchema';
@Module({
  imports: [MongooseModule.forFeature([{ name: 'users', schema: users }])],
  controllers: [MailSenderController],
  providers: [MailSenderService]
})
export class MailSenderModule { }
