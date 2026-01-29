import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { users } from './auth.mongoSchema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'users', schema: users }])],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule { }
