import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/data/house_repository.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/widgets/empty_state.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _repository = HouseRepository();
  String fullName = '';
  String phone = '';
  String building = '—';
  String apartment = '—';
  bool verified = false;
  String avatarUrl = '';
  String? activeModal;
  bool hasError = false;

  @override
  void initState() {
    super.initState();
    _loadRemoteProfile();
  }

  Future<void> _loadRemoteProfile() async {
    if (!_repository.isConfigured) return;
    try {
      final profile = await _repository.loadProfile();
      if (!mounted || profile == null) return;
      Map<String, dynamic>? asMap(dynamic value) =>
          value is Map ? Map<String, dynamic>.from(value) : null;
      final apartmentData = asMap(profile['apartment']);
      final entrance = asMap(apartmentData?['entrance']);
      final buildingData = asMap(entrance?['building']);
      setState(() {
        hasError = false;
        fullName = profile['full_name'] ?? fullName;
        phone = profile['phone'] ?? phone;
        avatarUrl = profile['avatar_url'] ?? avatarUrl;
        verified = profile['verified'] == true;
        apartment = apartmentData?['number']?.toString() ?? apartment;
        building = buildingData?['number']?.toString() ?? building;
      });
    } catch (_) {
      if (mounted) setState(() => hasError = true);
    }
  }

  Future<void> _signOut() async {
    await _repository.signOut();
    if (mounted) context.go('/login');
  }

  void _openEdit() {
    final nameCtrl = TextEditingController(text: fullName);
    final phoneCtrl = TextEditingController(text: phone);
    final buildingCtrl = TextEditingController(text: building);
    final apartmentCtrl = TextEditingController(text: apartment);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding:
              EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Редактирование профиля',
                          style: TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w700)),
                      IconButton(
                          icon: const Icon(Icons.close, size: 20),
                          onPressed: () => Navigator.pop(ctx)),
                    ],
                  ),
                  const Divider(height: 20),
                  _Field(label: 'Имя и Фамилия', controller: nameCtrl),
                  const SizedBox(height: 12),
                  _Field(
                      label: 'Телефон',
                      controller: phoneCtrl,
                      keyboardType: TextInputType.phone),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                          child:
                              _Field(label: 'Дом №', controller: buildingCtrl)),
                      const SizedBox(width: 12),
                      Expanded(
                          child: _Field(
                              label: 'Квартира №', controller: apartmentCtrl)),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () async {
                        setState(() {
                          fullName = nameCtrl.text;
                          phone = phoneCtrl.text;
                          building = buildingCtrl.text;
                          apartment = apartmentCtrl.text;
                        });
                        try {
                          await _repository.updateProfile(
                              fullName: fullName, phone: phone);
                        } catch (_) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content:
                                      Text('Не удалось сохранить профиль')),
                            );
                          }
                        }
                        if (ctx.mounted) Navigator.pop(ctx);
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Сохранить изменения',
                          style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _openModal(String id) {
    setState(() => activeModal = id);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(_modalTitle(id),
                          style: const TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w700)),
                      IconButton(
                          icon: const Icon(Icons.close, size: 20),
                          onPressed: () => Navigator.pop(ctx)),
                    ],
                  ),
                  const Divider(height: 20),
                  _ModalBody(id: id),
                  const SizedBox(height: 16),
                  SizedBox(
                      width: double.infinity,
                      child: FilledButton.tonal(
                          onPressed: () => Navigator.pop(ctx),
                          child: const Text('Закрыть'))),
                ],
              ),
            ),
          ),
        );
      },
    ).whenComplete(() => setState(() => activeModal = null));
  }

  String _modalTitle(String id) {
    switch (id) {
      case 'announcements':
        return 'Мои объявления';
      case 'services':
        return 'Мои услуги мастера';
      case 'initiatives':
        return 'Мои инициативы';
      case 'payments':
        return 'История взносов';
      case 'notifications':
        return 'Настройки уведомлений';
      default:
        return id;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? AppColors.bgDark : const Color(0xFFF8FAFC),
      body: SafeArea(
        bottom: false,
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              pinned: true,
              backgroundColor: isDark ? AppColors.backgroundDark : Colors.white,
              surfaceTintColor: Colors.transparent,
              elevation: 0,
              title: Text('Профиль',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : const Color(0xFF0F172A))),
              actions: [
                Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: TextButton.icon(
                    onPressed: _openEdit,
                    icon: const Icon(Icons.edit_outlined,
                        size: 14, color: AppColors.primary),
                    label: const Text('Редактировать',
                        style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600)),
                    style: TextButton.styleFrom(
                        backgroundColor: const Color(0xFFEFF6FF),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(999)),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6)),
                  ),
                ),
              ],
              bottom: PreferredSize(
                  preferredSize: const Size.fromHeight(1),
                  child: Container(
                      height: 1,
                      color: isDark
                          ? AppColors.borderDark
                          : const Color(0xFFF1F5F9))),
            ),
            SliverToBoxAdapter(
              child: hasError
                  ? ErrorView(
                      message: 'Не удалось загрузить профиль',
                      onRetry: _loadRemoteProfile)
                  : const SizedBox.shrink(),
            ),
            SliverToBoxAdapter(
              child: Column(
                children: [
                  Container(
                    width: double.infinity,
                    color: isDark ? AppColors.bgCardDark : Colors.white,
                    padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
                    child: Column(
                      children: [
                        Stack(
                          children: [
                            Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(24),
                                  border: Border.all(
                                      color: const Color(0xFFDCFCE7), width: 3),
                                  boxShadow: const [
                                    BoxShadow(
                                        color: Color(0x14000000),
                                        blurRadius: 12,
                                        offset: Offset(0, 4))
                                  ]),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(21),
                                child: CachedNetworkImage(
                                    imageUrl: avatarUrl,
                                    fit: BoxFit.cover,
                                    placeholder: (_, __) => Container(
                                        color: const Color(0xFFDCFCE7)),
                                    errorWidget: (_, __, ___) => Container(
                                        color: const Color(0xFFDCFCE7),
                                        child: const Icon(Icons.person))),
                              ),
                            ),
                            if (verified)
                              Positioned(
                                  right: 0,
                                  bottom: 0,
                                  child: Container(
                                      width: 24,
                                      height: 24,
                                      decoration: BoxDecoration(
                                          color: AppColors.primary,
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                              color: Colors.white, width: 2)),
                                      child: const Icon(Icons.verified,
                                          size: 14, color: Colors.white))),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Text(fullName,
                            style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: isDark
                                    ? Colors.white
                                    : const Color(0xFF0F172A))),
                        const SizedBox(height: 4),
                        Text(phone,
                            style: const TextStyle(
                                fontSize: 12, color: Color(0xFF94A3B8))),
                        const SizedBox(height: 12),
                        Wrap(
                          alignment: WrapAlignment.center,
                          spacing: 8,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(999)),
                              child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.place_outlined,
                                        size: 12, color: AppColors.primary),
                                    const SizedBox(width: 4),
                                    Text('Дом $building, кв. $apartment',
                                        style: const TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                            color: Color(0xFF475569)))
                                  ]),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                  color: verified
                                      ? const Color(0xFFDCFCE7)
                                      : const Color(0xFFFEF3C7),
                                  borderRadius: BorderRadius.circular(999)),
                              child: Text(
                                  verified ? '✓ Подтверждён' : 'Ожидает',
                                  style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: verified
                                          ? const Color(0xFF166534)
                                          : const Color(0xFF92400E))),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  if (!verified)
                    Container(
                      margin: const EdgeInsets.all(16),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                          color: const Color(0xFFFFFBEB),
                          borderRadius: AppRadius.card,
                          border: Border.all(color: const Color(0xFFFDE68A))),
                      child: Row(
                        children: [
                          const Expanded(
                              child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                Text('Статус жителя не подтверждён',
                                    style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF92400E))),
                                Text('Загрузите документ для полного доступа',
                                    style: TextStyle(
                                        fontSize: 11, color: Color(0xFFB45309)))
                              ])),
                          FilledButton(
                              onPressed: () =>
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                        content: Text(
                                            'Откройте веб-версию для загрузки документа')),
                                  ),
                              style: FilledButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10)),
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 14, vertical: 8)),
                              child: const Text('Подтвердить',
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700))),
                        ],
                      ),
                    ),
                  const SizedBox(height: 12),
                  Container(
                    decoration: BoxDecoration(
                        color: isDark ? AppColors.bgCardDark : Colors.white,
                        border: Border.symmetric(
                            horizontal: BorderSide(
                                color: isDark
                                    ? AppColors.borderDark
                                    : const Color(0xFFF1F5F9)))),
                    child: Column(
                      children: [
                        _MenuRow(
                            icon: Icons.verified_user_outlined,
                            label: 'Подтверждение жителя',
                            onTap: () => _openModal('verify')),
                        _MenuRow(
                            icon: Icons.sell_outlined,
                            label: 'Мои объявления',
                            onTap: () => _openModal('announcements')),
                        _MenuRow(
                            icon: Icons.build_outlined,
                            label: 'Мои услуги и профиль мастера',
                            onTap: () => _openModal('services')),
                        _MenuRow(
                            icon: Icons.lightbulb_outline,
                            label: 'Мои инициативы',
                            onTap: () => _openModal('initiatives')),
                        _MenuRow(
                            icon: Icons.credit_card_outlined,
                            label: 'История платежей и сборов',
                            onTap: () => _openModal('payments')),
                        _MenuRow(
                            icon: Icons.notifications_outlined,
                            label: 'Настройки уведомлений',
                            onTap: () => _openModal('notifications'),
                            showDivider: false),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  if (_repository.isConfigured)
                    TextButton.icon(
                      onPressed: _signOut,
                      icon: const Icon(Icons.logout, color: Colors.redAccent),
                      label: const Text('Выйти из аккаунта',
                          style: TextStyle(color: Colors.redAccent)),
                    ),
                  Padding(
                      padding: EdgeInsets.only(
                          bottom: MediaQuery.of(context).padding.bottom + 80),
                      child: Text('Korshi • версия 1.0.0',
                          style: TextStyle(
                              fontSize: 11,
                              color: isDark
                                  ? const Color(0xFF475569)
                                  : const Color(0xFF94A3B8)))),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ModalBody extends StatelessWidget {
  final String id;
  const _ModalBody({required this.id});
  @override
  Widget build(BuildContext context) {
    if (id == 'payments') {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(12)),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Благоустройство двора',
                    style:
                        TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                Text('15 мая 2026',
                    style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
              ],
            ),
            const Text('+ 5 000 ₸',
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF15803D))),
          ],
        ),
      );
    }
    if (id == 'notifications') {
      return Column(
        children: const [
          _SwitchRow(label: 'Уведомления ОСИ', value: true),
          _SwitchRow(label: 'Чат дома и подъезда', value: true),
          _SwitchRow(label: 'Новые опросы', value: true),
        ],
      );
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Text('Раздел "$id" активен и привязан к вашему профилю ЖК.',
          style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
          textAlign: TextAlign.center),
    );
  }
}

class _MenuRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool showDivider;
  const _MenuRow(
      {required this.icon,
      required this.label,
      required this.onTap,
      this.showDivider = true});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
            border: showDivider
                ? Border(
                    bottom: BorderSide(
                        color: isDark
                            ? AppColors.borderDark
                            : const Color(0xFFF1F5F9)))
                : null),
        child: Row(
          children: [
            Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                    color: isDark
                        ? AppColors.secondaryDark
                        : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, size: 16, color: const Color(0xFF64748B))),
            const SizedBox(width: 12),
            Expanded(
                child: Text(label,
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color:
                            isDark ? Colors.white : const Color(0xFF0F172A)))),
            const Icon(Icons.chevron_right, size: 18, color: Color(0xFF94A3B8)),
          ],
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  const _Field(
      {required this.label, required this.controller, this.keyboardType});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Color(0xFF64748B))),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            filled: true,
            fillColor:
                isDark ? const Color(0xFF27272A) : const Color(0xFFF8FAFC),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                    color: isDark
                        ? const Color(0xFF3F3F46)
                        : const Color(0xFFE2E8F0))),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                    color: isDark
                        ? const Color(0xFF3F3F46)
                        : const Color(0xFFE2E8F0))),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            isDense: true,
          ),
          style: const TextStyle(fontSize: 13),
        ),
      ],
    );
  }
}

class _SwitchRow extends StatelessWidget {
  final String label;
  final bool value;
  const _SwitchRow({required this.label, required this.value});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: const TextStyle(fontSize: 13)),
        Switch(value: value, onChanged: (_) {}, activeColor: AppColors.primary)
      ]),
    );
  }
}
