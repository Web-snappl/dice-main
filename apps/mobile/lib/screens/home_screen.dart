import 'package:flutter/material.dart';
import '../models/types.dart';
import '../utils/i18n.dart';
import '../utils/app_theme.dart';
import '../widgets/dice_widget.dart';

class HomeScreen extends StatelessWidget {
  final User user;
  final Function(Screen) onScreenChange;
  final String language;

  const HomeScreen({
    super.key,
    required this.user,
    required this.onScreenChange,
    this.language = 'Français',
  });

  String t(String key) => I18n.translate(key, language);

  String get _formattedBalance {
    return user.wallet.balance.toInt().toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isDesktop = constraints.maxWidth > 900;
        
        return SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: EdgeInsets.all(isDesktop ? 32 : 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (!isDesktop) ...[
                _buildMobileHeader(context),
                const SizedBox(height: 24),
              ],
              
              _buildProfileCard(isDesktop),
              const SizedBox(height: 24),
              
              _buildSectionHeader(t('Games')),
              const SizedBox(height: 16),
              _buildGameCards(isDesktop),
              
              if (!isDesktop) const SizedBox(height: 80),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMobileHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        IconButton(
          icon: const Icon(Icons.menu, color: AppColors.textMain, size: 24),
          onPressed: () {
            Scaffold.of(context).openDrawer();
          },
        ),
        Text(
          'DICE',
          style: AppTextStyles.title(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(width: 48),
      ],
    );
  }

  Widget _buildProfileCard(bool isDesktop) {
    return Container(
      padding: EdgeInsets.all(isDesktop ? 24 : 20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.border),
      ),
      child: isDesktop
          ? Row(
              children: [
                Expanded(child: _buildUserInfo(isDesktop)),
                _buildBalanceDisplay(isDesktop),
              ],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildUserInfo(isDesktop),
                const SizedBox(height: 16),
                _buildBalanceDisplay(isDesktop),
              ],
            ),
    );
  }

  Widget _buildUserInfo(bool isDesktop) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AppColors.surfaceLight,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.border),
          ),
          child: Center(
            child: Text(
              user.name.isNotEmpty ? user.name[0].toUpperCase() : 'U',
              style: AppTextStyles.title(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                user.name,
                style: AppTextStyles.title(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMain,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                t('Player'),
                style: AppTextStyles.label(
                  fontSize: 12,
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBalanceDisplay(bool isDesktop) {
    return GestureDetector(
      onTap: () => onScreenChange(Screen.wallet),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  t('Balance'),
                  style: AppTextStyles.label(
                    fontSize: 11,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$_formattedBalance CFA',
                  style: AppTextStyles.title(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),
            Icon(
              Icons.arrow_forward_ios,
              size: 14,
              color: AppColors.textMuted,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title.toUpperCase(),
      style: AppTextStyles.label(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: AppColors.textMuted,
        letterSpacing: 1,
      ),
    );
  }

  Widget _buildGameCards(bool isDesktop) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: isDesktop ? 4 : 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: isDesktop ? 1.2 : 0.9,
      children: [
        _GameCard(
          title: t('Casino Dice'),
          icon: Icons.casino,
          onTap: () => onScreenChange(Screen.game),
        ),
        _GameCard(
          title: t('Dice Table'),
          icon: Icons.grid_view,
          onTap: () => onScreenChange(Screen.diceTable),
        ),
      ],
    );
  }
}

class _GameCard extends StatefulWidget {
  final String title;
  final IconData icon;
  final VoidCallback onTap;

  const _GameCard({
    required this.title,
    required this.icon,
    required this.onTap,
  });

  @override
  State<_GameCard> createState() => _GameCardState();
}

class _GameCardState extends State<_GameCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      onTap: widget.onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        transform: Matrix4.identity()..scale(_isPressed ? 0.97 : 1.0),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Icon(
                widget.icon,
                size: 32,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              widget.title.toUpperCase(),
              textAlign: TextAlign.center,
              style: AppTextStyles.label(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.textMain,
                letterSpacing: 1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
