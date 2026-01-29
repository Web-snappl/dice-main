import 'package:flutter/material.dart';
import '../utils/audio.dart';
import '../utils/app_theme.dart';

enum NeonButtonVariant { primary, secondary, gold, danger }

class NeonButton extends StatefulWidget {
  final Widget child;
  final NeonButtonVariant variant;
  final bool fullWidth;
  final VoidCallback? onPressed;
  final bool disabled;
  final EdgeInsetsGeometry? padding;
  final String? className;

  const NeonButton({
    super.key,
    required this.child,
    this.variant = NeonButtonVariant.primary,
    this.fullWidth = false,
    this.onPressed,
    this.disabled = false,
    this.padding,
    this.className,
  });

  @override
  State<NeonButton> createState() => _NeonButtonState();
}

class _NeonButtonState extends State<NeonButton> {
  bool _isHovered = false;
  bool _isActive = false;

  @override
  Widget build(BuildContext context) {
    final audioManager = AudioManager();

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      cursor: widget.disabled ? SystemMouseCursors.forbidden : SystemMouseCursors.click,
      child: GestureDetector(
        onTapDown: (_) => setState(() => _isActive = true),
        onTapUp: (_) => setState(() => _isActive = false),
        onTapCancel: () => setState(() => _isActive = false),
        onTap: widget.disabled
            ? null
            : () {
                audioManager.play(SoundType.click);
                widget.onPressed?.call();
              },
        child: AnimatedScale(
          scale: _isActive && !widget.disabled ? 0.95 : 1.0,
          duration: const Duration(milliseconds: 100),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: widget.fullWidth ? double.infinity : null,
            padding: widget.padding ?? const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            decoration: BoxDecoration(
              gradient: widget.disabled ? null : _getGradient(),
              color: widget.disabled 
                  ? const Color(0xFF161B22) 
                  : (widget.variant == NeonButtonVariant.secondary ? AppColors.panel : (widget.variant == NeonButtonVariant.danger ? AppColors.danger : null)),
              borderRadius: BorderRadius.circular(12),
              border: widget.disabled 
                  ? Border.all(color: const Color(0xFF30363D), width: 1)
                  : (widget.variant == NeonButtonVariant.secondary
                      ? Border.all(color: AppColors.neonDim, width: 1)
                      : null),
              boxShadow: widget.disabled || !_isHovered
                  ? []
                  : [
                      BoxShadow(
                        color: _getShadowColor(),
                        blurRadius: 25,
                        spreadRadius: 3,
                      ),
                    ],
            ),
            child: Opacity(
              opacity: widget.disabled ? 0.3 : 1.0,
              child: Center(
                child: DefaultTextStyle(
                  style: AppTextStyles.title(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: widget.disabled ? Colors.grey[600]! : _getTextColor(),
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
    if (widget.variant == NeonButtonVariant.secondary || widget.variant == NeonButtonVariant.danger) return null;
    
    switch (widget.variant) {
      case NeonButtonVariant.primary:
        return const LinearGradient(
          colors: [AppColors.neonDim, AppColors.neon],
        );
      case NeonButtonVariant.gold:
        return const LinearGradient(
          colors: [Color(0xFFCA8A04), AppColors.gold], // yellow-600 to gold
        );
      default:
        return const LinearGradient(
          colors: [AppColors.neonDim, AppColors.neon],
        );
    }
  }

  Color _getShadowColor() {
    switch (widget.variant) {
      case NeonButtonVariant.primary:
        return AppColors.neon.withValues(alpha: _isHovered ? 0.6 : 0.3);
      case NeonButtonVariant.gold:
        return AppColors.gold.withValues(alpha: _isHovered ? 0.6 : 0.3);
      case NeonButtonVariant.danger:
        return AppColors.danger.withValues(alpha: 0.3);
      default:
        return AppColors.neon.withValues(alpha: 0.3);
    }
  }

  Color _getTextColor() {
    switch (widget.variant) {
      case NeonButtonVariant.primary:
        return AppColors.background;
      case NeonButtonVariant.secondary:
        return AppColors.neon;
      case NeonButtonVariant.gold:
        return Colors.black;
      case NeonButtonVariant.danger:
        return Colors.white;
    }
  }
}
