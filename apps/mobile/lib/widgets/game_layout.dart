import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/types.dart';
import '../utils/app_theme.dart';
import '../utils/i18n.dart';
import 'sidebar_nav.dart';
import '../providers/app_provider.dart';
import '../utils/audio.dart';

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
      drawer: Drawer(
        backgroundColor: AppColors.surface,
        child: SidebarNav(
          currentScreen: currentScreen,
          onScreenChange: (screen) {
            onScreenChange(screen);
            Navigator.pop(context);
          },
          onLogout: onLogout,
          language: language,
        ),
      ),
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
                    color: AppColors.background,
                    child: child,
                  ),
                ),
              ],
            );
          }

          // Mobile Layout
          return Stack(
            children: [
              Container(
                color: AppColors.background,
                child: Column(
                  children: [
                    Expanded(child: child),
                    const SizedBox(height: 72),
                  ],
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

    return Container(
      height: 72,
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: navItems.map((item) {
            final isSelected = currentScreen == item['id'] || 
                             (item['id'] == Screen.game && currentScreen == Screen.diceTable);
            return Expanded(
              child: GestureDetector(
                onTap: () {
                  AudioManager().play(SoundType.click);
                  onScreenChange(item['id'] as Screen);
                },
                child: Container(
                  color: Colors.transparent,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        item['icon'] as IconData,
                        color: isSelected ? AppColors.primary : AppColors.textMuted,
                        size: 24,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        (item['label'] as String).toUpperCase(),
                        style: AppTextStyles.label(
                          fontSize: 10,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                          color: isSelected ? AppColors.primary : AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}
