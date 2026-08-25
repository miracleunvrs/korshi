import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class TerritoryBadge extends StatelessWidget {
  final String territory; // complex | building | entrance
  const TerritoryBadge({super.key, required this.territory});

  String get label {
    switch (territory) {
      case 'complex':
        return 'Весь ЖК';
      case 'building':
        return 'Мой дом';
      case 'entrance':
        return 'Мой подъезд';
      default:
        return territory;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
      ),
    );
  }
}

class PostTypeBadge extends StatelessWidget {
  final String type;
  const PostTypeBadge({super.key, required this.type});

  static const _labels = {
    'post': 'Публикация',
    'announcement': 'Объявление',
    'service': 'Услуга',
    'help_request': 'Просьба о помощи',
    'poll': 'Опрос',
    'initiative': 'Инициатива',
    'event': 'Событие',
    'official_news': 'Официальная новость',
    'official_poll': 'Официальный опрос',
    'fundraiser': 'Сбор',
  };

  @override
  Widget build(BuildContext context) {
    final isOfficial = type.startsWith('official');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: isOfficial ? AppColors.badgeGreenBg : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        _labels[type] ?? type,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: isOfficial ? AppColors.badgeGreenText : const Color(0xFF64748B),
        ),
      ),
    );
  }
}
