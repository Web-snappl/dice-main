import { Controller, ForbiddenException, Get, Param, Req, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtUserGuard } from '../auth/guards/jwt-user.guard';

@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @UseGuards(JwtUserGuard)
    @Get('user/:userId')
    async getUserTransactions(@Req() req, @Param('userId') userId: string) {
        const requesterId = req.user?.userId;
        const requesterRole = (req.user?.role || '').toLowerCase();
        const isAdmin = requesterRole === 'admin';

        if (!isAdmin && requesterId !== userId) {
            throw new ForbiddenException('You can only access your own transactions');
        }

        return this.transactionsService.findByUser(userId);
    }
}
