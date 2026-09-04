import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/data/house_repository.dart';
import '../../../core/theme/app_colors.dart';

class CreatePostScreen extends StatefulWidget {
  final String initialType;

  const CreatePostScreen({super.key, this.initialType = 'post'});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final repository = HouseRepository();
  final titleController = TextEditingController();
  final contentController = TextEditingController();
  final firstOptionController = TextEditingController();
  final secondOptionController = TextEditingController();
  String type = 'post';
  String territory = 'complex';
  bool loading = false;
  String? error;

  static const types = <(String, String, IconData)>[
    ('post', 'Публикация', Icons.article_outlined),
    ('announcement', 'Объявление', Icons.campaign_outlined),
    ('poll', 'Опрос', Icons.poll_outlined),
    ('initiative', 'Инициатива', Icons.lightbulb_outline),
  ];

  @override
  void initState() {
    super.initState();
    type = types.any((item) => item.$1 == widget.initialType) ? widget.initialType : 'post';
  }

  @override
  void dispose() {
    titleController.dispose();
    contentController.dispose();
    firstOptionController.dispose();
    secondOptionController.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (contentController.text.trim().length < 4) {
      setState(() => error = 'Добавьте понятное описание');
      return;
    }
    if (type == 'poll' &&
        (firstOptionController.text.trim().isEmpty || secondOptionController.text.trim().isEmpty)) {
      setState(() => error = 'Добавьте минимум два варианта ответа');
      return;
    }
    setState(() {
      loading = true;
      error = null;
    });
    try {
      await repository.createPost(
        type: type,
        title: titleController.text,
        content: contentController.text,
        territory: territory,
        pollOptions: [firstOptionController.text, secondOptionController.text],
        initiativeGoal: contentController.text,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Опубликовано в сообществе')),
      );
      context.go('/feed');
    } catch (cause) {
      if (mounted) setState(() => error = cause.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? AppColors.bgDark : const Color(0xFFF8F7F2),
      appBar: AppBar(
        leading: IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.close)),
        title: const Text('Создать'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: FilledButton(
              onPressed: loading ? null : submit,
              style: FilledButton.styleFrom(backgroundColor: const Color(0xFF166534)),
              child: Text(loading ? 'Публикуем…' : 'Готово'),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
          children: [
            const Text('Формат', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
            const SizedBox(height: 10),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final item in types)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        selected: type == item.$1,
                        onSelected: (_) => setState(() => type = item.$1),
                        avatar: Icon(item.$3, size: 18, color: type == item.$1 ? Colors.white : const Color(0xFF166534)),
                        label: Text(item.$2),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            TextField(
              controller: titleController,
              maxLength: 120,
              decoration: const InputDecoration(labelText: 'Заголовок', hintText: 'Коротко о главном'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: contentController,
              minLines: 5,
              maxLines: 10,
              maxLength: 2000,
              decoration: InputDecoration(
                labelText: type == 'initiative' ? 'Что вы предлагаете?' : 'Описание',
                hintText: 'Добавьте детали, которые помогут соседям понять вас',
                alignLabelWithHint: true,
              ),
            ),
            if (type == 'poll') ...[
              const SizedBox(height: 12),
              TextField(controller: firstOptionController, decoration: const InputDecoration(labelText: 'Вариант 1')),
              const SizedBox(height: 10),
              TextField(controller: secondOptionController, decoration: const InputDecoration(labelText: 'Вариант 2')),
            ],
            const SizedBox(height: 18),
            const Text('Кому показать', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'complex', label: Text('Весь ЖК')),
                ButtonSegment(value: 'building', label: Text('Мой дом')),
                ButtonSegment(value: 'entrance', label: Text('Подъезд')),
              ],
              selected: {territory},
              onSelectionChanged: (value) => setState(() => territory = value.first),
            ),
            if (error != null) ...[
              const SizedBox(height: 16),
              Semantics(
                liveRegion: true,
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: const Color(0xFFFFE4E6), borderRadius: BorderRadius.circular(16)),
                  child: Text(error!, style: const TextStyle(color: Color(0xFF9F1239), fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
