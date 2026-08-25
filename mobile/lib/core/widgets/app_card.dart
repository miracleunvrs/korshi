import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_radius.dart';
import '../theme/app_shadows.dart';

/// Базовая карта — соответствует вебу `bg-white border border-gray-100 rounded-2xl`
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? color;
  final BorderRadius? borderRadius;
  final List<BoxShadow>? shadows;
  final VoidCallback? onTap;
  final bool showBorder;

  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.color,
    this.borderRadius,
    this.shadows,
    this.onTap,
    this.showBorder = true,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = color ?? (isDark ? AppColors.bgCardDark : Colors.white);
    final border = showBorder
        ? BorderSide(color: isDark ? AppColors.borderDark : const Color(0xFFF1F5F9))
        : BorderSide.none;

    final container = Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: borderRadius ?? AppRadius.card,
        border: showBorder ? Border.fromBorderSide(border) : null,
        boxShadow: shadows ?? (isDark ? null : AppShadows.cardShadow),
      ),
      child: child,
    );

    if (onTap != null) {
      return Padding(
        padding: margin ?? EdgeInsets.zero,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: borderRadius ?? AppRadius.card,
            child: container,
          ),
        ),
      );
    }

    return Container(margin: margin, child: container);
  }
}

/// Карта без тени для feed (веб `article border-b p-4` full-bleed)
class FeedCard extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  const FeedCard({super.key, required this.child, this.onTap});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: isDark ? AppColors.bgCardDark : Colors.white,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(color: isDark ? AppColors.borderDark : const Color(0xFFF1F5F9)),
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}
