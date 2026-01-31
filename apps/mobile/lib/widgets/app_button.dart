import 'package:flutter/material.dart';
import '../utils/audio.dart';
import '../utils/app_theme.dart';

/// Button variants - minimal design system
enum ButtonVariant { 
  /// Solid red fill
  primary, 
  /// Dark fill with subtle border
  secondary, 
  /// Outline style with red border
  outline, 
  /// Ghost/transparent style
  ghost, 
  /// Danger/destructive action
  danger,
}

/// Button sizes
enum ButtonSize { sm, md, lg }

/// Minimal button component
class AppButton extends StatefulWidget {
  final Widget child;
  final ButtonVariant variant;
  final ButtonSize size;
  final bool fullWidth;
  final VoidCallback? onPressed;
  final bool disabled;
  final EdgeInsetsGeometry? padding;

  const AppButton({
    super.key,
    required this.child,
    this.variant = ButtonVariant.primary,
    this.size = ButtonSize.md,
    this.fullWidth = false,
    this.onPressed,
    this.disabled = false,
    this.padding,
  });

  @override
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton> {
  bool _isPressed = false;

  EdgeInsetsGeometry get _defaultPadding {
    switch (widget.size) {
      case ButtonSize.sm:
        return const EdgeInsets.symmetric(horizontal: 12, vertical: 8);
      case ButtonSize.md:
        return const EdgeInsets.symmetric(horizontal: 20, vertical: 12);
      case ButtonSize.lg:
        return const EdgeInsets.symmetric(horizontal: 28, vertical: 16);
    }
  }

  double get _fontSize {
    switch (widget.size) {
      case ButtonSize.sm:
        return 13;
      case ButtonSize.md:
        return 14;
      case ButtonSize.lg:
        return 16;
    }
  }

  @override
  Widget build(BuildContext context) {
    final audioManager = AudioManager();

    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      onTap: widget.disabled
          ? null
          : () {
              audioManager.play(SoundType.click);
              widget.onPressed?.call();
            },
      child: AnimatedScale(
        scale: _isPressed && !widget.disabled ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          width: widget.fullWidth ? double.infinity : null,
          padding: widget.padding ?? _defaultPadding,
          decoration: BoxDecoration(
            color: _getBackgroundColor(),
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: _getBorder(),
          ),
          child: Opacity(
            opacity: widget.disabled ? 0.5 : 1.0,
            child: Center(
              child: DefaultTextStyle(
                style: AppTextStyles.title(
                  fontSize: _fontSize,
                  fontWeight: FontWeight.w600,
                  color: widget.disabled ? AppColors.textMuted : _getTextColor(),
                ),
                child: widget.child,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Color _getBackgroundColor() {
    if (widget.disabled) return AppColors.surface;
    
    switch (widget.variant) {
      case ButtonVariant.primary:
        return _isPressed ? AppColors.primaryDark : AppColors.primary;
      case ButtonVariant.secondary:
        return _isPressed ? AppColors.surface : AppColors.surfaceLight;
      case ButtonVariant.danger:
        return _isPressed ? AppColors.danger.withValues(alpha: 0.8) : AppColors.danger;
      case ButtonVariant.outline:
      case ButtonVariant.ghost:
        return _isPressed ? AppColors.surface : Colors.transparent;
    }
  }

  Border? _getBorder() {
    switch (widget.variant) {
      case ButtonVariant.outline:
        return Border.all(
          color: widget.disabled ? AppColors.border : AppColors.primary,
          width: 1,
        );
      case ButtonVariant.secondary:
        return Border.all(
          color: AppColors.border,
          width: 1,
        );
      default:
        return null;
    }
  }

  Color _getTextColor() {
    switch (widget.variant) {
      case ButtonVariant.primary:
      case ButtonVariant.danger:
        return Colors.white;
      case ButtonVariant.secondary:
        return AppColors.textMain;
      case ButtonVariant.outline:
        return AppColors.primary;
      case ButtonVariant.ghost:
        return AppColors.textMain;
    }
  }
}

/// Legacy alias
typedef NeonButton = AppButton;
