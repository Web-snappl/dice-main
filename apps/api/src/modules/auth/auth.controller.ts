import { Controller, Get, Post, Body, ValidationPipe, Query, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, UserDto, UserResponse } from './createUser.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('signup')
    signup(@Headers('authorization') authHeader: string, @Body(ValidationPipe) userDto: UserDto): Promise<UserResponse> {
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
    publicSignup(@Body(ValidationPipe) userDto: UserDto): Promise<UserResponse> {
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
        @Headers('authorization') authHeader: string
    ): Promise<UserResponse> {
        return this.authService.login(authHeader, userDto.phoneNumber, userDto.password);
    }

}
