# Korshi

Korshi — закрытая цифровая среда для жителей жилого комплекса. В репозитории находятся Web-версия на Next.js и мобильное приложение на Flutter, работающие с одной базой Supabase.

## Возможности

- регистрация, вход, восстановление пароля и выход из аккаунта;
- подтверждение статуса жителя через заявку и документ;
- лента публикаций, объявления, услуги, опросы и инициативы;
- защита от повторного голоса и повторной поддержки инициативы на уровне БД;
- комментарии, реакции и снятие собственных публикаций;
- чаты ЖК, домов, подъездов и личные чаты;
- объявления с переходом в личный чат с автором;
- админ-проверка заявок жителей;
- уведомления из Supabase с realtime-обновлением;
- загрузка изображений публикаций в защищённое хранилище.

Платежи намеренно не входят в текущую версию: разделы сборов доступны для просмотра, а кнопка оплаты отключена до подключения провайдера.

## Быстрый запуск Web

Требования: Node.js, npm и проект Supabase.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Откройте `http://localhost:3000`.

В `.env.local` укажите URL проекта и anon key Supabase. `SUPABASE_SERVICE_ROLE_KEY` нельзя использовать в браузере и нельзя коммитить.

## Проверки

```bash
npm run type-check
npm run lint
npm run build
dart analyze mobile
git diff --check
```

Проверка безопасности:

```bash
npm run security:scan
```

Сканер требует `OPENAI_API_KEY`, который передаётся только через окружение. Результаты в `strix_runs/` не коммитятся.

## Запуск Flutter

```bash
cd mobile
flutter pub get
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key
```

Flutter использует те же Supabase URL и anon key, что и Web. Без них приложение показывает экран настройки конфигурации и не подставляет демонстрационные данные.

## База данных

Основная схема находится в `supabase/migrations/001_initial_schema.sql` и `002_rls_policies.sql`. Дополнительные исправления:

- `005_security_and_direct_chats.sql` — безопасные RPC для личных чатов, платежей и проверки жителей;
- `006_shared_post_media.sql` — доступ жителей одного ЖК к изображениям публикаций.

Для изменения PostgreSQL сначала прочитайте `supabase-postgres-best-practices`, добавьте новую миграцию и примените её через Supabase CLI:

```bash
npx supabase db push
```

После изменения схемы обновите типы:

```bash
npm run db:types
```

## Документация для разработчиков

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — архитектура, потоки данных и правила разработки;
- [docs/DEBUGGING.md](docs/DEBUGGING.md) — алгоритм поиска багов и частые неисправности;
- [docs/architecture.md](docs/architecture.md) — схема домена и таблиц Supabase.

## Важные правила

Авторизация и права проверяются Supabase RLS/RPC, а не только скрытием кнопок в UI. Не добавляйте тестовые аккаунты, фейковые списки или optimistic-изменения без rollback. При изменении функции, которая есть на Web, проверьте её эквивалент во Flutter.

