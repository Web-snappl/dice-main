import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { CommunicationService } from '../services/communication.service';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentAdmin } from '../decorators/current-admin.decorator';

@Controller('admin/communication')
@UseGuards(JwtAdminGuard, RolesGuard)
export class CommunicationController {
    constructor(private readonly communicationService: CommunicationService) { }

    @Get('announcements')
    @Roles('admin', 'moderator')
    async getAnnouncements(@Query() query: any) {
        return this.communicationService.getAnnouncements(query);
    }

    @Post('announcements')
    @Roles('admin')
    async createAnnouncement(
        @Body() data: any,
        @CurrentAdmin() admin: any,
        @Req() req: any,
    ) {
        return this.communicationService.createAnnouncement(data, admin.id, req);
    }

    @Patch('announcements/:id')
    @Roles('admin')
    async updateAnnouncement(
        @Param('id') id: string,
        @Body() data: any,
        @CurrentAdmin() admin: any,
        @Req() req: any,
    ) {
        return this.communicationService.updateAnnouncement(id, data, admin.id, req);
    }

    @Delete('announcements/:id')
    @Roles('admin')
    async deleteAnnouncement(
        @Param('id') id: string,
        @CurrentAdmin() admin: any,
        @Req() req: any,
    ) {
        return this.communicationService.deleteAnnouncement(id, admin.id, req);
    }

    @Post('notifications/send')
    @Roles('admin')
    async sendNotification(
        @Body() data: any,
        @CurrentAdmin() admin: any,
        @Req() req: any,
    ) {
        return this.communicationService.sendNotification(data, admin.id, req);
    }
}
