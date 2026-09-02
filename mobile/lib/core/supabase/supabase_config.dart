// ignore_for_file: deprecated_member_use
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  static bool get isPlaceholder =>
      supabaseUrl.isEmpty || supabaseAnonKey.isEmpty ||
      supabaseUrl.contains('placeholder') || supabaseAnonKey.contains('placeholder');

  static Future<void> initialize() async {
    if (isPlaceholder) {
      throw StateError('Flutter не настроен: передайте SUPABASE_URL и SUPABASE_ANON_KEY');
    }
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      realtimeClientOptions: const RealtimeClientOptions(eventsPerSecond: 10),
    );
  }

  static SupabaseClient get client => Supabase.instance.client;
}
