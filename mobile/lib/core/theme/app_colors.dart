import 'package:flutter/material.dart';

class AppColors {
  // Korshi brand: accessible pine for actions, vivid green for accents.
  static const primary = Color(0xFF166534);
  static const primaryDark = Color(0xFF14532D);
  static const primaryLight = Color(0xFFDCFCE7); // green-100
  static const primaryAccent = Color(0xFF16A34A);
  static const communityAccent = Color(0xFF7C3AED);
  static const primaryForeground = Colors.white; // hsl 355.7 100% 97.3% → white
  static const primaryForegroundDark = Color(0xFF052E16); // 144.9 80.4% 10%

  // Backgrounds & Neutrals — mapped from globals.css
  static const bgLight = Color(0xFFF8F7F2);
  static const backgroundLight = Color(0xFFFFFEFB);
  static const foregroundLight = Color(0xFF1C1917);
  static const bgCardLight = Color(0xFFFFFEFB);
  static const bgDark = Color(0xFF121214);
  static const bgCardDark = Color(0xFF1C1C1E);
  static const backgroundDark = Color(0xFF020617);
  static const foregroundDark = Color(0xFFF8FAFC); // 210 40% 98%
  static const cardDark = Color(0xFF020617);
  static const cardForegroundDark = Color(0xFFF8FAFC);

  // Secondary / Muted / Accent — hsl 210 40% 96.1% → #F1F5F9 light, 217.2 32.6% 17.5% → #1E293B dark
  static const secondaryLight = Color(0xFFF0EEEA);
  static const secondaryForegroundLight = Color(0xFF292524);
  static const mutedLight = Color(0xFFF0EEEA);
  static const mutedForegroundLight = Color(0xFF6B625B);
  static const accentLight = Color(0xFFF0EEEA);
  static const accentForegroundLight = Color(0xFF292524);
  static const secondaryDark = Color(0xFF1E293B);
  static const secondaryForegroundDark = Color(0xFFF8FAFC);
  static const mutedDark = Color(0xFF1E293B);
  static const mutedForegroundDark = Color(0xFF94A3B8); // 215 20.2% 65.1%
  static const accentDark = Color(0xFF1E293B);

  // Borders & Inputs — 214.3 31.8% 91.4% → #E2E8F0 light
  static const borderLight = Color(0xFFE4E0DB);
  static const borderLightSubtle = Color(0xFFEDEAE5);
  static const inputLight = Color(0xFFE4E0DB);
  static const ringLight = Color(0xFF166534);
  static const borderDark = Color(0xFF1E293B); // 217.2 32.6% 17.5%
  static const inputDark = Color(0xFF1E293B);
  static const ringDark = Color(0xFF15803D);

  // Popover
  static const popoverLight = Colors.white;
  static const popoverForegroundLight = Color(0xFF020617);
  static const popoverDark = Color(0xFF020617);

  // Destructive — 0 84.2% 60.2% light → #EF4444, 0 62.8% 30.6% dark → #7F1D1D
  static const destructive = Color(0xFFEF4444);
  static const destructiveForeground = Color(0xFFF8FAFC);
  static const destructiveDark = Color(0xFF7F1D1D);

  // Charts (from tailwind config, fallback greens/blues)
  static const chart1 = Color(0xFF16A34A);
  static const chart2 = Color(0xFF0EA5E9);
  static const chart3 = Color(0xFFF59E0B);
  static const chart4 = Color(0xFF8B5CF6);
  static const chart5 = Color(0xFFEC4899);

  // Text colors (semantic)
  static const textPrimaryLight = Color(0xFF1C1917);
  static const textSecondaryLight = Color(0xFF6B625B);
  static const textTertiaryLight = Color(0xFF9A918A);
  static const textPrimaryDark = Color(0xFFF8FAFC);
  static const textSecondaryDark = Color(0xFF94A3B8);
  static const textTertiaryDark = Color(0xFF64748B);

  // Accent Badges & Category colors
  static const badgeAmberBg = Color(0xFFFEF3C7);
  static const badgeAmberText = Color(0xFF92400E);
  static const badgeBlueBg = Color(0xFFE0F2FE);
  static const badgeBlueText = Color(0xFF0369A1);
  static const badgeGreenBg = Color(0xFFDCFCE7);
  static const badgeGreenText = Color(0xFF166534);
  static const badgeRoseBg = Color(0xFFFFE4E6);
  static const badgeRoseText = Color(0xFF9F1239);
  static const badgePurpleBg = Color(0xFFF3E8FF);
  static const badgePurpleText = Color(0xFF6B21A8);
  static const badgeGrayBg = Color(0xFFF1F5F9);
  static const badgeGrayText = Color(0xFF475569);

  // Category (classifieds)
  static const catAnnouncementBg = Color(0xFFFEF3C7);
  static const catAnnouncementFg = Color(0xFFD97706);
  static const catServiceBg = Color(0xFFEFF6FF);
  static const catServiceFg = Color(0xFF2563EB);
  static const catJobBg = Color(0xFFF3E8FF);
  static const catJobFg = Color(0xFF9333EA);
  static const catHelpBg = Color(0xFFFFE4E6);
  static const catHelpFg = Color(0xFFE11D48);

  // Shadows tints
  static const shadowLight = Color(0x0A000000); // 4% as in chat bubbles
  static const shadowMedium = Color(0x14000000);
  static const primaryShadow = Color(0x3D166534);

  // Legacy aliases for compatibility
  static const bgLightLegacy = bgLight;
}
