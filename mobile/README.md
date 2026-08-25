# HouseSM Mobile (Flutter)

Нативное мобильное приложение для жителей ЖК HouseSM (iOS & Android).

## Стек
- **Flutter** 3.x / Dart 3.x
- **Supabase Flutter SDK** (`supabase_flutter`)
- **State Management**: Flutter Riverpod
- **Routing**: `go_router`
- **UI & Icons**: Material 3 + Google Fonts (Inter) + Cupertino Icons

## Структура проекта
```
mobile/
├── lib/
│   ├── main.dart
│   ├── core/
│   │   ├── theme/           # AppColors, AppTheme, AppTypography, AppSpacing, AppRadius, AppShadows
│   │   ├── widgets/         # AppChip, AppCard, PostCard, Avatar, EmptyState, LoadingSkeleton
│   │   └── supabase/        # SupabaseConfig (демо-режим как в вебе)
│   ├── features/
│   │   ├── feed/            # Лента, PostCard, Poll/Initiative/Fundraiser, FilterSheet
│   │   ├── chats/           # Список чатов (search/tabs) + ChatRoom (bubbles, keyboard)
│   │   ├── hoa/             # Мой ЖК — категории, новости, опросы, сборы
│   │   ├── classifieds/     # Объявления — поиск, категории, табы, карточки
│   │   ├── profile/         # Профиль — avatar, verification, меню, modals
│   │   └── auth/            # Login (demo/register/phone OTP)
│   └── navigation/          # go_router + ScaffoldWithBottomNav (FAB Создать, maxWidth 600)
├── test/                    # post_test.dart
├── analysis_options.yaml
└── pubspec.yaml
```

## Дизайн-система
Синхронизирована с веб-токенами `src/app/globals.css` + `tailwind.config.ts`:
- `--primary 142.1 76.2% 36.3% → #16A34A`, `--radius 0.75rem=12`, `bg #F8FAFC / #09090B`, `border #E2E8F0 / #1E293B`
- Компоненты: `Article border-b p-4` для ленты, `rounded-2xl` для карточек, `pill` для чипов

## Проверки
```bash
dart format --line-length 100 lib
flutter analyze
flutter test
```

## Подключение к Supabase
Укажите переменные при запуске:
```bash
flutter run --dart-define=SUPABASE_URL=https://your-project.supabase.co --dart-define=SUPABASE_ANON_KEY=your-anon-key
```
