import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';

import '../../features/feed/models/post.dart';
import '../theme/app_colors.dart';
import '../theme/app_radius.dart';
import 'app_avatar.dart';
import 'territory_badge.dart';

class PostCard extends StatefulWidget {
  final Post post;
  final ValueChanged<bool>? onLike;
  final void Function(String pollId, String optionId)? onVote;
  final ValueChanged<String>? onSupportInitiative;
  final VoidCallback? onTap;

  const PostCard({
    super.key,
    required this.post,
    this.onLike,
    this.onVote,
    this.onSupportInitiative,
    this.onTap,
  });

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> {
  bool isLiked = false;
  bool isSupported = false;
  String? selectedOption;
  bool hasVoted = false;

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'только что';
    if (diff.inMinutes < 60) return '${diff.inMinutes} мин назад';
    if (diff.inHours < 24) return '${diff.inHours} ч назад';
    if (diff.inDays < 7) return '${diff.inDays} дн назад';
    return DateFormat('d MMM', 'ru').format(dt);
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Material(
      color: isDark ? AppColors.bgCardDark : Colors.white,
      child: InkWell(
        onTap: widget.onTap,
        child: Container(
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(color: isDark ? AppColors.borderDark : const Color(0xFFF1F5F9)),
            ),
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AppAvatar(
                    imageUrl: post.author.avatarUrl,
                    fallback: post.author.initials,
                    size: 40,
                    verified: post.author.verified,
                    isOfficial: post.author.isOfficial,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                post.isOfficial ? 'ОСИ «Солнечный»' : post.author.fullName,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (post.isOfficial) ...[
                              const SizedBox(width: 6),
                              const Icon(Icons.verified, size: 14, color: AppColors.primary),
                            ] else if (post.author.verified) ...[
                              const SizedBox(width: 6),
                              const Icon(Icons.verified, size: 12, color: AppColors.primary),
                            ],
                          ],
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Text(
                              post.territory == Territory.complex
                                  ? 'Весь ЖК'
                                  : post.territory == Territory.building
                                      ? 'Мой дом'
                                      : 'Мой подъезд',
                              style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                            ),
                            const Text(
                              ' • ',
                              style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                            ),
                            Text(
                              _timeAgo(post.createdAt),
                              style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  PostTypeBadge(type: post.type.apiValue),
                  const SizedBox(width: 4),
                  IconButton(
                    icon: const Icon(Icons.more_horiz, size: 18, color: Color(0xFF94A3B8)),
                    onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Дополнительные действия пока недоступны')),
                    ),
                    visualDensity: VisualDensity.compact,
                    constraints: const BoxConstraints(),
                    padding: const EdgeInsets.all(6),
                  ),
                ],
              ),
              if (post.title != null) ...[
                const SizedBox(height: 12),
                Text(
                  post.title!,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    height: 1.3,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
              ],
              const SizedBox(height: 8),
              Text(
                post.content,
                style: TextStyle(
                  fontSize: 14,
                  height: 1.5,
                  color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF1E293B),
                ),
              ),
              if (post.attachments.isNotEmpty) ...[
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: AppRadius.radiusLg,
                  child: CachedNetworkImage(
                    imageUrl: post.attachments.first.url,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(height: 180, color: const Color(0xFFF1F5F9)),
                    errorWidget: (_, __, ___) => Container(
                      height: 180,
                      color: const Color(0xFFF1F5F9),
                      child: const Icon(Icons.broken_image),
                    ),
                  ),
                ),
              ],
              if (post.poll != null)
                _PollWidget(
                  poll: post.poll!,
                  selectedOption: selectedOption,
                  hasVoted: hasVoted,
                  onSelect: (id) {
                    if (!hasVoted) setState(() => selectedOption = id);
                  },
                  onVote: () {
                    if (!hasVoted && selectedOption != null && widget.onVote != null) {
                      setState(() => hasVoted = true);
                      widget.onVote!(post.poll!.id, selectedOption!);
                    }
                  },
                ),
              if (post.initiative != null)
                _InitiativeWidget(
                  initiative: post.initiative!,
                  isSupported: isSupported,
                  onSupport: () {
                    if (!isSupported) {
                      setState(() => isSupported = true);
                      widget.onSupportInitiative?.call(post.initiative!.id);
                    }
                  },
                ),
              if (post.fundraiser != null) _FundraiserWidget(fundraiser: post.fundraiser!),
              const SizedBox(height: 12),
              // Action bar
              Container(
                padding: const EdgeInsets.only(top: 10),
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(color: isDark ? AppColors.borderDark : const Color(0xFFF8FAFC)),
                  ),
                ),
                child: Row(
                  children: [
                    _ActionButton(
                      icon: isLiked ? Icons.favorite : Icons.favorite_border,
                      color: isLiked ? const Color(0xFFEF4444) : const Color(0xFF94A3B8),
                      label: '${post.reactionsCount}',
                      active: isLiked,
                      onTap: () {
                        final nextLiked = !isLiked;
                        setState(() => isLiked = nextLiked);
                        widget.onLike?.call(nextLiked);
                      },
                    ),
                    const SizedBox(width: 16),
                    _ActionButton(
                      icon: Icons.chat_bubble_outline,
                      label: '${post.commentsCount}',
                      onTap: widget.onTap,
                    ),
                    const Spacer(),
                    _ActionButton(
                      icon: Icons.share_outlined,
                      onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Ссылка на публикацию скопирована')),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String? label;
  final Color? color;
  final bool active;
  final VoidCallback? onTap;
  const _ActionButton({
    required this.icon,
    this.label,
    this.color,
    this.active = false,
    this.onTap,
  });
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        child: Row(
          children: [
            Icon(icon, size: 18, color: color ?? const Color(0xFF94A3B8)),
            if (label != null) ...[
              const SizedBox(width: 6),
              Text(
                label!,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                  color: color ?? const Color(0xFF64748B),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PollWidget extends StatelessWidget {
  final Poll poll;
  final String? selectedOption;
  final bool hasVoted;
  final ValueChanged<String> onSelect;
  final VoidCallback onVote;
  const _PollWidget({
    required this.poll,
    required this.selectedOption,
    required this.hasVoted,
    required this.onSelect,
    required this.onVote,
  });
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
        borderRadius: AppRadius.radiusLg,
        border: Border.all(color: isDark ? AppColors.borderDark : const Color(0xFFF1F5F9)),
      ),
      child: Column(
        children: [
          ...poll.options.map((opt) {
            final pct =
                poll.totalVotes == 0 ? 0 : ((opt.votesCount / poll.totalVotes) * 100).round();
            final isSelected = selectedOption == opt.id;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: GestureDetector(
                onTap: hasVoted ? null : () => onSelect(opt.id),
                child: Container(
                  width: double.infinity,
                  clipBehavior: Clip.antiAlias,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.backgroundDark : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? AppColors.primary : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Stack(
                    children: [
                      Positioned.fill(
                        child: FractionallySizedBox(
                          alignment: Alignment.centerLeft,
                          widthFactor: pct / 100,
                          child: Container(color: AppColors.primary.withOpacity(0.12)),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                opt.text,
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                              ),
                            ),
                            Text(
                              '$pct%',
                              style: const TextStyle(
                                fontSize: 11,
                                color: Color(0xFF64748B),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
          const SizedBox(height: 4),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: hasVoted || selectedOption == null ? null : onVote,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                disabledBackgroundColor: AppColors.primary.withOpacity(0.4),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: Text(
                hasVoted ? 'Голос учтён' : 'Проголосовать',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InitiativeWidget extends StatelessWidget {
  final Initiative initiative;
  final bool isSupported;
  final VoidCallback onSupport;
  const _InitiativeWidget({required this.initiative, required this.isSupported, required this.onSupport});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF064E3B).withOpacity(0.3) : const Color(0xFFECFDF5),
        borderRadius: AppRadius.radiusLg,
        border: Border.all(color: const Color(0xFFA7F3D0).withOpacity(0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.lightbulb, size: 14, color: Color(0xFF065F46)),
                  SizedBox(width: 6),
                  Text(
                    'Этап инициативы',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF065F46),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFD1FAE5),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  initiative.stage.label,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF065F46),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            initiative.goal,
            style: const TextStyle(fontSize: 12, color: Color(0xFF475569), height: 1.4),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text.rich(
                TextSpan(
                  children: [
                    const TextSpan(
                      text: 'Поддержали: ',
                      style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                    ),
                    TextSpan(
                      text: '${initiative.supporters} соседей',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ),
              FilledButton(
                onPressed: isSupported ? null : onSupport,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                  child: Text(
                    isSupported ? 'Поддержано' : 'Поддержать',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FundraiserWidget extends StatelessWidget {
  final Fundraiser fundraiser;
  const _FundraiserWidget({required this.fundraiser});
  @override
  Widget build(BuildContext context) {
    final pct = (fundraiser.progress * 100).round();
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: AppRadius.radiusLg,
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Активный сбор',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF92400E),
                ),
              ),
              Text(
                '$pct% собрано',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFFB45309),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: fundraiser.progress,
              minHeight: 8,
              backgroundColor: const Color(0xFFE5E7EB),
              valueColor: const AlwaysStoppedAnimation(AppColors.primary),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                '${NumberFormat('#,###', 'ru').format(fundraiser.currentAmount)} ${fundraiser.currency}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              Text(
                'из ${NumberFormat('#,###', 'ru').format(fundraiser.targetAmount)} ${fundraiser.currency}',
                style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Оплата будет доступна после подключения платёжного сервиса')),
              ),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              icon: const Icon(Icons.arrow_forward, size: 14, color: Colors.white),
              label: const Text(
                'Внести свой вклад',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
