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

## OneSignal Web Push

Создайте отдельное OneSignal Web App для localhost и production. В `.env.local` добавьте только публичный App ID:

```dotenv
NEXT_PUBLIC_ONESIGNAL_APP_ID=<onesignal-app-id>
```

Интеграция уже подключает Web SDK v16, связывает push-подписку с Supabase user id через `OneSignal.login()` и содержит `public/OneSignalSDKWorker.js`. В профиле кнопка «Включить push» запрашивает браузерное разрешение.

В OneSignal Web Configuration укажите точный origin сайта. Для localhost включите режим Treat HTTP localhost as HTTPS. Для production используйте HTTPS. Service worker должен быть доступен по `/OneSignalSDKWorker.js` без редиректа.

REST API Key OneSignal нужен только серверу для отправки targeted notifications. Его нельзя помещать в `NEXT_PUBLIC_*`, клиентский код или git. Для будущего server route используйте:

```dotenv
ONESIGNAL_REST_API_KEY=<server-only-key>
```

Источники: [OneSignal Web SDK setup](https://documentation.onesignal.com/docs/en/web-sdk-setup), [OneSignal Web SDK reference](https://documentation.onesignal.com/docs/en/web-sdk-reference), [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [Supabase email confirmation](https://supabase.com/docs/guides/auth/general-configuration).
