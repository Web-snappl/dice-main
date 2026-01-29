// auth.service.ts
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User } from './auth.mongoSchema'
import { UserResponse } from './createUser.dto'
import { createHmac } from 'node:crypto'
import { BadRequestException } from '@nestjs/common'

@Injectable()
export class AuthService {
    constructor(
        @InjectModel('users') private readonly userModel: Model<User>,
    ) { }


    encrypt(password: string): string {
        const encryption = createHmac('sha256', process.env.CRYPTOGRAPHY_SECRET).update(password).digest('hex');
        return encryption
    }

    async signup(authHeader: string,
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        phoneNumber: string,
        role: string
    ): Promise<UserResponse> {

        if (authHeader !== process.env.CRYPTOGRAPHY_SECRET) return { status: 401, message: 'Invalid or missing auth header token' }

        const existingUser = await this.userModel.findOne({
            $or: [{ phoneNumber }, { email }]
        }).exec()
        if (existingUser) throw new BadRequestException('User with this number or email already exists')

        const encryptedPassword = this.encrypt(password)

        const newUser = new this.userModel({
            email: email,
            password: encryptedPassword,
            firstName: firstName,
            lastName: lastName,
            phoneNumber: phoneNumber,
            role: role
        })
        const savedUser: any = await newUser.save();

        return {
            uid: savedUser._id.toString(),
            email: savedUser.email,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            phoneNumber: savedUser.phoneNumber,
            role: savedUser.role
        }
    }

    async login(authHeader: string, identifier: string, password: string): Promise<UserResponse> {

        if (authHeader !== process.env.CRYPTOGRAPHY_SECRET) return { status: 401, message: 'Invalid or missing auth header token' }

        const encryptedPassword = this.encrypt(password)

        const user: any = await this.userModel.findOne({
            $or: [{ phoneNumber: identifier }, { email: identifier }],
            password: encryptedPassword
        }).exec()
        if (!user) throw new BadRequestException('Invalid credentials')

        return {
            uid: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            role: user.role
        }
    }

}
