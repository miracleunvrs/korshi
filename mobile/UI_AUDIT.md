# HouseSM Mobile — UI Аудит (Flutter) vs Макеты/Веб-референс

Дата: 2026-08-25
Ветка: main
Папка: `mobile/lib/features/`

## 0) Блокер: макеты не приложены
В репозитории `housesm` отсутствуют файлы макетов iOS/Android (Figma / PNG / PDF). Поиск по `*.png, *.jpg, *.fig, *.pdf` вне `node_modules` не дал результатов. `docs/` содержит только `architecture.md`.

**Решение (минимально безопасное):** за эталон берём веб-реализацию `src/components/feed/PostCard.tsx`, `src/app/(main)/feed`, `chats`, `hoa`, `classifieds`, `profile`, `src/components/layout/BottomNav.tsx`, `src/app/globals.css`, `tailwind.config.ts` (семантические токены) + `docs/architecture.md` (домены/территории) — как единственный верифицируемый источник дизайна. Любое точное iOS/Android расхождение по тени/blur/радиусу будет донастроено при получении Figma.

---

## 1) Общие расхождения дизайн-системы (централизованно)

### 1.1 Токены
| Токен | Веб (globals.css) | Flutter сейчас | Проблема |
|---|---|---|---|
| `--primary` | `142.1 76.2% 36.3%` → `0xFF16A34A` | `AppColors.primary 0xFF16A34A` OK | остальные токены отсутствуют |
| `--background / --card / --muted / --border / --input / --ring` | определены | `bgLight F8FAFC, bgCard, border F1F5F9` лишь частично | нет семантики `muted`, `popover`, `destructive`, `chart`, `ring`, primaryFg |
| `--radius` | `0.75rem = 12px`, lg=12, md=10, sm=8 | `Card borderRadius 20` хардкод | не соответствует веб-радиусам, нет централизованных `AppRadius` |
| Палитра primaryLight/Dark/Accent | нет в вебе | есть `DCFCE7, 15803D, 22C55E` | не используется системно |
| Badges | через `primary/secondary` | `badgeAmber/Blue` | нет `rose/purple/blue semantic` как в веб `classifieds` |
| Dark theme | `--card 222.2 84% 4.9%` | `bgDark 121214, bgCardDark 1C1C1E` | близки но не совпадают с веб, gradient `DCFCE7->F0FDF4` не адаптирован под dark |

**Вывод:** нужно ввести `AppSpacing, AppRadius, AppShadows, AppTypography` + расширить `AppColors` до полной палитры из `tailwind.config.ts` + `globals.css`.

### 1.2 Типографика
- `app_theme.dart` использует `GoogleFonts.interTextTheme()` без `textColor` override → в dark text остаётся тёмным.
- Заголовки: `AppBar title 16/700` в Flutter vs веб `text-sm font-bold (14)` и `text-lg` для Чаты — несоответствие.
- Хардкоды: `10, 11, 12, 14` в каждом экране без токенов, нет `TextTheme` уровней (`titleLarge, labelSmall` и тд).
- Нет адаптива под `textScaleFactor` / `MediaQuery`.

### 1.3 Тема и Material 3
- Используется `ColorScheme.fromSeed(seedColor: primary)` но с `background` deprecated → должен быть `surface`.
- `CardTheme` deprecated → должен быть `CardThemeData`.
- Отсутствуют `ChipTheme, NavigationBarTheme, InputDecorationTheme, DividerTheme`.
- Нет `Cupertino` адаптивности для iOS (back swipe, AppBar, blur).

### 1.4 SafeArea / Клавиатура / Системные панели
- `FeedScreen` и другие `Scaffold` без `SafeArea`, без `MediaQuery.viewInsets` для клавиатуры.
- `ChatRoomScreen` оборачивает только `Row` в `SafeArea`, но не весь `Scaffold`; `resizeToAvoidBottomInset` не задан.
- `ScaffoldWithBottomNav` не учитывает `bottom` inset и `keyboard`, нет `extendBody: true` для blur как в вебе (`bg-white/95 backdrop-blur-md`).
- `PreferredSize bottom` для чипов не учитывает `SafeArea` и `Scroll` inset.

### 1.5 Отсутствие общих компонентов → дубли
- Каждый экран хардкодит `Container` с `BoxDecoration` вместо `AppCard`.
- Чипы: `FilterChip` в Feed vs веб `button rounded-full px-3.5 py-1.5` — визуально не совпадает (хардкод `shape 20` vs `999`).
- Нет `EmptyState, ErrorView, LoadingSkeleton, OfflineBanner, Avatar, Badge`.
- Нет widgets для `poll | initiative | fundraiser` (есть в вебе `PostCard.tsx` — в Flutter только `post`).

---

## 2) Навигация — `mobile/lib/navigation/app_router.dart:1`

### Референс веб: `src/components/layout/BottomNav.tsx:1`
- 5 иконок: Главная (`Home`), Чаты (`MessageSquare`), **Создать** (центр FAB `w-12 h-12 bg-green-600 rounded-full shadow-lg shadow-green-600/30 -top-3`), Мой ЖК (`Building2`), Профиль (`User`).
- Стили: `bg-white/95 backdrop-blur-md border-t border-gray-100 px-3 py-2`, активный `text-green-600 font-medium`, неактивный `text-gray-400`.

### Flutter сейчас:
- 5 иконок: Главная, Чаты, **Услуги** (`storefront`), Мой ЖК, Профиль — **расхождение**: центр не «Создать», а «Услуги».
- Использует `NavigationBar` (M3) с хардкод `selectedIcon` green — не соответствует веб blur/FAB.
- Нет центрального действия создания поста (критично по архитектуре `posts` всех типов).
- Нет SafeArea для NavigationBar, нет `extendedBody` + blur.
- Роут `:chatId` использует `context.go('/chats')` в `chat_room_screen.dart:40` — ломает стек `StatefulShellRoute`.

**Риски архитектуры:** `supabase/` не затрону, но отсутствие «Создать» блокирует создание `post|poll|initiative|fundraiser|service` из мобильного.

---

## 3) Экраны

### 3.1 Feed — `mobile/lib/features/feed/presentation/feed_screen.dart:1`
- **Референс:** `src/app/(main)/feed/page.tsx:48` + `PostCard.tsx:33`
- **Заголовок:** веб: `w-9 h-9 rounded-2xl bg-green-600 shadow-md`, `ЖК` + `h1 ЖК «Солнечный» + ✓` + `p Алматы...` + действия `SlidersHorizontal` + `Bell` с dot indicator. Flutter: `Container padding 8 radius 12` + `Column` с `check_circle` — близко но размеры/радиусы не совпадают (9 vs 8, 2xl 16 vs 12), нет `backdrop-blur` + `SlidersHorizontal` фильтра.
- **Чипы:** веб: `px-3.5 py-1.5 rounded-full 12sp medium` + `bg-green-600 shadow`. Flutter: `FilterChip selectedColor green label 12/600 shape 20` — цвет label меняется, но форма и `padding` не совпадают, нет `gap 2` + `overflow-auto scrollbar-hide`.
- **Карточка:** веб `article bg-white border-b p-4` (full-bleed, без радиуса), Flutter `Card margin bottom 16 radius 20 border F1F5F9 p-16` — **разные композиции**: скруглённая карта vs плоский feed. Теряется иерархия/плотность.
- **Контент:** Flutter только простой текст + реакции (12/8) с `Icons.favorite_border/chat_bubble`. Веб: `territoryBadge`, `POST_TYPE_LABELS`, `avatar_url || initials`, `views_count`, `Heart` с `fill-red-500`, `MessageCircle` + link `/feed/[id]`, поддержка `attachments grid rounded-xl`, `poll` (прогресс + `absolute bg-green-100/60`), `initiative` (`emerald-50/60 Sparkles`), `fundraiser` (`amber-50/60 + progress`). Отсутствуют в Flutter → нет `poll/initiative/fundraiser` состояний.
- **Состояния:** только `ListView` с 1 хардкод постом. Нет `loading skeleton`, `empty` («Нет публикаций по фильтрам + Сбросить»), `error` (retry), `offline` banner, `pull-to-refresh`. Не сохраняет `territory` (complex/building/entrance) — критично для RLS.
- **UX:** нет `Realtime feed:{complexId}` подписки, нет `FilterModal` (dark `bg-[#18181b] rounded-3xl` как в `FeedFilterModal.tsx`).

### 3.2 Chats — `chats_list_screen.dart:1`
- **Референс:** `src/app/(main)/chats/page.tsx:1`
- **Header:** веб: sticky `bg-white/95 blur + h1 Чаты + Создать группу bg-green-50 rounded-full + Search bg-gray-100 rounded-xl + tabs Все/Мои/Непрочитанные`. Flutter: `AppBar Чаты сообщества + add_circle_outline` — нет `Search`, нет `tabs`.
- **Список:** веб: `w-12 h-12 rounded-2xl avatarColor + emoji icon text-xl + name 14/semibold + lastMessage 12 + unread 5x5 rounded-full green-600 11/bold`. Flutter: `CircleAvatar F1F5F9 emoji 18 + ListTile title 14/bold + subtitle 12 + trailing 11 + badge 5 padding circle` — близко, но `Divider indent 72` хардкод, бейдж без фикс `BoxConstraints`, эмодзи рендер отличается iOS/Android (нужны иконки `Lucide` или `avatar_url`).
- **Empty:** Flutter нет empty/search-empty, веб показывает «Чатов не найдено».
- **RLS:** чаты `complex|building|entrance|thematic|direct` — в Flutter статика 4 чата, нет фильтра по территории/роли.

### 3.3 Chat Room — `chat_room_screen.dart:1`
- **Референс:** `src/app/(main)/chats/[chatId]/page.tsx` + `stores/appStore:(messages)`
- **AppBar:** веб (через layout) с back + title + «48 соседей онлайн» green. Flutter ОК, но `leading: arrow_back` делает `context.go('/chats')` вместо `pop` → теряет историю StatefulShell.
- **Сообщения:** Flutter `Align + Container radius 16 p14/10 bg green-600|white shadow opacity 0.04` + sender 11/bold + text 13 + time 9. Веб (store): `isOfficial` + `isMe` + `text/time`. Нет `avatar`, `reply_to`, `type image/document/system`, `delivered/read`, `time` форматирования `intl`.
- **Input:** Flutter `TextField filled F1F5F9 radius24 + IconButton.filled green send`. Веб нет референса, но в нативе ожидается: `SafeArea + KeyboardInsets + TextField with attachments (image/file) + send disabled state`. Flutter: `Container color white + SafeArea only Row` → в dark будет белым, без `viewInsets`.
- **Realtime:** нет подписки `chat:{chatId}` (`supabase Realtime`), нет `typing`, нет `offline` queue.

### 3.4 Hoa (Мой ЖК) — `hoa_screen.dart:1`
- **Референс:** `src/app/(main)/hoa/page.tsx:29`
- **Карточка ОСИ:** Flutter `gradient DCfce7->F0FDF4 radius20 p16 + CircleAvatar green + Row`. Веб: `from-green-50 to-emerald-50 border green-100 rounded-2xl p4 + w-12 h-12 rounded-2xl shadow-md + ChevronRight`. Близко но без `border` + `shadow` + `chevron`, в dark gradient ломается.
- **Категории:** веб `grid-cols-5: Новости/Документы/Опросы/Инициативы/Сборы` с активной подложкой `bg-green-600`. Flutter отсутствует.
- **Контент:** веб 3 секции: «Официальные новости» (announcement badge), «Активные опросы» (button Проголосовать), «Текущие сборы» (прогресс 62%). Flutter только карточка ОСИ → заглушка (нарушение п.7 ТЗ).

### 3.5 Classifieds — `classifieds_screen.dart:1`
- **Референс:** `src/app/(main)/classifieds/page.tsx:52`
- Веб: header `Поиск bg-gray-100 rounded-xl + 4 категории grid Tag/Wrench/Sparkles/HeartHandshake с цветами amber/blue/purple/rose + tabs Все/Объявления... + список card w-16 h-16 rounded-2xl + title 14/semibold + price green-700 + location 11`. Flutter: `AppBar + ListView padding16 + Text Каталог...` → **полностью заглушка**.

### 3.6 Profile — `profile_screen.dart:1`
- **Референс:** `src/app/(main)/profile/page.tsx:46`
- Веб: sticky header `Профиль + Редактировать bg-green-50 rounded-full + avatar 20x20 rounded-3xl ring4 ring-green-50 + verified ShieldCheck + name 18/bold + phone 12 + MapPin badge + verified badge green/amber + верификация banner amber-50 + меню 6 items icon 8x8 rounded-xl bg-gray-100 + chevron + modals edit (4 поля) / verify-resident`. Flutter: `Scaffold AppBar + ListView padding16 + Center Column avatar radius40 DCFce7 + МИ + name18/bold + Дом2 кв45•Подтверждён` → **заглушка, нет меню, нет верификации, нет модалок, нет Supabase `profiles` связывания.**

### 3.7 Auth (missing)
- `mobile/lib/features/auth/presentation` пусто, тогда как архитектура `docs/architecture.md:168` требует `login (OTP) → verify → onboarding (complex/apartment) → verified screen`. Веб `src/app/(auth)/login` + `verify` есть. Мобильный flow отсутствует.

---

## 4) Что исправить централизованно (приоритет)

1. **Design tokens:** `app_colors.dart` → полная палитра из `globals.css` (primaryFg, muted, border, input, ring, destructive, chart), `app_spacing.dart` (4/8/12/16/20/24), `app_radius.dart` (8/12/16/20/24/999), `app_typography.dart` (Inter 10-18, line heights, weights), `app_shadows.dart`.
2. **AppTheme:** миграция `background→surface`, `CardThemeData`, `ChipTheme`, `NavigationBarTheme`, `InputDecorationTheme`, `AppBarTheme with surfaceTint transparent`, `DividerTheme`, light/dark sync с веб.
3. **Core components:** `AppCard, AppChip, AppButton, AppSearchField, SectionHeader, Avatar, TerritoryBadge, PostTypeBadge, ReactionBar, PollWidget, InitiativeWidget, FundraiserWidget, EmptyState, ErrorView, OfflineBanner, LoadingSkeleton`.
4. **Navigation:** синхронизировать bottom с веб (Центр = Создать FAB), blur + SafeArea, iOS/Android адаптивность, исправить `chat_room` back nav.
5. **Supabase contracts:** сохранить типы из `database.types.ts` → модели Flutter, territory фильтрация, RLS territory.
6. **Состояния:** для каждого экрана `loading → shimmer`, `empty → illustration + action`, `error → retry`, `disabled → opacity`, `offline → banner`.

---

## 5) Расхождения макет vs архитектура/БД (минимальные безопасные решения)

- Если макет требует радиус/тень отличные от `globals.css` → берём макет (визуал приоритет 1) но токен выносим в `AppRadius/AppShadows` (не ломаем БД).
- Если макет показывает поле которого нет в `posts` (напр. «цена» на `post`) → не добавляем колонку, используем `posts.price` только для `service/announcement` как задумано; UI скрывает поле.
- Если макет рисует «Мой ЖК» без разграничения `official_news vs initiative` → оставляем разграничение по `is_official` (RLS).
- Не менять `supabase/migrations/*` без миграции.

---

## 6) План реализации (последовательно)

1. Токены+Тема (центрально) → 2. Компоненты → 3. Навигация → 4. Feed (полный PostCard) → 5. Chats+Room → 6. Hoa → 7. Classifieds → 8. Profile+Auth.
После каждой группы: `dart format`, `flutter analyze`, `flutter test`, скриншоты на 3 размерах (SE, Pixel 7, iPad mini).

---

## 7) Что считаем Done

- Каждый экран в `mobile/lib/features/` имеет те же композиционные секции что в веб-референсе, с токенами из п.1, с `SafeArea+KeyboardInsets`, с 4 состояниями (loading/empty/error/offline), без заглушек.
- `NavigationBar` 1:1 с веб (центр Создать) + adaptive iOS/Android.
- Тема светлая/тёмная проверена, динамический `textScale`, `accessibility`.
