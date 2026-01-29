import { Controller, Post, Body, Get, UseGuards, Query, Patch, Param, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto, UpdateUserDto } from './admin.dto';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post('auth/login')
    async login(@Body() loginDto: AdminLoginDto) {
        return this.adminService.login(loginDto.email, loginDto.password);
    }

    @Get('users')
    async getUsers(@Query() query: any) {
        return this.adminService.getUsers(query);
    }

    @Get('users/:id')
    async getUser(@Param('id') id: string) {
        return this.adminService.getUser(id);
    }

    @Patch('users/:id')
    async updateUser(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
        return this.adminService.updateUser(id, updateDto);
    }

    @Get('analytics/dashboard')
    async getDashboard() {
        return this.adminService.getDashboardStats();
    }

    @Get('financial/transactions')
    async getTransactions(@Query() query: any) {
        return this.adminService.getTransactions(query);
    }

    @Get('financial/summary')
    async getFinancialSummary() {
        return this.adminService.getFinancialSummary();
    }
}
