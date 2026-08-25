import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/loading_skeleton.dart';

class ChatsListScreen extends StatefulWidget {
  const ChatsListScreen({super.key});
  @override
  State<ChatsListScreen> createState() => _ChatsListScreenState();
}

class _ChatsListScreenState extends State<ChatsListScreen> {
  String activeTab = 'all';
  String searchQuery = '';
  bool isLoading = false;

  final chats = [
    {
      'id': '1',
      'name': 'Чат дома 1',
      'msg': 'Алексей: Лифт починили?',
      'time': '19:45',
      'unread': 3,
      'icon': '🏢',
      'color': const Color(0xFF2563EB),
    },
    {
      'id': '2',
      'name': 'Чат подъезда 1',
      'msg': 'Ирина: Спасибо за мастера!',
      'time': '18:30',
      'unread': 0,
      'icon': '🚪',
      'color': const Color(0xFF059669),
    },
    {
      'id': '3',
      'name': 'Благоустройство двора',
      'msg': 'Олег: Прикрепил смету',
      'time': '16:12',
      'unread': 5,
      'icon': '🌳',
      'color': const Color(0xFFD97706),
    },
    {
      'id': '4',
      'name': 'Родители ЖК',
      'msg': 'Анна: Кто на площадку?',
      'time': '15:45',
      'unread': 0,
      'icon': '🧸',
      'color': const Color(0xFFE11D48),
    },
    {
      'id': '5',
      'name': 'Сергей',
      'msg': 'Хорошо, договорились на 18:00',
      'time': '14:20',
      'unread': 1,
      'icon': '👤',
      'color': const Color(0xFF7C3AED),
    },
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => isLoading = true);
    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted) setState(() => isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final filtered = chats.where((c) {
      if (activeTab == 'unread' && (c['unread'] as int) == 0) return false;
      if (searchQuery.isNotEmpty &&
          !(c['name'] as String).toLowerCase().contains(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: isDark ? AppColors.bgDark : Colors.white,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Header — как в вебе
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Чаты',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.3,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.add, size: 14, color: AppColors.primary),
                            SizedBox(width: 4),
                            Text(
                              'Создать группу',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    onChanged: (v) => setState(() => searchQuery = v),
                    decoration: InputDecoration(
                      hintText: 'Поиск по чатам и сообщениям',
                      prefixIcon: const Icon(Icons.search, size: 18, color: Color(0xFF94A3B8)),
                      filled: true,
                      fillColor: isDark ? AppColors.secondaryDark : const Color(0xFFF1F5F9),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      isDense: true,
                    ),
                    style: const TextStyle(fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _TabChip(
                        label: 'Все',
                        selected: activeTab == 'all',
                        onTap: () => setState(() => activeTab = 'all'),
                      ),
                      const SizedBox(width: 8),
                      _TabChip(
                        label: 'Мои чаты',
                        selected: activeTab == 'my',
                        onTap: () => setState(() => activeTab = 'my'),
                      ),
                      const SizedBox(width: 8),
                      _TabChip(
                        label: 'Непрочитанные',
                        selected: activeTab == 'unread',
                        onTap: () => setState(() => activeTab = 'unread'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: isLoading
                  ? ListView.builder(
                      itemCount: 5,
                      itemBuilder: (_, __) => Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: Row(
                          children: [
                            const ShimmerBox(width: 48, height: 48, radius: 16),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  ShimmerBox(width: 140, height: 12, radius: 6),
                                  SizedBox(height: 8),
                                  ShimmerBox(width: 200, height: 10, radius: 6),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : filtered.isEmpty
                      ? const EmptyState(
                          icon: Icons.chat_bubble_outline,
                          title: 'Чатов не найдено',
                          subtitle: 'Попробуйте изменить поиск или фильтры',
                        )
                      : RefreshIndicator(
                          onRefresh: _load,
                          color: AppColors.primary,
                          child: ListView.separated(
                            padding: EdgeInsets.only(
                              bottom: MediaQuery.of(context).padding.bottom + 80,
                            ),
                            itemCount: filtered.length,
                            separatorBuilder: (_, __) => Divider(
                              height: 1,
                              indent: 78,
                              color: isDark ? AppColors.borderDark : const Color(0xFFF1F5F9),
                            ),
                            itemBuilder: (context, i) {
                              final c = filtered[i];
                              final unread = c['unread'] as int;
                              return InkWell(
                                onTap: () => context.push('/chats/${c['id']}'),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 48,
                                        height: 48,
                                        decoration: BoxDecoration(
                                          color: c['color'] as Color,
                                          borderRadius: BorderRadius.circular(16),
                                        ),
                                        child: Center(
                                          child: Text(
                                            c['icon'] as String,
                                            style: const TextStyle(fontSize: 20),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: Text(
                                                    c['name'] as String,
                                                    style: const TextStyle(
                                                      fontSize: 14,
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                  c['time'] as String,
                                                  style: const TextStyle(
                                                    fontSize: 11,
                                                    color: Color(0xFF94A3B8),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: Text(
                                                    c['msg'] as String,
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                    style: const TextStyle(
                                                      fontSize: 12,
                                                      color: Color(0xFF64748B),
                                                    ),
                                                  ),
                                                ),
                                                if (unread > 0) ...[
                                                  const SizedBox(width: 8),
                                                  Container(
                                                    constraints: const BoxConstraints(
                                                      minWidth: 20,
                                                      minHeight: 20,
                                                    ),
                                                    padding: const EdgeInsets.symmetric(
                                                      horizontal: 6,
                                                      vertical: 2,
                                                    ),
                                                    decoration: const BoxDecoration(
                                                      color: AppColors.primary,
                                                      shape: BoxShape.rectangle,
                                                      borderRadius: BorderRadius.all(
                                                        Radius.circular(999),
                                                      ),
                                                    ),
                                                    child: Center(
                                                      child: Text(
                                                        '$unread',
                                                        style: const TextStyle(
                                                          color: Colors.white,
                                                          fontSize: 11,
                                                          fontWeight: FontWeight.w700,
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TabChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _TabChip({required this.label, required this.selected, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: selected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }
}
