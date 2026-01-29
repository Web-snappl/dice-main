import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../models/types.dart';
import '../utils/app_theme.dart';
import '../utils/i18n.dart';
import 'sidebar_nav.dart';
import '../providers/app_provider.dart';
import '../utils/audio.dart';
import 'dart:ui' as ui;
import 'dart:math' as math;

class GameLayout extends StatelessWidget {
  final Widget child;
  final Screen currentScreen;
  final Function(Screen) onScreenChange;
  final VoidCallback onLogout;
  final bool isAdmin;
  final String language;
  
  const GameLayout({
    super.key,
    required this.child,
    required this.currentScreen,
    required this.onScreenChange,
    required this.onLogout,
    this.isAdmin = false,
    this.language = 'English',
  });

  String t(String key) => I18n.translate(key, language);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isDesktop = constraints.maxWidth > 900;

          if (isDesktop) {
            return Row(
              children: [
                SidebarNav(
                  currentScreen: currentScreen,
                  onScreenChange: onScreenChange,
                  onLogout: onLogout,
                  language: language,
                ),
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.background,
                    ),
                    child: CustomPaint(
                      painter: NoisePainter(opacity: 0.03),
                      child: Column(
                        children: [
                          Expanded(child: child),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            );
          }

          // Mobile Layout
          return Stack(
            children: [
              Container(
                  decoration: BoxDecoration(
                    color: AppColors.background,
                  ),
                child: CustomPaint(
                  painter: NoisePainter(opacity: 0.03),
                  child: Column(
                    children: [
                      Expanded(
                        child: child,
                      ),
                      const SizedBox(height: 80), // Space for bottom nav
                    ],
                  ),
                ),
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: _buildMobileBottomNav(context),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildMobileBottomNav(BuildContext context) {
    final navItems = [
      {'id': Screen.home, 'label': t('Lobby'), 'icon': Icons.home_outlined},
      {'id': Screen.game, 'label': t('Games'), 'icon': Icons.casino_outlined},
      {'id': Screen.wallet, 'label': t('Wallet'), 'icon': Icons.account_balance_wallet_outlined},
      {'id': Screen.profile, 'label': t('Profile'), 'icon': Icons.person_outline},
    ];

    final isOnline = context.select<AppProvider, bool>((p) => p.isOnline);

    return Container(
      height: 80,
      decoration: BoxDecoration(
        color: AppColors.panel.withValues(alpha: 0.95),
        border: Border(top: BorderSide(color: Colors.grey.withValues(alpha: 0.2))),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            ...navItems.map((item) {
              final isSelected = currentScreen == item['id'] || 
                               (item['id'] == Screen.game && currentScreen == Screen.diceTable);
              return Expanded(
                child: InkWell(
                  onTap: () {
                    AudioManager().play(SoundType.click);
                    onScreenChange(item['id'] as Screen);
                  },
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.neon.withValues(alpha: 0.1) : Colors.transparent,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        transform: isSelected ? Matrix4.translationValues(0, -4, 0) : Matrix4.identity(),
                        child: Icon(
                          item['icon'] as IconData,
                          color: isSelected ? AppColors.neon : Colors.grey,
                          size: 24,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        (item['label'] as String).toUpperCase(),
                        style: TextStyle(
                          color: isSelected ? AppColors.neon : Colors.grey,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
            // Online/Offline Toggle (Mini)
            Expanded(
              child: InkWell(
                onTap: () {
                   final provider = Provider.of<AppProvider>(context, listen: false);
                   provider.toggleOnlineStatus(); 
                },
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isOnline ? Colors.green.withValues(alpha: 0.1) : Colors.transparent,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Icon(
                        isOnline ? Icons.wifi : Icons.wifi_off,
                        color: isOnline ? Colors.green : Colors.grey,
                        size: 24,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isOnline ? 'ON' : 'OFF',
                      style: TextStyle(
                        color: isOnline ? Colors.green : Colors.grey,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class NoisePainter extends CustomPainter {
  final double opacity;
  NoisePainter({this.opacity = 0.05});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(opacity)
      ..strokeWidth = 1.0;

    final random = math.Random(42); // Deterministic noise
    final points = <Offset>[];
    for (int i = 0; i < 1000; i++) {
      final x = random.nextDouble() * size.width;
      final y = random.nextDouble() * size.height;
      points.add(Offset(x, y));
    }
    canvas.drawPoints(ui.PointMode.points, points, paint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
