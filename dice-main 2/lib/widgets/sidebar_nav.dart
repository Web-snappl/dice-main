import 'package:flutter/material.dart';
import '../utils/app_theme.dart';
import '../utils/audio.dart';
import '../models/types.dart';
import 'package:google_fonts/google_fonts.dart';
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
      color: const Color(0xFF0F1115),
      child: Column(
        children: [
          // Logo Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'LARGE',
                  style: GoogleFonts.orbitron(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: 2,
                  ),
                ),
                Text(
                  'NUMBER',
                  style: GoogleFonts.orbitron(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: AppColors.neon,
                    letterSpacing: 2,
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

          // Bottom Section
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                // Online Mode Indicator
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.neon.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.neon.withValues(alpha: 0.1)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.neon.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.wifi, color: AppColors.neon, size: 16),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              t('Online Mode'),
                              style: const TextStyle(
                                color: AppColors.neon,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                            Text(
                              t('Multiplayer API'),
                              style: const TextStyle(
                                color: Colors.grey,
                                fontSize: 9,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                // Logout
                _buildNavItem(
                  icon: Icons.logout,
                  label: t('Logout'),
                  isActive: false,
                  onTap: onLogout,
                  color: AppColors.danger,
                ),
              ],
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
    return _SidebarNavItem(
      icon: icon,
      label: label,
      isActive: isActive,
      onTap: onTap,
      color: color,
    );
  }
}

class _SidebarNavItem extends StatefulWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;
  final Color? color;

  const _SidebarNavItem({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
    this.color,
  });

  @override
  State<_SidebarNavItem> createState() => _SidebarNavItemState();
}

class _SidebarNavItemState extends State<_SidebarNavItem> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final baseColor = widget.color ?? Colors.white;
    final isSelected = widget.isActive;
    
    // Orbitron font for standardized look
    final textStyle = GoogleFonts.orbitron(
      fontSize: 14,
      fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
      letterSpacing: 1,
      color: isSelected ? AppColors.neon : (baseColor.withValues(alpha: 0.8)),
    );

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: MouseRegion(
        onEnter: (_) => setState(() => _isHovered = true),
        onExit: (_) => setState(() => _isHovered = false),
        cursor: SystemMouseCursors.click,
        child: GestureDetector(
          onTap: () {
            AudioManager().play(SoundType.click);
            widget.onTap();
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              // Active: Left Border + Gradient
              // Hover: Grey Background (Wallet style)
              // Default: Transparent
              color: isSelected 
                  ? const Color(0xFF1E242C) 
                  : (_isHovered ? const Color(0xFF2C3038) : Colors.transparent),
              borderRadius: BorderRadius.only(
                topRight: const Radius.circular(8),
                bottomRight: const Radius.circular(8),
                topLeft: Radius.circular(isSelected ? 0 : 8),
                bottomLeft: Radius.circular(isSelected ? 0 : 8),
              ),
              border: isSelected 
                  ? const Border(left: BorderSide(color: AppColors.neon, width: 3))
                  : null, 
            ),
            child: Row(
              children: [
                Icon(
                  widget.icon,
                  color: isSelected ? AppColors.neon : baseColor.withValues(alpha: 0.8),
                  size: 20,
                ),
                const SizedBox(width: 16),
                Text(
                  widget.label,
                  style: textStyle,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
