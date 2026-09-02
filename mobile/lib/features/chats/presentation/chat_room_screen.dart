import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/house_repository.dart';
import '../../../core/supabase/supabase_config.dart';
import '../../../core/theme/app_colors.dart';

class ChatRoomScreen extends StatefulWidget {
  final String chatId;
  const ChatRoomScreen({super.key, required this.chatId});
  @override
  State<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends State<ChatRoomScreen> {
  final repository = HouseRepository();
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final List<Map<String, dynamic>> messages = [];
  RealtimeChannel? _syncChannel;

  @override
  void initState() {
    super.initState();
    _loadMessages();
    if (repository.isConfigured) {
      _syncChannel = Supabase.instance.client
          .channel('housesm-mobile-chat-${widget.chatId}')
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'messages',
            filter: PostgresChangeFilter(
              type: PostgresChangeFilterType.eq,
              column: 'chat_id',
              value: widget.chatId,
            ),
            callback: (_) => _loadMessages(),
          )
          .subscribe();
    }
  }

  Future<void> _loadMessages() async {
    if (!repository.isConfigured) return;
    try {
      final rows = await repository.loadMessages(widget.chatId);
      if (!mounted) return;
      final userId = repository.isConfigured ? SupabaseConfig.client.auth.currentUser?.id : null;
      setState(() {
        messages
          ..clear()
          ..addAll(rows.map((row) {
            final sender = row['sender'] is List
                ? ((row['sender'] as List).isEmpty ? null : (row['sender'] as List).first)
                : row['sender'];
            return {
              'text': row['is_deleted'] == true ? 'Сообщение удалено' : row['content'] ?? '',
              'isMe': row['sender_id'] == userId,
              'time': '${row['created_at']}'.substring(11, 16),
              'sender': sender is Map ? sender['full_name'] ?? 'Сосед' : 'Сосед',
              'isOfficial': sender is Map && sender['role'] == 'hoa_official',
            };
          }));
      });
    } catch (_) {
      // Keep the local preview if the chat is not available yet.
    }
  }

  Future<void> _send() async {
    if (_controller.text.trim().isEmpty) return;
    final text = _controller.text.trim();
    final now = TimeOfDay.now();
    final time = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
    setState(() {
      messages.add({
        'text': text,
        'isMe': true,
        'time': time,
        'sender': 'Вы',
        'isOfficial': false,
      });
      _controller.clear();
    });
    if (repository.isConfigured) {
      final user = repository.isConfigured ? SupabaseConfig.client.auth.currentUser : null;
      if (user != null) {
        try {
      await repository.sendMessage(widget.chatId, text);
        } catch (_) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Не удалось сохранить сообщение')),
            );
          }
        }
      }
    }
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent + 80,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    if (_syncChannel != null) Supabase.instance.client.removeChannel(_syncChannel!);
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final viewInsets = MediaQuery.of(context).viewInsets.bottom;

    return Scaffold(
      backgroundColor: isDark ? AppColors.bgDark : const Color(0xFFF8FAFC),
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.backgroundDark : Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, size: 22),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/chats');
            }
          },
        ),
        titleSpacing: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Чат дома ${widget.chatId}',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            const Text(
              '48 соседей онлайн',
              style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert, size: 20, color: Color(0xFF94A3B8)),
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Настройки чата пока недоступны')),
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            height: 1,
            color: isDark ? AppColors.borderDark : const Color(0xFFF1F5F9),
          ),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
              itemCount: messages.length,
              itemBuilder: (context, index) {
                final m = messages[index];
                final isMe = m['isMe'] as bool;
                final isOfficial = m['isOfficial'] as bool;
                return Align(
                  alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: isMe
                          ? AppColors.primary
                          : (isDark ? const Color(0xFF1E293B) : Colors.white),
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(18),
                        topRight: const Radius.circular(18),
                        bottomLeft: Radius.circular(isMe ? 18 : 4),
                        bottomRight: Radius.circular(isMe ? 4 : 18),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                      border: isMe
                          ? null
                          : Border.all(
                              color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                            ),
                    ),
                    child: Column(
                      crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                      children: [
                        if (!isMe)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  m['sender'] as String,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: isOfficial ? AppColors.primary : const Color(0xFF64748B),
                                  ),
                                ),
                                if (isOfficial) ...[
                                  const SizedBox(width: 4),
                                  const Icon(Icons.verified, size: 10, color: AppColors.primary),
                                ],
                              ],
                            ),
                          ),
                        Text(
                          m['text'] as String,
                          style: TextStyle(
                            color: isMe
                                ? Colors.white
                                : (isDark ? const Color(0xFFE2E8F0) : const Color(0xFF0F172A)),
                            fontSize: 14,
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              m['time'] as String,
                              style: TextStyle(
                                fontSize: 10,
                                color: isMe ? Colors.white70 : const Color(0xFF94A3B8),
                              ),
                            ),
                            if (isMe) ...[
                              const SizedBox(width: 4),
                              const Icon(Icons.done_all, size: 12, color: Colors.white70),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          // Input — с учётом клавиатуры и SafeArea
          Container(
            decoration: BoxDecoration(
              color: isDark ? AppColors.backgroundDark : Colors.white,
              border: Border(
                top: BorderSide(color: isDark ? AppColors.borderDark : const Color(0xFFF1F5F9)),
              ),
              boxShadow: const [
                BoxShadow(color: Color(0x08000000), blurRadius: 12, offset: Offset(0, -2)),
              ],
            ),
            padding: EdgeInsets.fromLTRB(
              12,
              10,
              12,
              10 + (viewInsets > 0 ? 0 : MediaQuery.of(context).padding.bottom),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                IconButton(
                  icon: const Icon(Icons.add_circle_outline, size: 22, color: Color(0xFF94A3B8)),
                  onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Вложения пока недоступны')),
                  ),
                  visualDensity: VisualDensity.compact,
                ),
                Expanded(
                  child: TextField(
                    controller: _controller,
                    minLines: 1,
                    maxLines: 4,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: InputDecoration(
                      hintText: 'Написать сообщение...',
                      hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                      filled: true,
                      fillColor: isDark ? AppColors.secondaryDark : const Color(0xFFF1F5F9),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      isDense: true,
                    ),
                    style: TextStyle(
                      fontSize: 14,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                    onSubmitted: (_) => _send(),
                  ),
                ),
                const SizedBox(width: 8),
                ValueListenableBuilder<TextEditingValue>(
                  valueListenable: _controller,
                  builder: (_, val, __) {
                    final hasText = val.text.trim().isNotEmpty;
                    return Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: hasText ? AppColors.primary : const Color(0xFFE2E8F0),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        icon: Icon(
                          Icons.send,
                          size: 18,
                          color: hasText ? Colors.white : const Color(0xFF94A3B8),
                        ),
                        onPressed: hasText ? _send : null,
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
