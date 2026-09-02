# Руководство разработчика Korshi

## Карта проекта

```text
src/app/                 Web-маршруты Next.js App Router
src/components/          переиспользуемые React-компоненты
src/lib/supabase/        Supabase client и repository
src/stores/appStore.ts   Zustand: auth и доменное состояние Web
src/types/               доменные и сгенерированные DB-типы
mobile/lib/core/data/    общий Flutter repository
mobile/lib/features/     экраны Flutter по функциональным областям
supabase/migrations/     схема, RLS и безопасные функции БД
```

## Архитектурное правило

Supabase — источник истины. Web и Flutter должны читать и изменять одни и те же таблицы и RPC. UI может показывать optimistic-состояние, но при ошибке обязан вернуть прежнее состояние и показать понятную ошибку.

Основные связи:

```text
complexes → buildings → entrances → apartments → profiles
profiles → posts → comments / reactions / polls / initiatives / fundraisers
profiles ↔ chat_members ↔ chats → messages
profiles → notifications
```

## Auth и права

`profiles.role` определяет роль пользователя: `resident`, `hoa_official`, `service_provider` или `admin`. `profiles.verified` определяет доступ к функциям жителя.

- пользователь видит и изменяет только разрешённые RLS данные;
- публикации создаются только подтверждёнными жителями;
- заявку верификации принимает администратор через `review_verification_request`;
- личный чат создаётся через `create_direct_chat`, а не прямой вставкой из клиента;
- голоса ограничены уникальностью `(poll_id, user_id)`;
- удаление публикации разрешается автору и ролям модерации на уровне политики БД.

Проверка кнопки в интерфейсе — только UX-слой. Безопасность должна оставаться в RLS и RPC.

## Поток данных Web

1. `AuthStateSync` слушает изменения auth и realtime таблиц.
2. `useAppStore.syncAuthState()` получает текущего пользователя и профиль.
3. `useAppStore.hydrateDomainData()` загружает посты, чаты, сообщения, объявления, заявки и уведомления.
4. Компонент вызывает действие store.
5. Store вызывает функцию `src/lib/supabase/repository.ts`.
6. Repository проверяет текущую сессию и пишет через Supabase/RPC.
7. Ошибка возвращается в store и показывается через `BackendErrorBanner`.

Для новой операции добавляйте её в repository, затем действие store и только потом UI. Не вызывайте Supabase напрямую из нескольких компонентов без необходимости.

## Поток данных Flutter

`mobile/lib/core/data/house_repository.dart` — единая точка запросов Flutter. Экраны загружают данные из repository, подписываются на нужный realtime-канал и показывают loading/error/empty состояния.

Flutter должен использовать те же:

- таблицы и названия полей;
- правила авторизации;
- уникальные ограничения голосов;
- signed URL для файлов из `house-media`;
- понятные состояния ошибки и повторной загрузки.

## Добавление функции

1. Опишите источник истины: таблица, RPC или уже существующий доменный объект.
2. Проверьте RLS для чтения и записи.
3. Добавьте миграцию, если меняется БД; существующие миграции не редактируйте.
4. Добавьте repository-функцию.
5. Добавьте обработку ошибки и rollback optimistic-состояния.
6. Реализуйте Web и Flutter одинаково.
7. Добавьте realtime, если изменение должно быть видно другим пользователям.
8. Обновите документацию и прогоните проверки.

## Новые миграции

Имя миграции должно описывать изменение и иметь следующий номер. Перед `db push` проверьте diff и статус Supabase. Не храните service role key в коде, `.env.local`, логах или коммите.

## Стиль

- пользовательские тексты — на русском;
- бренд — `Korshi`, название конкретного ЖК может быть отдельным значением данных;
- видимые действия должны иметь loading, disabled и error-состояния;
- пустой список должен быть честным empty state, а не тестовыми объектами;
- доступность: `aria-label` для icon-only Web-кнопок и понятные подписи для Flutter-кнопок.

