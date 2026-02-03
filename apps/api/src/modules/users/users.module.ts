import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { users } from '../auth/auth.mongoSchema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'users', schema: users }]),
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
