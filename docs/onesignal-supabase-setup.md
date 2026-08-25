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

## OneSignal SMS OTP

В OneSignal включите SMS и создайте Verify service. В `.env.local` добавьте только серверные значения:

```dotenv
ONESIGNAL_VERIFY_SERVICE_ID=<verification-service-id>
ONESIGNAL_REST_API_KEY=<server-only-rest-api-key>
```

OneSignal Web Push для авторизации не используется. SMS-коды отправляются только через server route; ключ нельзя помещать в `NEXT_PUBLIC_*`, клиентский код или git.

Источники: [OneSignal SMS OTP](https://documentation.onesignal.com/docs/en/sms-verify), [OneSignal OTP guidance](https://documentation.onesignal.com/docs/en/example-verification-magic-link-otp), [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [Supabase email confirmation](https://supabase.com/docs/guides/auth/general-configuration).
