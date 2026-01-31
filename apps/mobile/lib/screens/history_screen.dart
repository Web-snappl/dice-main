import 'package:flutter/material.dart';
import '../models/types.dart';
import '../utils/i18n.dart';
import '../utils/app_theme.dart';

class HistoryScreen extends StatelessWidget {
  final List<GameRecord> history;
  final Function(Screen) setScreen;
  final String language;

  const HistoryScreen({
    super.key,
    required this.history,
    required this.setScreen,
    this.language = 'English',
  });

  String t(String key) => I18n.translate(key, language);

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.panel,
                border: Border(bottom: BorderSide(color: AppColors.border, width: 0.5)),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left, color: Colors.grey),
                    onPressed: () => setScreen(Screen.home),
                  ),
                  Expanded(
                    child: Text(
                      t('Game History'),
                      style: AppTextStyles.title(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // History List
            Expanded(
              child: history.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.emoji_events,
                            size: 48,
                            color: Colors.grey.withValues(alpha: 0.5),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            t('No Games Played'),
                            style: AppTextStyles.body(
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: history.length,
                      itemBuilder: (context, index) {
                        final game = history[history.length - 1 - index]; // Reverse order
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.panel,
                            border: Border.all(color: AppColors.border),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              // Icon
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: game.result == GameResult.win
                                      ? AppColors.gold.withValues(alpha: 0.2)
                                      : game.result == GameResult.loss
                                          ? AppColors.danger.withValues(alpha: 0.2)
                                          : AppColors.textMuted.withValues(alpha: 0.2),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  game.result == GameResult.win
                                      ? Icons.emoji_events
                                      : game.result == GameResult.loss
                                          ? Icons.sentiment_dissatisfied
                                          : Icons.remove,
                                  color: game.result == GameResult.win
                                      ? AppColors.gold
                                      : game.result == GameResult.loss
                                          ? AppColors.danger
                                          : AppColors.textMuted,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 16),
                              // Game Info
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      game.date,
                                      style: AppTextStyles.digital(
                                        fontSize: 12,
                                        color: AppColors.textMuted,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      game.result == GameResult.win
                                          ? t('Victory')
                                          : game.result == GameResult.loss
                                              ? t('Defeat')
                                              : t('Draw'),
                                      style: AppTextStyles.body(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // Amount
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    game.result == GameResult.win
                                        ? '+${game.betAmount.toInt()}'
                                        : '-${game.betAmount.toInt()}',
                                    style: AppTextStyles.digital(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: game.result == GameResult.win
                                          ? AppColors.primary
                                          : AppColors.textMuted,
                                    ),
                                  ),
                                  Text(
                                    '${t('Score')}: ${game.userScore} - ${game.opponentScore}',
                                    style: AppTextStyles.body(
                                      fontSize: 10,
                                      color: AppColors.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
    );
  }
}
