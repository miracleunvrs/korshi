import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppShadows {
  // Тени как в вебе: shadow-xs / shadow-sm / shadow-md + shadow-green-600/20,30
  static const BoxShadow xs = BoxShadow(
    color: AppColors.shadowLight,
    blurRadius: 4,
    offset: Offset(0, 1),
  );
  static const BoxShadow sm = BoxShadow(
    color: Color(0x0F000000),
    blurRadius: 6,
    offset: Offset(0, 2),
  );
  static const BoxShadow md = BoxShadow(
    color: Color(0x14000000),
    blurRadius: 12,
    offset: Offset(0, 4),
  );
  static const BoxShadow card = BoxShadow(
    color: Color(0x08000000),
    blurRadius: 10,
    offset: Offset(0, 2),
  );
  static const BoxShadow primary = BoxShadow(
    color: AppColors.primaryShadow,
    blurRadius: 12,
    offset: Offset(0, 4),
  );
  static const BoxShadow primarySm = BoxShadow(
    color: Color(0x3316A34A),
    blurRadius: 8,
    offset: Offset(0, 2),
  );

  static const List<BoxShadow> cardShadow = [card];
  static const List<BoxShadow> elevated = [sm];
}
