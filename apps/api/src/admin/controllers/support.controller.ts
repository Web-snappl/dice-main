import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { SupportService } from '../services/support.service';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentAdmin } from '../decorators/current-admin.decorator';

@Controller('admin/support')
@UseGuards(JwtAdminGuard, RolesGuard)
export class SupportController {
    constructor(private readonly supportService: SupportService) { }

    @Get('tickets')
    @Roles('admin', 'moderator')
    async getTickets(@Query() query: any, @CurrentAdmin() admin: any) {
        if (query.assignedTo === 'me') {
            query.assignedTo = admin.id;
        }
        return this.supportService.getTickets(query);
    }

    @Get('stats')
    @Roles('admin', 'moderator')
    async getStats() {
        return this.supportService.getTicketStats();
    }

    @Get('tickets/:id')
    @Roles('admin', 'moderator')
    async getTicket(@Param('id') id: string) {
        return this.supportService.getTicket(id);
    }

    @Post('tickets/:id/reply')
    @Roles('admin', 'moderator')
    async replyToTicket(
        @Param('id') id: string,
        @Body() body: { message: string },
        @CurrentAdmin() admin: any,
        @Req() req: any,
    ) {
        return this.supportService.replyToTicket(id, body.message, admin.id, req);
    }

    @Patch('tickets/:id/status')
    @Roles('admin', 'moderator')
    async updateStatus(
        @Param('id') id: string,
        @Body() body: { status: string },
        @CurrentAdmin() admin: any,
        @Req() req: any,
    ) {
        return this.supportService.updateStatus(id, body.status, admin.id, req);
    }

    @Patch('tickets/:id/assign')
    @Roles('admin', 'moderator')
    async assignTicket(
        @Param('id') id: string,
        @Body() body: { adminId: string },
        @CurrentAdmin() admin: any,
        @Req() req: any,
    ) {
        return this.supportService.assignTicket(id, body.adminId, admin.id, req);
    }

    @Post('mock')
    @Roles('admin')
    async createMock(@Body() data: any) {
        return this.supportService.createMockTicket(data);
    }
}
