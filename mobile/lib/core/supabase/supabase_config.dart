// ignore_for_file: deprecated_member_use
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://placeholder.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'placeholder-anon-key',
  );

  static bool get isPlaceholder =>
      supabaseUrl.contains('placeholder') || supabaseAnonKey.contains('placeholder');

  static Future<void> initialize() async {
    if (isPlaceholder) {
      // Демо-режим как в вебе `src/app/page.tsx` — не инициализируем Supabase, используем мок-данные
      return;
    }
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      realtimeClientOptions: const RealtimeClientOptions(eventsPerSecond: 10),
    );
  }

  static SupabaseClient get client => Supabase.instance.client;
}
