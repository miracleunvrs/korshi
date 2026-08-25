import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  late TabController _tab;
  final _loginPhone = TextEditingController(text: '+7 (777) ');
  final _regName = TextEditingController();
  final _regPhone = TextEditingController(text: '+7 (777) ');
  final _regApartment = TextEditingController();
  String _regBuilding = '1';
  int _regEntrance = 1;
  String _regRole = 'resident';

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 3, vsync: this, initialIndex: 0);
  }

  @override
  void dispose() {
    _tab.dispose();
    _loginPhone.dispose();
    _regName.dispose();
    _regPhone.dispose();
    _regApartment.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 440),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(36),
                boxShadow: const [
                  BoxShadow(color: Color(0x33000000), blurRadius: 24, offset: Offset(0, 8)),
                ],
              ),
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo
                  Column(
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF16A34A), Color(0xFF10B981)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x4D16A34A),
                              blurRadius: 12,
                              offset: Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Text(
                            'ЖК',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Text(
                            'ЖК «Солнечный»',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5,
                            ),
                          ),
                          SizedBox(width: 6),
                          Icon(Icons.verified, size: 20, color: AppColors.primary),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Закрытая цифровая среда для жителей дома',
                        style: TextStyle(
                          fontSize: 11,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Tabs
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    padding: const EdgeInsets.all(4),
                    child: TabBar(
                      controller: _tab,
                      indicator: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: const [
                          BoxShadow(color: Color(0x0A000000), blurRadius: 6, offset: Offset(0, 2)),
                        ],
                      ),
                      labelColor: const Color(0xFF0F172A),
                      unselectedLabelColor: const Color(0xFF64748B),
                      labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                      unselectedLabelStyle: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                      indicatorSize: TabBarIndicatorSize.tab,
                      dividerColor: Colors.transparent,
                      tabs: const [
                        Tab(text: 'Быстрый вход'),
                        Tab(text: 'Регистрация'),
                        Tab(text: 'Вход по номеру'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    height: 420,
                    child: TabBarView(
                      controller: _tab,
                      children: [
                        _DemoTab(onSelect: () => context.go('/feed')),
                        _RegisterTab(
                          nameCtrl: _regName,
                          phoneCtrl: _regPhone,
                          apartmentCtrl: _regApartment,
                          building: _regBuilding,
                          entrance: _regEntrance,
                          role: _regRole,
                          onBuildingChanged: (v) => setState(() => _regBuilding = v),
                          onEntranceChanged: (v) => setState(() => _regEntrance = v),
                          onRoleChanged: (v) => setState(() => _regRole = v),
                          onSubmit: () => context.go('/feed'),
                        ),
                        _LoginTab(phoneCtrl: _loginPhone, onSubmit: () => context.go('/feed')),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _DemoTab extends StatelessWidget {
  final VoidCallback onSelect;
  const _DemoTab({required this.onSelect});
  @override
  Widget build(BuildContext context) {
    final demos = [
      {
        'name': 'Мария Иванова',
        'role': 'Житель',
        'phone': '+7 (777) 234-56-78',
        'verified': true,
        'avatar':
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      },
      {
        'name': 'Алексей Петров',
        'role': 'Житель',
        'phone': '+7 (777) 111-22-33',
        'verified': true,
        'avatar':
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      },
      {
        'name': 'ОСИ «Солнечный»',
        'role': 'ОСИ',
        'phone': '+7 (777) 000-00-00',
        'verified': true,
        'avatar': '',
      },
      {
        'name': 'ИП Сантехник',
        'role': 'Мастер услуг',
        'phone': '+7 (777) 555-66-77',
        'verified': false,
        'avatar':
            'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200&auto=format&fit=crop&q=80',
      },
    ];
    return Column(
      children: [
        const Text(
          'Выберите роль для мгновенного входа:',
          style: TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: ListView.separated(
            itemCount: demos.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final d = demos[i];
              return InkWell(
                onTap: onSelect,
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: d['avatar']!.toString().isNotEmpty
                            ? Image.network(
                                d['avatar'] as String,
                                width: 40,
                                height: 40,
                                fit: BoxFit.cover,
                              )
                            : Container(
                                width: 40,
                                height: 40,
                                color: AppColors.primaryLight,
                                child: const Icon(Icons.apartment, color: AppColors.primary),
                              ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  d['name'] as String,
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                                ),
                                if (d['verified'] as bool)
                                  const Padding(
                                    padding: EdgeInsets.only(left: 4),
                                    child: Icon(Icons.verified, size: 12, color: AppColors.primary),
                                  ),
                              ],
                            ),
                            Text(
                              d['role'] as String,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF15803D),
                              ),
                            ),
                            Text(
                              d['phone'] as String,
                              style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                            ),
                          ],
                        ),
                      ),
                      const Text(
                        'Войти →',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _RegisterTab extends StatelessWidget {
  final TextEditingController nameCtrl, phoneCtrl, apartmentCtrl;
  final String building;
  final int entrance;
  final String role;
  final ValueChanged<String> onBuildingChanged;
  final ValueChanged<int> onEntranceChanged;
  final ValueChanged<String> onRoleChanged;
  final VoidCallback onSubmit;
  const _RegisterTab({
    required this.nameCtrl,
    required this.phoneCtrl,
    required this.apartmentCtrl,
    required this.building,
    required this.entrance,
    required this.role,
    required this.onBuildingChanged,
    required this.onEntranceChanged,
    required this.onRoleChanged,
    required this.onSubmit,
  });
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          _Field(label: 'ФИО (как в удостоверении)', hint: 'Иван Иванов', controller: nameCtrl),
          const SizedBox(height: 12),
          _Field(
            label: 'Номер мобильного телефона',
            hint: '+7 (777) 123-45-67',
            controller: phoneCtrl,
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _Dropdown(
                  label: 'Дом №',
                  value: building,
                  items: const ['1', '2', '3'],
                  onChanged: onBuildingChanged,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _NumberField(
                  label: 'Подъезд',
                  value: entrance,
                  onChanged: onEntranceChanged,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _Field(label: 'Кв. №', hint: '45', controller: apartmentCtrl),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Роль в ЖК',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF475569),
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => onRoleChanged('resident'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: role == 'resident'
                              ? const Color(0xFFEFF6FF)
                              : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: role == 'resident' ? AppColors.primary : const Color(0xFFE2E8F0),
                          ),
                        ),
                        child: const Text(
                          'Житель / Собственник',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => onRoleChanged('service_provider'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: role == 'service_provider'
                              ? const Color(0xFFEFF6FF)
                              : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: role == 'service_provider'
                                ? AppColors.primary
                                : const Color(0xFFE2E8F0),
                          ),
                        ),
                        child: const Text(
                          'Мастер услуг ЖК',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onSubmit,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text(
                'Зарегистрироваться и войти в ЖК',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LoginTab extends StatelessWidget {
  final TextEditingController phoneCtrl;
  final VoidCallback onSubmit;
  const _LoginTab({required this.phoneCtrl, required this.onSubmit});
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _Field(
          label: 'Номер мобильного телефона',
          hint: '+7 (777) 123-45-67',
          controller: phoneCtrl,
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 6),
        const Text(
          'Введите номер зарегистрированного жителя или любой новый для мгновенного входа.',
          style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
        ),
        const Spacer(),
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: onSubmit,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            icon: const Icon(Icons.arrow_forward, size: 16, color: Colors.white),
            label: const Text(
              'Войти в систему',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white),
            ),
          ),
        ),
        const SizedBox(height: 12),
      ],
    );
  }
}

class _Field extends StatelessWidget {
  final String label, hint;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  const _Field({
    required this.label,
    required this.hint,
    required this.controller,
    this.keyboardType,
  });
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: Color(0xFF475569),
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: const Color(0xFFF1F5F9),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            isDense: true,
            hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
          ),
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}

class _Dropdown extends StatelessWidget {
  final String label, value;
  final List<String> items;
  final ValueChanged<String> onChanged;
  const _Dropdown({
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
  });
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: Color(0xFF475569),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(12),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Color(0xFF0F172A),
              ),
              items: items.map((e) => DropdownMenuItem(value: e, child: Text('Дом $e'))).toList(),
              onChanged: (v) => onChanged(v!),
            ),
          ),
        ),
      ],
    );
  }
}

class _NumberField extends StatelessWidget {
  final String label;
  final int value;
  final ValueChanged<int> onChanged;
  const _NumberField({required this.label, required this.value, required this.onChanged});
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: Color(0xFF475569),
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: TextEditingController(text: '$value'),
          keyboardType: TextInputType.number,
          onChanged: (v) => onChanged(int.tryParse(v) ?? 1),
          decoration: InputDecoration(
            filled: true,
            fillColor: const Color(0xFFF1F5F9),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            isDense: true,
          ),
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
