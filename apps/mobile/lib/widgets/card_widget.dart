import 'package:flutter/material.dart';
import '../utils/app_theme.dart';

/// Card variants - minimal design
enum CardVariant {
  /// Standard card with subtle border
  standard,
  /// Stat card for metrics display
  stat,
  /// Elevated card with shadow
  elevated,
}

/// Minimal card component
class AppCard extends StatelessWidget {
  final Widget child;
  final CardVariant variant;
  final EdgeInsetsGeometry? padding;
  final Color? backgroundColor;
  final VoidCallback? onTap;

  const AppCard({
    super.key,
    required this.child,
    this.variant = CardVariant.standard,
    this.padding,
    this.backgroundColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Widget cardContent = Container(
      padding: padding ?? const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: backgroundColor ?? AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.border, width: 1),
        boxShadow: variant == CardVariant.elevated ? [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ] : null,
      ),
      child: child,
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: cardContent,
      );
    }

    return cardContent;
  }
}

/// Stat card for displaying metrics
class StatCard extends StatelessWidget {
  final String title;
  final String value;
  final String? change;
  final bool isPositive;
  final IconData icon;

  const StatCard({
    super.key,
    required this.title,
    required this.value,
    this.change,
    this.isPositive = true,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      variant: CardVariant.stat,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: AppTextStyles.label(
                        fontSize: 12,
                        color: AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      value,
                      style: AppTextStyles.display(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textMain,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Icon(icon, color: Colors.white, size: 20),
              ),
            ],
          ),
          if (change != null) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(
                  isPositive ? Icons.arrow_upward : Icons.arrow_downward,
                  size: 14,
                  color: isPositive ? AppColors.success : AppColors.danger,
                ),
                const SizedBox(width: 4),
                Text(
                  change!,
                  style: AppTextStyles.body(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: isPositive ? AppColors.success : AppColors.danger,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
