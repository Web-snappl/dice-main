// src/admin/admin.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Schemas
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { Report, ReportSchema } from './schemas/report.schema';
import { GameConfig, GameConfigSchema } from './schemas/game-config.schema';
import { Tournament, TournamentSchema } from './schemas/tournament.schema';
import { Reward, RewardSchema } from './schemas/reward.schema';
import { AnalyticsEvent, AnalyticsEventSchema } from './schemas/analytics-event.schema';
import { Announcement, AnnouncementSchema, SupportTicket, SupportTicketSchema } from './schemas/communication.mongo'; // New schemas
import { users } from '../modules/auth/auth.mongoSchema';
import { gameHistory } from '../common/gameHistory.mongoSchema';
import { depositSchema, Deposit } from '../common/deposits.mongoSchema';
import { GameHistoryModel } from '../common/gameHistory.mongoSchema';

// Services
import { AuditLogService } from './services/audit-log.service';
import { AdminAuthService } from './services/admin-auth.service';
import { UsersService } from './services/users.service';
import { ReportsService } from './services/reports.service';
import { GamesService } from './services/games.service';
import { ScoresService } from './services/scores.service';
import { TournamentsService } from './services/tournaments.service';
import { RewardsService } from './services/rewards.service';
import { CommunicationService } from './services/communication.service'; // New Service
import { SupportService } from './services/support.service'; // New Service
import { GameIssue, GameIssueSchema } from './schemas/game-issue.schema'; // New
import { GameIssuesService } from './services/game-issues.service'; // New


// Controllers
import { AdminAuthController } from './controllers/admin-auth.controller';
import { UsersController } from './controllers/users.controller';
import { ReportsController } from './controllers/reports.controller';
import { GamesController } from './controllers/games.controller';
import { ScoresController } from './controllers/scores.controller';
import { TournamentsController } from './controllers/tournaments.controller';
import { RewardsController } from './controllers/rewards.controller';
import { FinancialController } from './controllers/financial.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { AuditLogController } from './controllers/audit-log.controller';
import { CommunicationController } from './controllers/communication.controller'; // New Controller
import { SupportController } from './controllers/support.controller'; // New Controller
import { GameIssuesController } from './controllers/game-issues.controller'; // New

// Guards
import { JwtAdminGuard } from './guards/jwt-admin.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Report.name, schema: ReportSchema },
      { name: GameConfig.name, schema: GameConfigSchema },
      { name: Tournament.name, schema: TournamentSchema },
      { name: Reward.name, schema: RewardSchema },
      { name: AnalyticsEvent.name, schema: AnalyticsEventSchema },
      { name: Announcement.name, schema: AnnouncementSchema }, // New
      { name: SupportTicket.name, schema: SupportTicketSchema }, // New
      { name: GameIssue.name, schema: GameIssueSchema }, // New
      { name: 'users', schema: users },
      { name: GameHistoryModel.name, schema: gameHistory },
      { name: Deposit.name, schema: depositSchema },
    ]),
  ],
  controllers: [
    AdminAuthController,
    UsersController,
    ReportsController,
    GamesController,
    ScoresController,
    TournamentsController,
    RewardsController,
    FinancialController,
    AnalyticsController,
    AuditLogController,
    CommunicationController, // New
    SupportController, // New
    GameIssuesController, // New
  ],
  providers: [
    AuditLogService,
    AdminAuthService,
    UsersService,
    ReportsService,
    GamesService,
    ScoresService,
    TournamentsService,
    RewardsService,
    CommunicationService, // New
    SupportService, // New
    GameIssuesService, // New
    JwtAdminGuard,
    RolesGuard,
  ],
  exports: [AdminAuthService, AuditLogService],
})
export class AdminModule implements OnModuleInit {
  constructor(private readonly adminAuthService: AdminAuthService) { }

  async onModuleInit() {
    // Seed admin account on startup if env vars are set
    try {
      const result = await this.adminAuthService.seedAdminAccount();
      if (result.created) {
        console.log(`🔐 Seeded admin account: ${result.email}`);
      } else if (result.email) {
        console.log(`🔐 Admin account already exists: ${result.email}`);
      }
    } catch (error) {
      console.error('Failed to seed admin account:', error);
    }
  }
}
