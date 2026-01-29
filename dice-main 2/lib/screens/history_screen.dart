import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/types.dart';
import '../utils/i18n.dart';

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
              decoration: const BoxDecoration(
                color: Color(0xFF1F2833),
                border: Border(bottom: BorderSide(color: Colors.grey, width: 0.5)),
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
                      style: GoogleFonts.orbitron(
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
                            style: GoogleFonts.poppins(
                              color: Colors.grey.withValues(alpha: 0.5),
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
                            color: const Color(0xFF1F2833),
                            border: Border.all(color: Colors.grey.shade800),
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
                                      ? const Color(0xFFFFD700).withValues(alpha: 0.2)
                                      : game.result == GameResult.loss
                                          ? Colors.red.withValues(alpha: 0.2)
                                          : Colors.grey.withValues(alpha: 0.2),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  game.result == GameResult.win
                                      ? Icons.emoji_events
                                      : game.result == GameResult.loss
                                          ? Icons.sentiment_dissatisfied
                                          : Icons.remove,
                                  color: game.result == GameResult.win
                                      ? const Color(0xFFFFD700)
                                      : game.result == GameResult.loss
                                          ? Colors.red
                                          : Colors.grey,
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
                                      style: GoogleFonts.rajdhani(
                                        fontSize: 12,
                                        color: Colors.grey,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      game.result == GameResult.win
                                          ? t('Victory')
                                          : game.result == GameResult.loss
                                              ? t('Defeat')
                                              : t('Draw'),
                                      style: GoogleFonts.poppins(
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
                                    style: GoogleFonts.rajdhani(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: game.result == GameResult.win
                                          ? const Color(0xFF66FCF1)
                                          : Colors.grey.shade500,
                                    ),
                                  ),
                                  Text(
                                    '${t('Score')}: ${game.userScore} - ${game.opponentScore}',
                                    style: GoogleFonts.poppins(
                                      fontSize: 10,
                                      color: Colors.grey,
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
