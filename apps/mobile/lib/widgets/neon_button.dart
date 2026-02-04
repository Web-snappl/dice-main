import 'package:flutter/material.dart';
import '../utils/audio.dart';
import '../utils/app_theme.dart';

/// Button variants matching web-admin/web-landing design system
enum ButtonVariant { 
  /// Filled primary (red) background
  primary, 
  /// Filled secondary (purple accent) background
  secondary, 
  /// Outline style with border only
  outline, 
  /// Ghost/transparent style
  ghost, 
  /// Danger/destructive action
  danger,
  /// Gold variant for game/prize elements
  gold,
}

/// Button sizes matching shadcn/ui sizing
enum ButtonSize { sm, md, lg }

/// Reusable button component styled after web-admin and web-landing design
class AppButton extends StatefulWidget {
  final Widget child;
  final ButtonVariant variant;
  final ButtonSize size;
  final bool fullWidth;
  final VoidCallback? onPressed;
  final bool disabled;
  final EdgeInsetsGeometry? padding;
  final bool enableGlow;

  const AppButton({
    super.key,
    required this.child,
    this.variant = ButtonVariant.primary,
    this.size = ButtonSize.md,
    this.fullWidth = false,
    this.onPressed,
    this.disabled = false,
    this.padding,
    this.enableGlow = true,
  });

  @override
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton> {
  bool _isHovered = false;
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

  double get _borderRadius {
    switch (widget.size) {
      case ButtonSize.sm:
        return AppRadius.sm;
      case ButtonSize.md:
        return AppRadius.md;
      case ButtonSize.lg:
        return AppRadius.lg;
    }
  }

  @override
  Widget build(BuildContext context) {
    final audioManager = AudioManager();

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      cursor: widget.disabled ? SystemMouseCursors.forbidden : SystemMouseCursors.click,
      child: GestureDetector(
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
            duration: const Duration(milliseconds: 200),
            width: widget.fullWidth ? double.infinity : null,
            padding: widget.padding ?? _defaultPadding,
            decoration: BoxDecoration(
              gradient: _getGradient(),
              color: _getBackgroundColor(),
              borderRadius: BorderRadius.circular(_borderRadius),
              border: _getBorder(),
              boxShadow: _getShadow(),
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
      ),
    );
  }

  LinearGradient? _getGradient() {
    // No gradients - solid colors only
    return null;
  }

  Color? _getBackgroundColor() {
    if (widget.disabled) return AppColors.panelLight;
    
    switch (widget.variant) {
      case ButtonVariant.primary:
        return AppColors.primary;
      case ButtonVariant.secondary:
        return AppColors.accent;
      case ButtonVariant.gold:
        return const Color(0xFFFBBF24);
      case ButtonVariant.danger:
        return AppColors.danger;
      case ButtonVariant.outline:
        return _isHovered ? AppColors.primary.withValues(alpha: 0.1) : Colors.transparent;
      case ButtonVariant.ghost:
        return _isHovered ? AppColors.panelLight : Colors.transparent;
    }
  }

  Border? _getBorder() {
    switch (widget.variant) {
      case ButtonVariant.outline:
        return Border.all(
          color: widget.disabled ? AppColors.border : AppColors.primary.withValues(alpha: _isHovered ? 1 : 0.5),
          width: 1.5,
        );
      case ButtonVariant.ghost:
        return null;
      default:
        return null;
    }
  }

  List<BoxShadow> _getShadow() {
    if (widget.disabled || !widget.enableGlow || !_isHovered) return [];
    
    switch (widget.variant) {
      case ButtonVariant.primary:
        return [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.4),
            blurRadius: 20,
            spreadRadius: 0,
          ),
        ];
      case ButtonVariant.secondary:
        return [
          BoxShadow(
            color: AppColors.accent.withValues(alpha: 0.4),
            blurRadius: 20,
            spreadRadius: 0,
          ),
        ];
      case ButtonVariant.gold:
        return [
          BoxShadow(
            color: AppColors.gold.withValues(alpha: 0.4),
            blurRadius: 20,
            spreadRadius: 0,
          ),
        ];
      case ButtonVariant.danger:
        return [
          BoxShadow(
            color: AppColors.danger.withValues(alpha: 0.4),
            blurRadius: 20,
            spreadRadius: 0,
          ),
        ];
      default:
        return [];
    }
  }

  Color _getTextColor() {
    switch (widget.variant) {
      case ButtonVariant.primary:
      case ButtonVariant.danger:
        return Colors.white;
      case ButtonVariant.secondary:
        return Colors.white;
      case ButtonVariant.outline:
        return AppColors.primary;
      case ButtonVariant.ghost:
        return AppColors.textMain;
      case ButtonVariant.gold:
        return Colors.black;
    }
  }
}

/// Legacy alias for backward compatibility
/// @deprecated Use AppButton instead
typedef NeonButton = AppButton;

/// Legacy enum alias
/// @deprecated Use ButtonVariant instead  
enum NeonButtonVariant { primary, secondary, gold, danger }
