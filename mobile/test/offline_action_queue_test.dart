import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:housesm_mobile/core/data/offline_action_queue.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues(<String, Object>{});
  });

  test('persists and flushes queued actions', () async {
    final queue = OfflineActionQueue();
    await queue.add('create_request', <String, dynamic>{'title': 'Лифт'});

    expect(await queue.read(), hasLength(1));

    final synced = await queue.flush((action) async {
      expect(action.type, 'create_request');
      expect(action.payload['title'], 'Лифт');
    });

    expect(synced, 1);
    expect(await queue.read(), isEmpty);
  });

  test('keeps a failed action and increments attempts', () async {
    final queue = OfflineActionQueue();
    await queue.add('send_message', <String, dynamic>{'text': 'Проверка'});

    await queue.flush((_) async => throw Exception('offline'));

    final pending = await queue.read();
    expect(pending, hasLength(1));
    expect(pending.single.attempts, 1);
  });
}
