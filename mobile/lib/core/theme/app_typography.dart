import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// Типографика HouseSM — Inter, как в вебе `layout.tsx: Inter({ subsets: ["latin","cyrillic"]})`
/// Размеры выровнены с веб `text-[10px]..text-lg` + Tailwind scale.
class AppTypography {
  static TextTheme lightTextTheme =
      GoogleFonts.interTextTheme(ThemeData.light().textTheme).copyWith(
    // Display
    displayLarge: GoogleFonts.inter(
      fontSize: 24,
      fontWeight: FontWeight.w800,
      height: 1.2,
      letterSpacing: -0.5,
      color: AppColors.textPrimaryLight,
    ),
    // H1 — ЖК «Солнечный» 15/bold в вебе, 18/bold Чаты
    titleLarge: GoogleFonts.inter(
      fontSize: 18,
      fontWeight: FontWeight.w700,
      height: 1.25,
      letterSpacing: -0.2,
      color: AppColors.textPrimaryLight,
    ),
    titleMedium: GoogleFonts.inter(
      fontSize: 16,
      fontWeight: FontWeight.w700,
      height: 1.3,
      color: AppColors.textPrimaryLight,
    ),
    titleSmall: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w700,
      height: 1.3,
      color: AppColors.textPrimaryLight,
    ),
    // Body — контент поста 14/1.5 relaxed
    bodyLarge: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w400,
      height: 1.5,
      color: AppColors.textPrimaryLight,
    ),
    bodyMedium: GoogleFonts.inter(
      fontSize: 13,
      fontWeight: FontWeight.w400,
      height: 1.5,
      color: AppColors.textPrimaryLight,
    ),
    bodySmall: GoogleFonts.inter(
      fontSize: 12,
      fontWeight: FontWeight.w400,
      height: 1.4,
      color: AppColors.textSecondaryLight,
    ),
    // Labels — чипы 12/medium, бейджи 10-11
    labelLarge: GoogleFonts.inter(
      fontSize: 12,
      fontWeight: FontWeight.w600,
      height: 1.2,
      color: AppColors.textPrimaryLight,
    ),
    labelMedium: GoogleFonts.inter(
      fontSize: 11,
      fontWeight: FontWeight.w600,
      height: 1.2,
      color: AppColors.textSecondaryLight,
    ),
    labelSmall: GoogleFonts.inter(
      fontSize: 10,
      fontWeight: FontWeight.w700,
      height: 1.2,
      letterSpacing: 0.3,
      color: AppColors.textSecondaryLight,
    ),
  );

  static TextTheme darkTextTheme = GoogleFonts.interTextTheme(ThemeData.dark().textTheme).copyWith(
    displayLarge: lightTextTheme.displayLarge!.copyWith(color: AppColors.textPrimaryDark),
    titleLarge: lightTextTheme.titleLarge!.copyWith(color: AppColors.textPrimaryDark),
    titleMedium: lightTextTheme.titleMedium!.copyWith(color: AppColors.textPrimaryDark),
    titleSmall: lightTextTheme.titleSmall!.copyWith(color: AppColors.textPrimaryDark),
    bodyLarge: lightTextTheme.bodyLarge!.copyWith(color: AppColors.textPrimaryDark),
    bodyMedium: lightTextTheme.bodyMedium!.copyWith(color: AppColors.textPrimaryDark),
    bodySmall: lightTextTheme.bodySmall!.copyWith(color: AppColors.textSecondaryDark),
    labelLarge: lightTextTheme.labelLarge!.copyWith(color: AppColors.textPrimaryDark),
    labelMedium: lightTextTheme.labelMedium!.copyWith(color: AppColors.textSecondaryDark),
    labelSmall: lightTextTheme.labelSmall!.copyWith(color: AppColors.textSecondaryDark),
  );

  // Удобные шорткаты
  static TextStyle get badge => TextStyle(
        fontFamily: GoogleFonts.inter().fontFamily,
        fontSize: 10,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.2,
      );
  static TextStyle get chip => TextStyle(
        fontFamily: GoogleFonts.inter().fontFamily,
        fontSize: 12,
        fontWeight: FontWeight.w500,
      );
  static TextStyle get caption => TextStyle(
        fontFamily: GoogleFonts.inter().fontFamily,
        fontSize: 11,
        fontWeight: FontWeight.w400,
        color: AppColors.textSecondaryLight,
      );
}
