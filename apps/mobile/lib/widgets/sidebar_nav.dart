import 'package:flutter/material.dart';
import '../utils/app_theme.dart';
import '../utils/audio.dart';
import '../models/types.dart';
import '../utils/i18n.dart';

class SidebarNav extends StatelessWidget {
  final Screen currentScreen;
  final Function(Screen) onScreenChange;
  final VoidCallback onLogout;
  final String language;

  const SidebarNav({
    super.key,
    required this.currentScreen,
    required this.onScreenChange,
    required this.onLogout,
    this.language = 'English',
  });

  String t(String key) => I18n.translate(key, language);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 260,
      height: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(
          right: BorderSide(color: AppColors.border),
        ),
      ),
      child: Column(
        children: [
          // Logo Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.casino,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  'DICE',
                  style: AppTextStyles.title(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textMain,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Nav Items
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _buildNavItem(
                  icon: Icons.home_outlined,
                  label: t('Lobby'),
                  isActive: currentScreen == Screen.home,
                  onTap: () => onScreenChange(Screen.home),
                ),
                _buildNavItem(
                  icon: Icons.casino_outlined,
                  label: t('Games'),
                  isActive: currentScreen == Screen.game || currentScreen == Screen.diceTable,
                  onTap: () => onScreenChange(Screen.game),
                ),
                _buildNavItem(
                  icon: Icons.account_balance_wallet_outlined,
                  label: t('Wallet'),
                  isActive: currentScreen == Screen.wallet,
                  onTap: () => onScreenChange(Screen.wallet),
                ),
                _buildNavItem(
                  icon: Icons.person_outline,
                  label: t('Profile'),
                  isActive: currentScreen == Screen.profile,
                  onTap: () => onScreenChange(Screen.profile),
                ),
              ],
            ),
          ),

          // Logout
          Padding(
            padding: const EdgeInsets.all(24),
            child: _buildNavItem(
              icon: Icons.logout,
              label: t('Logout'),
              isActive: false,
              onTap: onLogout,
              color: AppColors.danger,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
    Color? color,
  }) {
    final baseColor = color ?? AppColors.textMuted;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: () {
          AudioManager().play(SoundType.click);
          onTap();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isActive ? AppColors.primary.withValues(alpha: 0.1) : Colors.transparent,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: isActive 
                ? Border(left: BorderSide(color: AppColors.primary, width: 3))
                : null,
          ),
          child: Row(
            children: [
              Icon(
                icon,
                color: isActive ? AppColors.primary : baseColor,
                size: 20,
              ),
              const SizedBox(width: 12),
              Text(
                label,
                style: AppTextStyles.body(
                  fontSize: 14,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                  color: isActive ? AppColors.primary : baseColor,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
