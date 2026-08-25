import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/widgets/empty_state.dart';

class ClassifiedsScreen extends StatefulWidget {
  const ClassifiedsScreen({super.key});
  @override
  State<ClassifiedsScreen> createState() => _ClassifiedsScreenState();
}

class _ClassifiedsScreenState extends State<ClassifiedsScreen> {
  String activeTab = 'Все';
  String searchQuery = '';

  final items = [
    {
      'id': '1',
      'title': 'Продам диван',
      'category': 'Объявления',
      'price': '5 000 ₸',
      'location': 'Дом 2 • 3 минуты назад',
      'image':
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop&q=80',
    },
    {
      'id': '2',
      'title': 'Услуги электрика',
      'category': 'Услуги',
      'price': 'от 500 ₸',
      'location': 'Дом 1 • 25 минут назад',
      'image':
          'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80',
    },
    {
      'id': '3',
      'title': 'Няня для ребёнка',
      'category': 'Подработки',
      'price': 'Договорная',
      'location': 'Дом 1 • 1 час назад',
      'image':
          'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&auto=format&fit=crop&q=80',
    },
    {
      'id': '4',
      'title': 'Помогу с уборкой',
      'category': 'Помощь',
      'price': 'Договорная',
      'location': 'Подъезд 2 • 2 часа назад',
      'image':
          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final filtered = items.where((it) {
      final matchesTab = activeTab == 'Все' || it['category'] == activeTab;
      final matchesSearch = (it['title'] as String).toLowerCase().contains(
            searchQuery.toLowerCase(),
          );
      return matchesTab && matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: isDark ? AppColors.bgDark : Colors.white,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Container(
              decoration: BoxDecoration(
                color: isDark ? AppColors.backgroundDark : Colors.white,
                border: Border(
                  bottom: BorderSide(
                    color: isDark ? AppColors.borderDark : const Color(0xFFF1F5F9),
                  ),
                ),
              ),
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Объявления и услуги',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                      TextButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.add, size: 14, color: AppColors.primary),
                        label: const Text(
                          'Подать',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    onChanged: (v) => setState(() => searchQuery = v),
                    decoration: InputDecoration(
                      hintText: 'Поиск объявлений и услуг',
                      prefixIcon: const Icon(Icons.search, size: 18, color: Color(0xFF94A3B8)),
                      filled: true,
                      fillColor: isDark ? AppColors.secondaryDark : const Color(0xFFF1F5F9),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                    style: const TextStyle(fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  // 4 категории как в вебе
                  Row(
                    children: [
                      _Category(
                        icon: Icons.sell_outlined,
                        label: 'Объявления',
                        bg: AppColors.catAnnouncementBg,
                        fg: AppColors.catAnnouncementFg,
                      ),
                      _Category(
                        icon: Icons.build_outlined,
                        label: 'Услуги',
                        bg: AppColors.catServiceBg,
                        fg: AppColors.catServiceFg,
                      ),
                      _Category(
                        icon: Icons.auto_awesome_outlined,
                        label: 'Подработки',
                        bg: AppColors.catJobBg,
                        fg: AppColors.catJobFg,
                      ),
                      _Category(
                        icon: Icons.favorite_border,
                        label: 'Помощь',
                        bg: AppColors.catHelpBg,
                        fg: AppColors.catHelpFg,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: ['Все', 'Объявления', 'Услуги', 'Подработки', 'Помощь'].map((tab) {
                        final sel = activeTab == tab;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: GestureDetector(
                            onTap: () => setState(() => activeTab = tab),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                              decoration: BoxDecoration(
                                color: sel ? AppColors.primary : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                tab,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: sel ? Colors.white : const Color(0xFF475569),
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: filtered.isEmpty
                  ? const EmptyState(
                      icon: Icons.search_off,
                      title: 'Ничего не найдено',
                      subtitle: 'Попробуйте изменить запрос или категорию',
                    )
                  : ListView.separated(
                      padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom + 80),
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => Divider(
                        height: 1,
                        color: isDark ? AppColors.borderDark : const Color(0xFFF1F5F9),
                      ),
                      itemBuilder: (context, i) {
                        final it = filtered[i];
                        return InkWell(
                          onTap: () {},
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                ClipRRect(
                                  borderRadius: AppRadius.radiusLg,
                                  child: CachedNetworkImage(
                                    imageUrl: it['image'] as String,
                                    width: 64,
                                    height: 64,
                                    fit: BoxFit.cover,
                                    placeholder: (_, __) => Container(
                                      width: 64,
                                      height: 64,
                                      color: const Color(0xFFF1F5F9),
                                    ),
                                    errorWidget: (_, __, ___) => Container(
                                      width: 64,
                                      height: 64,
                                      color: const Color(0xFFF1F5F9),
                                      child: const Icon(Icons.image),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        it['title'] as String,
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        it['price'] as String,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF15803D),
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        it['location'] as String,
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: Color(0xFF94A3B8),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Icon(Icons.chevron_right, size: 18, color: Color(0xFFCBD5E1)),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Category extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color bg;
  final Color fg;
  const _Category({required this.icon, required this.label, required this.bg, required this.fg});
  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16)),
            child: Icon(icon, size: 20, color: fg),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: Color(0xFF475569),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
