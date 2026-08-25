# Supabase и OneSignal

## Supabase

Добавьте в `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` не добавляется в браузер и не должен попадать в git.

Применение схемы к удалённому проекту:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
npm run db:types
```

В Supabase Auth нужно включить Email provider и Confirm email. В URL Configuration добавьте:

```text
http://localhost:3000/auth/callback
https://<production-domain>/auth/callback
```

Также проверьте Site URL и шаблон Confirm signup. Callback приложения уже реализован в `/auth/callback`.

## OneSignal

Интеграция OneSignal для SMS и push временно отключена. Вход и регистрация работают только через email и пароль с подтверждением email. Телефон хранится как необязательный контактный профиль и не используется для авторизации.

Источники Supabase: [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [email confirmation](https://supabase.com/docs/guides/auth/general-configuration).
