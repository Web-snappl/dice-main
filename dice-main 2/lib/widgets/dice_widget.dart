import 'package:flutter/material.dart';

enum DiceColor { neon, gold, danger }
enum DiceSize { sm, md, lg }

class DiceWidget extends StatelessWidget {
  final int value;
  final bool isRolling;
  final DiceColor color;
  final DiceSize size;
  final bool isHovered;

  const DiceWidget({
    super.key,
    required this.value,
    this.isRolling = false,
    this.color = DiceColor.neon,
    this.size = DiceSize.md,
    this.isHovered = false,
  });

  @override
  Widget build(BuildContext context) {
    final sizeValue = _getSizeValue();
    final baseColor = color == DiceColor.gold ? const Color(0xFFFFD700) : _getColorValue();
    
    // Animate color/glow on hover
    final targetColor = isHovered 
        ? (color == DiceColor.gold 
            ? const Color(0xFFFFE55C) 
            : (color == DiceColor.danger 
                ? const Color(0xFFFF6B6B) 
                : const Color(0xFF80FFFA)))
        : baseColor;

    return TweenAnimationBuilder<Color?>(
      duration: const Duration(milliseconds: 300),
      tween: ColorTween(begin: baseColor, end: targetColor),
      builder: (context, colorValue, _) {
        final effectiveColor = colorValue ?? baseColor;
        
        return TweenAnimationBuilder<double>(
          duration: isRolling ? const Duration(milliseconds: 100) : const Duration(milliseconds: 300),
          tween: Tween(
              begin: 0.0, 
              end: isRolling ? 1.0 : (isHovered ? 1.05 : 0.0)
          ),
          builder: (context, val, child) {
            final width = sizeValue;
            final height = sizeValue * 1.15; // Slightly taller
            final borderRadius = width * 0.18;
            
            Widget diceCore = Container(
              width: width,
              height: height,
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(borderRadius),
                border: Border.all(
                  color: effectiveColor,
                  width: size == DiceSize.sm ? 1.5 : (size == DiceSize.lg ? 3.2 : 2.4),
                ),
                boxShadow: [
                  BoxShadow(
                    color: effectiveColor.withValues(alpha: 0.4),
                    blurRadius: size == DiceSize.sm ? 6 : 12,
                    spreadRadius: size == DiceSize.sm ? 0 : 1.5,
                  ),
                  BoxShadow(
                    color: effectiveColor.withValues(alpha: 0.15),
                    blurRadius: size == DiceSize.sm ? 10 : 20,
                    spreadRadius: size == DiceSize.sm ? 1 : 3,
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(borderRadius - (size == DiceSize.sm ? 1 : 2.5)),
                child: Stack(
                  children: [
                    Container(color: Colors.black),
                    
                    // Glossy overlay (Top 50%)
                    Positioned(
                      top: 0,
                      left: 0,
                      right: 0,
                      height: height * 0.5,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.1),
                        ),
                      ),
                    ),

                    // Dots layer
                    Center(
                      child: Transform.rotate(
                        angle: isRolling ? val * 6.28 : 0,
                        child: _buildDots(effectiveColor, width, height),
                      ),
                    ),
                  ],
                ),
              ),
            );

            // Bouncing rolling animation
            if (isRolling) {
               return TweenAnimationBuilder<double>(
                 duration: const Duration(milliseconds: 500),
                 tween: Tween(begin: 0.0, end: 1.0),
                 builder: (context, bounceVal, _) {
                    final offsetY = -10 * (bounceVal < 0.5 ? bounceVal * 2 : (1 - bounceVal) * 2);
                    return Transform.translate( offset: Offset(0, offsetY), child: diceCore );
                 },
               );
            }

            return diceCore;
          },
        );
      },
    );
  }

  double _getSizeValue() {
    switch (size) {
      case DiceSize.sm:
        return 48; // w-12
      case DiceSize.lg:
        return 110; 
      case DiceSize.md:
        return 80; 
    }
  }

  Color _getColorValue() {
    switch (color) {
      case DiceColor.gold:
        return const Color(0xFFFFD700);
      case DiceColor.danger:
        return const Color(0xFFFF4C4C);
      case DiceColor.neon:
        return const Color(0xFF66FCF1);
    }
  }

  Color _getDotColor() => _getColorValue(); // Not used directly anymore, using effectiveColor

  Widget _buildDots(Color dotColor, double width, double height) {
    // Relative dot sizes from React code
    double dotSizeValue;
    switch (this.size) {
      case DiceSize.sm:
        dotSizeValue = 6; 
        break;
      case DiceSize.lg:
        dotSizeValue = 18; 
        break;
      case DiceSize.md:
        dotSizeValue = 12; 
        break;
    }

    return Container(
      width: width,
      height: height,
      child: _getDotLayout(dotColor, dotSizeValue, width, height),
    );
  }

  Widget _getDotLayout(Color dotColor, double dotSize, double width, double height) {
    // Relative padding for different layouts
    final paddingHorizontal = width * 0.18;
    final paddingVertical = height * 0.14;
    
    Widget dot = _buildDot(dotColor, dotSize);

    switch (value) {
      case 1:
        return Center(child: dot);
      case 2:
        return Padding(
          padding: EdgeInsets.symmetric(horizontal: paddingHorizontal, vertical: paddingVertical),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Align(alignment: Alignment.topLeft, child: dot),
              Align(alignment: Alignment.bottomRight, child: dot),
            ],
          ),
        );
      case 3:
        return Padding(
          padding: EdgeInsets.symmetric(horizontal: paddingHorizontal, vertical: paddingVertical),
          child: Stack(
            children: [
              Align(alignment: Alignment.topLeft, child: dot),
              Center(child: dot),
              Align(alignment: Alignment.bottomRight, child: dot),
            ],
          ),
        );
      case 4:
        return Padding(
          padding: EdgeInsets.symmetric(horizontal: paddingHorizontal, vertical: paddingVertical),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [dot, dot],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [dot, dot],
              ),
            ],
          ),
        );
      case 5:
        return Padding(
          padding: EdgeInsets.symmetric(horizontal: paddingHorizontal, vertical: paddingVertical),
          child: Stack(
            children: [
              Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [dot, dot]),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [dot, dot]),
                ],
              ),
              Center(child: dot),
            ],
          ),
        );
      case 6:
        return Padding(
          padding: EdgeInsets.symmetric(horizontal: paddingHorizontal, vertical: paddingVertical),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [dot, dot, dot],
              ),
              Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [dot, dot, dot],
              ),
            ],
          ),
        );
      default:
        return Center(child: dot);
    }
  }

  Widget _buildDot(Color color, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.4),
            blurRadius: size * 0.4, 
            spreadRadius: size * 0.1,
          ),
          BoxShadow(
            color: color.withValues(alpha: 0.2),
            blurRadius: size * 0.8,
            spreadRadius: 0,
          ),
        ],
      ),
    );
  }
}
