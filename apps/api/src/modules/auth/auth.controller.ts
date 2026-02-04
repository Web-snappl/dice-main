import { Controller, Get, Post, Body, ValidationPipe, Query, Headers, UseGuards, Req } from '@nestjs/common';
import { AuthService, UserLoginResponse } from './auth.service';
import { LoginDto, UserDto, UserResponse } from './createUser.dto';
import { JwtUserGuard } from './guards/jwt-user.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
    user: {
        userId: string;
        email: string;
        role: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
    };
}

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('signup')
    signup(
        @Headers('authorization') authHeader: string,
        @Body(ValidationPipe) userDto: UserDto,
    ): Promise<UserResponse> {
        return this.authService.signup(
            authHeader,
            userDto.email,
            userDto.password,
            userDto.firstName,
            userDto.lastName,
            userDto.phoneNumber,
            userDto.role,
        );
    }

    @Post('public/signup')
    publicSignup(@Body(ValidationPipe) userDto: UserDto): Promise<UserLoginResponse> {
        return this.authService.publicSignup(
            userDto.email,
            userDto.password,
            userDto.firstName,
            userDto.lastName,
            userDto.phoneNumber,
        );
    }

    @Get('login')
    login(
        @Query(ValidationPipe) userDto: LoginDto,
        @Headers('authorization') authHeader: string,
    ): Promise<UserLoginResponse> {
        return this.authService.login(authHeader, userDto.phoneNumber, userDto.password, userDto.email);
    }

    @Post('refresh')
    refreshToken(@Body('refreshToken') refreshToken: string): Promise<{ accessToken: string }> {
        return this.authService.refreshToken(refreshToken);
    }

    @Get('me')
    @UseGuards(JwtUserGuard)
    getMe(@Req() req: RequestWithUser): Promise<any> {
        return this.authService.getMe(req.user.userId);
    }
}
