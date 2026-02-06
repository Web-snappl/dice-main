import { Body, Controller, Post, UseGuards, Request, Req } from '@nestjs/common';
import { MtnService } from './mtn.service';
import { JwtUserGuard } from '../auth/guards/jwt-user.guard';

@Controller('mtn')
export class MtnController {
    constructor(private readonly mtnService: MtnService) { }

    @Post('deposit')
    @UseGuards(JwtUserGuard)
    async deposit(@Body() body: { phone: string; amount: number }, @Req() req) {
        return this.mtnService.requestDeposit(req.user.userId, body.phone, body.amount);
    }

    @Post('withdraw')
    @UseGuards(JwtUserGuard)
    async withdraw(@Body() body: { phone: string; amount: number }, @Req() req) {
        return this.mtnService.requestWithdrawal(req.user.userId, body.phone, body.amount);
    }
}
