/// Единые отступы — основаны на Tailwind spacing scale (4px grid).
/// Использование: `AppSpacing.md` = 16 как основной контейнер.
class AppSpacing {
  static const double xxs = 4;
  static const double xs = 8;
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 20;
  static const double xl = 24;
  static const double xxl = 32;
  static const double xxxl = 40;

  // Семантические
  static const double screenPadding = md; // 16 — базовый отступ экрана
  static const double cardPadding = md; // 16
  static const double cardPaddingLarge = xl; // 24
  static const double sectionGap = xl; // 24 между секциями
  static const double itemGap = sm; // 12 между элементами в списке
  static const double chipGap = 8;
  static const double bottomNavPadding = 12;
}
