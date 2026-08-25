# HouseSM Mobile — Визуальная проверка

## Методика
Экраны сверстаны по веб-референсу `src/components/*` + `src/app/(main)/*`. Адаптив проверяется через `LayoutBuilder` + `MediaQuery` + `SafeArea` + `viewInsets`.

### Размеры для проверки (как в ТЗ п.8)
- **iPhone SE (375x667)** — минимальный iOS, проверяет плотность чипов, перенос текста поста, `NavigationBar 64 + FAB 56`.
- **Pixel 7 (412x915)** — средний Android, проверяет `Search` поля, `Grid 5` в Hoa, `ListView` отступы.
- **iPad mini (768x1024)** — планшет, проверяет `ConstrainedBox maxWidth 600` в `ScaffoldWithBottomNav:140`, карточка центрируется с тенью.

### Чек-лист по экранам

#### Feed (`feed_screen.dart:1`)
- [ ] Header `36x36 rounded-12 shadow primary/20` + `ЖК «Солнечный» 14/bold + verified 14` + subtitle 11 — совпадает с `feed/page.tsx:52`
- [ ] Чипы `px-14 py-7 rounded-full 12/medium` + selected `primary shadow 30%` — как `chips px-3.5 py-1.5`
- [ ] Пост `border-b p-16` (не Card) — `avatar 40 + name 14/bold + territory 11 + time` — `title 15/bold` — `content 14/1.5` — `attachment rounded-2xl` — `PollWidget 12/medium` — `ReactionBar 18 + 12`
- [ ] Состояния: `PostSkeleton` (loading), `EmptyState` (фильтры), `ErrorView` (retry), `OfflineBanner` (amber), `RefreshIndicator primary`
- [ ] `FilterSheet` dark `18181B rounded-3xl` с `territory/type` + `Check 20 green`

#### Chats (`chats_list_screen.dart:1`)
- [ ] Header `Чаты 18/bold + Создать группу green50 pills + Search F1F5F9 rounded-12 + tabs`
- [ ] Item `48x48 rounded-2xl avatarColor + icon 20 + name 14/semibold + time 11 + msg 12 + unread 20 circ`
- [ ] `Divider indent 78` — как в вебе `divide-y`
- [ ] Empty `Чатов не найдено`, Loading shimmer, `push('/chats/:id')` (не `go`)

#### ChatRoom (`chat_room_screen.dart:1`)
- [ ] `AppBar` `48 онлайн primary 11` + `more_vert`, `pop` (не `go`)
- [ ] Bubbles `maxWidth 72% 18 radius 4 tail` + `sender 11/bold + verified` + `time 10 + done_all` — адаптив ширины
- [ ] Input `SafeArea + viewInsets` + `F1F5F9 24 radius + 44 send` disabled `E2E8F0` — тёмная `secondaryDark`

#### Hoa (`hoa_screen.dart:1`)
- [ ] `SliverAppBar pinned` + `gradient green50->emerald50 border green100` + `48x48 primary`
- [ ] `Grid 5 56x56` active `primary` vs `F1F5F9` — как `hoa/page.tsx:53`
- [ ] Секции: `Официальные новости` (`Объявление blue50`), `Активные опросы` (`Проголосовать primary`), `Текущие сборы` (`62% progress 8`)

#### Classifieds (`classifieds_screen.dart:1`)
- [ ] `Search F1F5F9 12` + `4 categories 44x44` (amber/blue/purple/rose) + `tabs pills` + `64x64 image 16 radius + title 14/semibold + price 13/bold #15803D`

#### Profile (`profile_screen.dart:1`)
- [ ] `80x80 rounded-3xl ring 3 green50 + verified 24` + `name 18/bold + phone 12 + MapPin 11 + verified pill`
- [ ] `amber banner` если не verified + `6 menu rows 32x32 F1F5F9 + chevron` + `modals` — как `profile/page.tsx:46`

#### Login (`auth/login_screen.dart:1`)
- [ ] Dark `09090B` + `White 36 radius + Tabs F1F5F9 16` + `Demo 40x40 rounded-xl` — как `login/page.tsx:64`

#### Навигация (`navigation/app_router.dart:140`)
- [ ] `extendBody true` + `FAB 56 circ primary shadow` centerDocked + `NavigationBar 64 label 10` active `primary` inactive `9CA3AF` — как `BottomNav.tsx:13`, `maxWidth 600` на iPad, `SafeArea` bottom.

#### Системные
- [ ] Светлая/тёмная проверены (`AppTheme.lightTheme/darkTheme` surface, `textPrimary` Inter)
- [ ] `SafeArea(bottom:false)` для `CustomScrollView`, `MediaQuery.viewInsets` для клавиатуры
- [ ] `textScale 1.0-1.3` не ломает верстку (Wrap, ellipsis)
- [ ] `Cupertino` back swipe работает (go_router)

### Как запустить проверку
```bash
flutter run -d "iPhone SE" --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...
flutter run -d "Pixel 7"   --dart-define=...
# iPad
flutter run -d "iPad mini" --dart-define=...
# Анализ
dart format --line-length 100 lib
flutter analyze
flutter test test/post_test.dart
```
Сетевые моки: `SupabaseConfig.isPlaceholder` → `mockPosts()` если нет ключей (демо как в `src/app/page.tsx:5`).
