// src/modules/deposits/deposits.controller.ts
import { Controller, Post, Body, ValidationPipe, Get, Query } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import { CreateDepositDto, DepositResponse } from './deposits.dto';

@Controller('admin')
export class DepositsController {
    constructor(private readonly depositsService: DepositsService) { }

    @Post('deposit')
    async deposit(@Body(ValidationPipe) depositDto: CreateDepositDto): Promise<DepositResponse> {
        return await this.depositsService.deposit(depositDto);
    }

    @Get('gameplayHistory')
    async gameplayHistory(): Promise<any[]> {
        return await this.depositsService.gamePlayHistory();
    }

    @Get('depositHistory')
    async depositHistory(): Promise<any[]> {
        return await this.depositsService.depositHistory();
    }

    @Get('profitability')
    async profitability(@Query('commission') commission: any): Promise<number> {
        console.log('commission: ', commission);
        return await this.depositsService.profitability(parseInt(commission))
    }
}