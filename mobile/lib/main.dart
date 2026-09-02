import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/supabase/supabase_config.dart';
import 'core/theme/app_theme.dart';
import 'navigation/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (SupabaseConfig.isPlaceholder) {
    runApp(const _ConfigurationRequiredApp());
    return;
  }
  // Системные оверлеи — как в вебе themeColor #16a34a
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  try {
    await SupabaseConfig.initialize();
  } catch (e) {
    runApp(_ConfigurationRequiredApp(error: e.toString()));
    return;
  }
  runApp(const ProviderScope(child: HouseSMApp()));
}

class _ConfigurationRequiredApp extends StatelessWidget {
  final String? error;
  const _ConfigurationRequiredApp({this.error});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Korshi',
      home: Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              error ?? 'Укажите SUPABASE_URL и SUPABASE_ANON_KEY при запуске Flutter.',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }
}

class HouseSMApp extends ConsumerWidget {
  const HouseSMApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'Korshi',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}
