import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Minimal color palette - pure black with red accent
class AppColors {
  // Background colors - pure black theme
  static const Color background = Color(0xFF0A0A0A);   // Pure black
  static const Color surface = Color(0xFF141414);      // Cards, panels
  static const Color surfaceLight = Color(0xFF1A1A1A); // Elevated elements
  static const Color border = Color(0xFF262626);       // Subtle borders
  
  // Legacy aliases (panels → surface)
  static const Color panel = surface;
  static const Color panelLight = surfaceLight;
  
  // Primary color - red accent
  static const Color primary = Color(0xFFDC2626);      // Red-600
  static const Color primaryLight = Color(0xFFEF4444); // Red-500
  static const Color primaryDark = Color(0xFF991B1B);  // Red-800
  
  // Accent color - purple (optional secondary)
  static const Color accent = Color(0xFFA855F7);       // Purple-500
  static const Color accentLight = Color(0xFFC084FC);  // Purple-400
  static const Color accentDark = Color(0xFF7C3AED);   // Purple-600
  
  // Legacy aliases
  static const Color neon = primary;
  static const Color neonDim = primaryDark;
  static const Color gold = Color(0xFFFBBF24);         // Amber-400 (games)
  
  // Semantic colors
  static const Color success = Color(0xFF22C55E);      // Green-500
  static const Color danger = Color(0xFFEF4444);       // Red-500
  static const Color warning = Color(0xFFF59E0B);      // Amber-500
  static const Color info = Color(0xFF3B82F6);         // Blue-500
  
  // Text colors
  static const Color textMain = Color(0xFFFFFFFF);     // White
  static const Color textMuted = Color(0xFF6B7280);    // Gray-500
  static const Color textSecondary = Color(0xFF9CA3AF); // Gray-400
}

class AppTextStyles {
  /// Title text style - Inter font
  static TextStyle title({
    double fontSize = 16,
    FontWeight fontWeight = FontWeight.w600,
    Color color = AppColors.textMain,
    double? letterSpacing,
    FontStyle? fontStyle,
    double? height,
  }) =>
      GoogleFonts.inter(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing ?? 0,
        fontStyle: fontStyle,
        height: height,
      );

  /// Body text style - Inter
  static TextStyle body({
    double fontSize = 14,
    FontWeight fontWeight = FontWeight.normal,
    Color color = AppColors.textMain,
    double? letterSpacing,
    FontStyle? fontStyle,
    double? height,
  }) =>
      GoogleFonts.inter(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing,
        fontStyle: fontStyle,
        height: height,
      );

  /// Display/hero text style - bold Inter
  static TextStyle display({
    double fontSize = 32,
    FontWeight fontWeight = FontWeight.bold,
    Color color = AppColors.textMain,
    double? letterSpacing,
    FontStyle? fontStyle,
    double? height,
  }) =>
      GoogleFonts.inter(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing ?? -0.5,
        fontStyle: fontStyle,
        height: height,
      );

  /// Digital/numeric text style
  static TextStyle digital({
    double fontSize = 14,
    FontWeight fontWeight = FontWeight.w500,
    Color color = AppColors.textMain,
    double? letterSpacing,
    FontStyle? fontStyle,
    double? height,
  }) =>
      GoogleFonts.inter(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing ?? 0.5,
        fontStyle: fontStyle,
        height: height,
      );
  
  /// Label text style
  static TextStyle label({
    double fontSize = 12,
    FontWeight fontWeight = FontWeight.w500,
    Color color = AppColors.textMuted,
    double? letterSpacing,
    double? height,
  }) =>
      GoogleFonts.inter(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing ?? 0.5,
        height: height,
      );
}

/// Minimal glow effects - only for primary actions
class AppGlow {
  /// Subtle primary glow (red)
  static List<BoxShadow> primary = [
    BoxShadow(
      color: AppColors.primary.withValues(alpha: 0.3),
      blurRadius: 16,
      spreadRadius: 0,
    ),
  ];
  
  /// No glow - for most elements
  static List<BoxShadow> none = [];
  
  // Legacy aliases
  static List<BoxShadow> get neon => primary;
  static List<BoxShadow> get accent => [
    BoxShadow(
      color: AppColors.accent.withValues(alpha: 0.3),
      blurRadius: 16,
      spreadRadius: 0,
    ),
  ];
  
  static List<BoxShadow> gold = [
    BoxShadow(
      color: AppColors.gold.withValues(alpha: 0.3),
      blurRadius: 16,
      spreadRadius: 0,
    ),
  ];
  
  static List<BoxShadow> danger = [
    BoxShadow(
      color: AppColors.danger.withValues(alpha: 0.3),
      blurRadius: 16,
      spreadRadius: 0,
    ),
  ];
}

/// Spacing constants
class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}

/// Border radius constants
class AppRadius {
  static const double sm = 6;
  static const double md = 8;
  static const double lg = 12;
  static const double xl = 16;
  static const double full = 9999;
}

/// Card decoration presets
class AppCard {
  static BoxDecoration get standard => BoxDecoration(
    color: AppColors.surface,
    borderRadius: BorderRadius.circular(AppRadius.lg),
    border: Border.all(color: AppColors.border, width: 1),
  );
  
  static BoxDecoration get elevated => BoxDecoration(
    color: AppColors.surfaceLight,
    borderRadius: BorderRadius.circular(AppRadius.lg),
    border: Border.all(color: AppColors.border, width: 1),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.3),
        blurRadius: 10,
        offset: const Offset(0, 4),
      ),
    ],
  );
}
