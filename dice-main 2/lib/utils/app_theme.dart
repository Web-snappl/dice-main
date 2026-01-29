import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const Color background = Color(0xFF12141D); // Slightly lighter than pitch black
  static const Color panel = Color(0xFF1E2732);      // Slightly lighter slate
  static const Color neon = Color(0xFF66FCF1);
  static const Color neonDim = Color(0xFF45A29E);
  static const Color gold = Color(0xFFFFD700);
  static const Color danger = Color(0xFFFF4C4C);
  static const Color textMain = Color(0xFFFFFFFF);
  static const Color textMuted = Color(0xFFD1D5DB);  // Lighter grey
}

class AppTextStyles {
  static TextStyle title({
    double fontSize = 16,
    FontWeight fontWeight = FontWeight.normal,
    Color color = AppColors.textMain,
    double? letterSpacing,
    FontStyle? fontStyle,
  }) =>
      GoogleFonts.orbitron(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing,
        fontStyle: fontStyle,
      );

  static TextStyle body({
    double fontSize = 14,
    FontWeight fontWeight = FontWeight.normal,
    Color color = AppColors.textMain,
    double? letterSpacing,
    FontStyle? fontStyle,
  }) =>
      GoogleFonts.poppins(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing,
        fontStyle: fontStyle,
      );

  static TextStyle digital({
    double fontSize = 14,
    FontWeight fontWeight = FontWeight.normal,
    Color color = AppColors.textMain,
    double? letterSpacing,
    FontStyle? fontStyle,
  }) =>
      GoogleFonts.rajdhani(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing,
        fontStyle: fontStyle,
      );
}

class AppGlow {
  static List<BoxShadow> neon = [
    const BoxShadow(
      color: AppColors.neon,
      blurRadius: 10,
      spreadRadius: 0,
    ),
    const BoxShadow(
      color: AppColors.neon,
      blurRadius: 20,
      spreadRadius: 0,
    ),
  ];

  static List<BoxShadow> gold = [
    const BoxShadow(
      color: AppColors.gold,
      blurRadius: 10,
      spreadRadius: 0,
    ),
    const BoxShadow(
      color: AppColors.gold,
      blurRadius: 20,
      spreadRadius: 0,
    ),
  ];
}
