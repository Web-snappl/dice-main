import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/auth.mongoSchema';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel('users') private readonly userModel: Model<User>,
    ) { }

    async findById(id: string) {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // Return public profile data
        return {
            uid: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            balance: user.balance || 0,
            photoURL: user.photoURL,
        };
    }
}
