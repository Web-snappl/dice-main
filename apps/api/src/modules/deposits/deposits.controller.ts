// src/modules/deposits/deposits.controller.ts
import { Body, Controller, ForbiddenException, Get, Post, Query, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import { CreateDepositDto, DepositResponse } from './deposits.dto';
import { JwtUserGuard } from '../auth/guards/jwt-user.guard';

@Controller('admin')
@UseGuards(JwtUserGuard)
export class DepositsController {
    constructor(private readonly depositsService: DepositsService) { }

    private ensureAdminRole(role?: string) {
        const normalizedRole = (role || '').toLowerCase();
        if (normalizedRole !== 'admin') {
            throw new ForbiddenException('Admin role required');
        }
    }

    @Post('deposit')
    async deposit(@Req() req, @Body(ValidationPipe) depositDto: CreateDepositDto): Promise<DepositResponse> {
        this.ensureAdminRole(req.user?.role);
        return await this.depositsService.deposit(depositDto);
    }

    @Get('gameplayHistory')
    async gameplayHistory(@Req() req): Promise<any[]> {
        this.ensureAdminRole(req.user?.role);
        return await this.depositsService.gamePlayHistory();
    }

    @Get('depositHistory')
    async depositHistory(@Req() req): Promise<any[]> {
        this.ensureAdminRole(req.user?.role);
        return await this.depositsService.depositHistory();
    }

    @Get('profitability')
    async profitability(@Req() req, @Query('commission') commission: any): Promise<number> {
        this.ensureAdminRole(req.user?.role);
        console.log('commission: ', commission);
        return await this.depositsService.profitability(parseInt(commission))
    }
}
