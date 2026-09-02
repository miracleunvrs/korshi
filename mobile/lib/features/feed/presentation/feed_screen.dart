import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/house_repository.dart';
import '../../../core/widgets/app_chip.dart';
import '../../../core/widgets/post_card.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/loading_skeleton.dart';
import '../models/post.dart';
import '../../../core/theme/app_colors.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});
  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  String activeChip = 'Весь ЖК';
  String selectedTerritory = 'all';
  String selectedType = 'all';
  bool isLoading = false;
  bool hasError = false;
  bool isOffline = false;
  List<Post> posts = <Post>[];
  final HouseRepository repository = HouseRepository();
  final Set<String> votedPollIds = <String>{};
  final Set<String> supportedInitiativeIds = <String>{};
  RealtimeChannel? _syncChannel;

  final chips = const ['Весь ЖК', 'Мой дом', 'Мой подъезд', 'Официальное', 'Объявления', 'Опросы'];

  @override
  void initState() {
    super.initState();
    if (repository.isConfigured) {
      _loadRemotePosts();
      _syncChannel = Supabase.instance.client
          .channel('housesm-mobile-feed-sync')
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'posts',
            callback: (_) => _loadRemotePosts(),
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'poll_votes',
            callback: (_) => _loadRemotePosts(),
          )
          .subscribe();
    }
  }

  @override
  void dispose() {
    if (_syncChannel != null) Supabase.instance.client.removeChannel(_syncChannel!);
    super.dispose();
  }

  Future<void> _loadRemotePosts() async {
    setState(() {
      isLoading = true;
      hasError = false;
      isOffline = false;
    });
    try {
      final remotePosts = await repository.loadPosts();
      if (!mounted) return;
      setState(() {
        posts = remotePosts;
        isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        isLoading = false;
        posts = <Post>[];
        hasError = true;
        isOffline = true;
      });
    }
  }

  List<Post> get filteredPosts {
    return posts.where((post) {
      if (activeChip == 'Мой дом' &&
          post.territory != Territory.building &&
          post.territory != Territory.complex) {
        return false;
      }
      if (activeChip == 'Мой подъезд' && post.territory != Territory.entrance) return false;
      if (activeChip == 'Официальное' && !post.isOfficial) return false;
      if (activeChip == 'Объявления' &&
          post.type != PostType.announcement &&
          post.type != PostType.service) {
        return false;
      }
      if (activeChip == 'Опросы' &&
          post.type != PostType.poll &&
          post.type != PostType.officialPoll) {
        return false;
      }
      if (selectedTerritory == 'building' && post.territory != Territory.building) return false;
      if (selectedTerritory == 'entrance' && post.territory != Territory.entrance) return false;
      if (selectedType == 'post' && post.type != PostType.post) return false;
      if (selectedType == 'announcement' && post.type != PostType.announcement) return false;
      if (selectedType == 'service' && post.type != PostType.service) return false;
      if (selectedType == 'poll_initiative' &&
          post.type != PostType.poll &&
          post.type != PostType.officialPoll &&
          post.type != PostType.initiative) {
        return false;
      }
      if (selectedType == 'official' && !post.isOfficial) return false;
      return true;
    }).toList();
  }

  void _openFilter() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _FilterSheet(
        selectedTerritory: selectedTerritory,
        selectedType: selectedType,
        onSelectTerritory: (v) => setState(() => selectedTerritory = v),
        onSelectType: (v) => setState(() => selectedType = v),
        onReset: () => setState(() {
          selectedTerritory = 'all';
          selectedType = 'all';
          activeChip = 'Весь ЖК';
        }),
        onApply: () => Navigator.pop(ctx),
      ),
    );
  }

  Future<void> _onRefresh() async {
    if (repository.isConfigured) {
      await _loadRemotePosts();
      return;
    }
    await Future.delayed(const Duration(milliseconds: 800));
    if (hasError) setState(() => hasError = false);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final filtered = filteredPosts;
    final hasFilterActive = selectedTerritory != 'all' || selectedType != 'all';

    return Scaffold(
      backgroundColor: isDark ? AppColors.bgDark : const Color(0xFFF8FAFC),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            if (isOffline) const OfflineBanner(),
            // Header — как в вебе sticky top bg-white/95 backdrop-blur
            Container(
              decoration: BoxDecoration(
                color: isDark ? AppColors.backgroundDark : Colors.white,
                border: Border(
                  bottom: BorderSide(
                    color: isDark ? AppColors.borderDark : const Color(0xFFF1F5F9),
                  ),
                ),
                boxShadow: const [
                  BoxShadow(color: Color(0x05000000), blurRadius: 8, offset: Offset(0, 2)),
                ],
              ),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x3316A34A),
                                blurRadius: 8,
                                offset: Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Center(
                            child: Text(
                              'ЖК',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    'ЖК «Солнечный»',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      height: 1,
                                    ),
                                  ),
                                  SizedBox(width: 6),
                                  Icon(Icons.verified, size: 14, color: AppColors.primary),
                                ],
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Алматы, 2 дома • 120 квартир',
                                style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                              ),
                            ],
                          ),
                        ),
                        Stack(
                          children: [
                            IconButton(
                              onPressed: _openFilter,
                              icon: const Icon(Icons.tune, size: 20),
                              style: IconButton.styleFrom(
                                backgroundColor:
                                    isDark ? AppColors.secondaryDark : const Color(0xFFF1F5F9),
                                foregroundColor: const Color(0xFF64748B),
                              ),
                            ),
                            if (hasFilterActive)
                              Positioned(
                                right: 6,
                                top: 6,
                                child: Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: AppColors.primary,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 1.5),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(width: 6),
                        IconButton(
                          onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Уведомления пока пусты')),
                          ),
                          icon: const Icon(Icons.notifications_none, size: 20),
                          style: IconButton.styleFrom(
                            backgroundColor:
                                isDark ? AppColors.secondaryDark : const Color(0xFFF1F5F9),
                            foregroundColor: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  AppChipGroup(
                    items: chips,
                    selected: activeChip,
                    onSelected: (v) => setState(() => activeChip = v),
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  ),
                ],
              ),
            ),
            // List
            Expanded(
              child: hasError
                  ? ErrorView(
                      message: 'Не удалось загрузить ленту',
                      onRetry: () => setState(() => hasError = false),
                    )
                  : isLoading
                      ? ListView.builder(itemCount: 4, itemBuilder: (_, __) => const PostSkeleton())
                      : filtered.isEmpty
                          ? SingleChildScrollView(
                              child: EmptyState(
                                icon: Icons.feed_outlined,
                                title: 'Нет публикаций по выбранным фильтрам',
                                subtitle: 'Попробуйте изменить территорию или тип публикаций',
                                actionLabel: 'Сбросить фильтры',
                                onAction: () => setState(() {
                                  selectedTerritory = 'all';
                                  selectedType = 'all';
                                  activeChip = 'Весь ЖК';
                                }),
                              ),
                            )
                          : RefreshIndicator(
                              onRefresh: _onRefresh,
                              color: AppColors.primary,
                              child: ListView.builder(
                                padding: EdgeInsets.only(
                                  bottom: MediaQuery.of(context).padding.bottom + 80,
                                ),
                                itemCount: filtered.length,
                                itemBuilder: (context, i) {
                                  final post = filtered[i];
                                  return PostCard(
                                    post: post,
                                    onLike: (liked) {
                                      setState(() {
                                        post.reactionsCount = liked
                                            ? post.reactionsCount + 1
                                            : (post.reactionsCount > 0 ? post.reactionsCount - 1 : 0);
                                      });
                                    },
                                    // Дополнительная защита от повторных нажатий после перестроения.
                                    onVote: (pollId, optionId) async {
                                      if (votedPollIds.contains(pollId)) return;
                                      votedPollIds.add(pollId);
                                      final messenger = ScaffoldMessenger.of(context);
                                      try {
                                        if (repository.isConfigured) {
                                          final user = await repository.currentUser();
                                          if (user == null) throw Exception('Требуется авторизация');
                                          await repository.vote(pollId, optionId);
                                        }
                                        if (!mounted) return;
                                        setState(() {
                                          final opt = post.poll!.options.firstWhere((o) => o.id == optionId);
                                          opt.votesCount++;
                                          post.poll!.totalVotes++;
                                        });
                                        messenger.showSnackBar(
                                          const SnackBar(content: Text('Голос учтён'), duration: Duration(seconds: 1)),
                                        );
                                      } catch (_) {
                                        votedPollIds.remove(pollId);
                                        if (mounted) {
                                          messenger.showSnackBar(
                                            const SnackBar(content: Text('Не удалось сохранить голос')),
                                          );
                                        }
                                      }
                                    },
                                    onSupportInitiative: (id) {
                                      if (supportedInitiativeIds.contains(id)) return;
                                      supportedInitiativeIds.add(id);
                                      setState(() => post.initiative!.supporters++);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Спасибо за поддержку!')),
                                      );
                                    },
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

class _FilterSheet extends StatelessWidget {
  final String selectedTerritory;
  final String selectedType;
  final ValueChanged<String> onSelectTerritory;
  final ValueChanged<String> onSelectType;
  final VoidCallback onReset;
  final VoidCallback onApply;
  const _FilterSheet({
    required this.selectedTerritory,
    required this.selectedType,
    required this.onSelectTerritory,
    required this.onSelectType,
    required this.onReset,
    required this.onApply,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF18181B),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFF3F3F46),
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close, size: 20, color: Color(0xFFA1A1AA)),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Фильтры',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: () {
                      onReset();
                      Navigator.pop(context);
                    },
                    child: const Text(
                      'Сбросить',
                      style: TextStyle(
                        color: Color(0xFFA1A1AA),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(color: Color(0xFF27272A), height: 20),
              const Text(
                'Территория',
                style: TextStyle(
                  color: Color(0xFFA1A1AA),
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.6,
                ),
              ),
              const SizedBox(height: 12),
              ...[
                {'id': 'all', 'label': 'Весь ЖК'},
                {'id': 'building', 'label': 'Мой дом'},
                {'id': 'entrance', 'label': 'Мой подъезд'},
              ].map((t) {
                final sel = selectedTerritory == t['id'];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: InkWell(
                    onTap: () => onSelectTerritory(t['id']!),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                      decoration: BoxDecoration(
                        color: sel ? const Color(0xFF27272A) : Colors.transparent,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            t['label']!,
                            style: TextStyle(
                              color: sel ? Colors.white : const Color(0xFFA1A1AA),
                              fontSize: 14,
                              fontWeight: sel ? FontWeight.w600 : FontWeight.w400,
                            ),
                          ),
                          if (sel)
                            Container(
                              width: 20,
                              height: 20,
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.check, size: 12, color: Colors.white),
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
              const SizedBox(height: 16),
              const Text(
                'Тип публикации',
                style: TextStyle(
                  color: Color(0xFFA1A1AA),
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.6,
                ),
              ),
              const SizedBox(height: 12),
              ...[
                {'id': 'all', 'label': 'Все'},
                {'id': 'post', 'label': 'Публикации'},
                {'id': 'announcement', 'label': 'Объявления'},
                {'id': 'service', 'label': 'Услуги'},
                {'id': 'poll_initiative', 'label': 'Опросы и инициативы'},
                {'id': 'official', 'label': 'Официальное'},
              ].map((t) {
                final sel = selectedType == t['id'];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: InkWell(
                    onTap: () => onSelectType(t['id']!),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                      decoration: BoxDecoration(
                        color: sel ? const Color(0xFF27272A) : Colors.transparent,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            t['label']!,
                            style: TextStyle(
                              color: sel ? Colors.white : const Color(0xFFA1A1AA),
                              fontSize: 14,
                              fontWeight: sel ? FontWeight.w600 : FontWeight.w400,
                            ),
                          ),
                          if (sel)
                            Container(
                              width: 20,
                              height: 20,
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.check, size: 12, color: Colors.white),
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: onApply,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text(
                    'Показать результаты',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
