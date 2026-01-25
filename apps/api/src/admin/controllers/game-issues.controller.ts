import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { GameIssuesService } from '../services/game-issues.service';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CurrentAdmin } from '../decorators/current-admin.decorator';

@Controller('admin/games')
@UseGuards(JwtAdminGuard, RolesGuard)
export class GameIssuesController {
    constructor(private readonly service: GameIssuesService) { }

    @Get(':gameId/issues')
    async getIssues(@Param('gameId') gameId: string) {
        return this.service.findByGame(gameId);
    }

    @Post(':gameId/issues')
    async createIssue(
        @Param('gameId') gameId: string,
        @Body() body: any,
        @CurrentAdmin() admin: any
    ) {
        return this.service.create({ ...body, gameId }, admin.id);
    }

    @Patch('issues/:id')
    async updateIssue(
        @Param('id') id: string,
        @Body() body: any,
        @CurrentAdmin() admin: any
    ) {
        return this.service.update(id, body, admin.id);
    }
}
