import 'package:flutter/material.dart';

/// Радиусы — синхронизированы с `globals.css --radius: 0.75rem = 12`
/// + используемые в вебе: rounded-xl (12), 2xl (16), 3xl (24), full (999)
class AppRadius {
  static const double sm = 8;
  static const double md = 12; // --radius
  static const double lg = 16; // rounded-2xl
  static const double xl = 20; // card 20 (Flutter исторически)
  static const double xxl = 24; // rounded-3xl
  static const double full = 999;

  static const BorderRadius radiusSm = BorderRadius.all(Radius.circular(sm));
  static const BorderRadius radiusMd = BorderRadius.all(Radius.circular(md));
  static const BorderRadius radiusLg = BorderRadius.all(Radius.circular(lg));
  static const BorderRadius radiusXl = BorderRadius.all(Radius.circular(xl));
  static const BorderRadius radiusXxl = BorderRadius.all(Radius.circular(xxl));
  static const BorderRadius radiusFull = BorderRadius.all(Radius.circular(full));

  // Компонентные
  static const BorderRadius card = radiusLg; // 16 — как в вебе border rounded-2xl
  static const BorderRadius cardLarge = radiusXxl; // 24 — для модалок/FFilter
  static const BorderRadius chip = radiusFull; // pills
  static const BorderRadius input = radiusLg; // 16 for search, 24 for chat input separate
  static const BorderRadius avatar = radiusLg;
  static const BorderRadius button = BorderRadius.all(Radius.circular(12));
}
