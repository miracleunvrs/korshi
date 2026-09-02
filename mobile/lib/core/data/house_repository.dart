import 'dart:typed_data';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../supabase/supabase_config.dart';
import '../../features/feed/models/post.dart';
import 'media_limits.dart';

class HouseRepository {
  SupabaseClient get _client => SupabaseConfig.client;

  bool get isConfigured => !SupabaseConfig.isPlaceholder;

  Future<User?> currentUser() async {
    if (!isConfigured) return null;
    return _client.auth.currentUser;
  }

  Future<AuthResponse> signIn(String email, String password) {
    return _client.auth.signInWithPassword(
        email: email.trim().toLowerCase(), password: password);
  }

  Future<AuthResponse> signUp({
    required String email,
    required String password,
    required String fullName,
    required String phone,
    required String buildingNumber,
    required int entranceNumber,
    required String apartmentNumber,
  }) {
    return _client.auth.signUp(
      email: email.trim().toLowerCase(),
      password: password,
      data: {
        'full_name': fullName,
        'phone': phone,
        'building_number': buildingNumber,
        'entrance_number': entranceNumber,
        'apartment_number': apartmentNumber,
        'role': 'resident',
      },
    );
  }

  Future<void> signOut() async {
    if (isConfigured) await _client.auth.signOut();
  }

  Future<Map<String, dynamic>?> loadProfile() async {
    if (!isConfigured) return null;
    final user = _client.auth.currentUser;
    if (user == null) return null;
    final row = await _client
        .from('profiles')
        .select(
            'id, complex_id, full_name, phone, avatar_url, verified, bio, apartment:apartments(number, entrance:entrances(number, building:buildings(number)))')
        .eq('id', user.id)
        .maybeSingle();
    return row == null ? null : Map<String, dynamic>.from(row);
  }

  Future<void> updateProfile(
      {required String fullName, required String phone}) async {
    if (!isConfigured) return;
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('Требуется авторизация');
    await _client.from('profiles').update({
      'full_name': fullName.trim(),
      'phone': phone.trim(),
    }).eq('id', user.id);
  }

  Future<String> _signedMediaUrl(String? path) async {
    if (path == null || path.isEmpty || path.startsWith('http')) {
      return path ?? '';
    }
    final result =
        await _client.storage.from('house-media').createSignedUrl(path, 3600);
    return result;
  }

  Future<List<Post>> loadPosts() async {
    final rows = await _client
        .from('posts')
        .select(
            '*, author:profiles(id, full_name, avatar_url, role, verified), attachments:post_attachments(*), poll:polls(*, options:poll_options(*)), initiative:initiatives(*), fundraiser:fundraisers(*)')
        .order('created_at', ascending: false)
        .limit(50);
    final posts = <Post>[];
    for (final row in rows) {
      final data = Map<String, dynamic>.from(row);
      final attachments = (data['attachments'] as List<dynamic>? ?? const [])
          .map((attachment) => Map<String, dynamic>.from(attachment as Map))
          .toList();
      for (final attachment in attachments) {
        attachment['url'] = await _signedMediaUrl(attachment['url'] as String?);
      }
      data['attachments'] = attachments;
      posts.add(Post.fromMap(data));
    }
    return posts;
  }

  Future<List<Map<String, dynamic>>> loadChats() async {
    final rows = await _client
        .from('chats')
        .select('*')
        .order('last_message_at', ascending: false, nullsFirst: false)
        .limit(100);
    return Future.wait(rows.map((row) async {
      final item = Map<String, dynamic>.from(row);
      if (item['type'] == 'image' || item['type'] == 'document') {
        item['content'] = await _signedMediaUrl(item['content'] as String?);
      }
      return item;
    }));
  }

  Future<List<Map<String, dynamic>>> loadMessages(String chatId) async {
    final rows = await _client
        .from('messages')
        .select('*, sender:profiles(full_name, avatar_url, role)')
        .eq('chat_id', chatId)
        .order('created_at', ascending: true)
        .limit(100);
    return rows.map((row) => Map<String, dynamic>.from(row)).toList();
  }

  Future<List<Map<String, dynamic>>> loadClassifieds() async {
    final rows = await _client
        .from('classifieds')
        .select('*, author:profiles(full_name, phone)')
        .order('created_at', ascending: false)
        .limit(50);
    return Future.wait(rows.map((row) async {
      final item = Map<String, dynamic>.from(row);
      final author = item['author'] is Map
          ? Map<String, dynamic>.from(item['author'])
          : <String, dynamic>{};
      final price = item['price'];
      item['price_label'] = price == null
          ? 'Договорная'
          : '${(price as num).toStringAsFixed(0)} ${item['currency'] == 'KZT' ? '₸' : item['currency']}';
      item['author_name'] = author['full_name'] ?? 'Житель ЖК';
      item['author_phone'] = author['phone'] ?? '';
      item['image_path'] = await _signedMediaUrl(item['image_path'] as String?);
      return item;
    }));
  }

  Future<void> vote(String pollId, String optionId) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('Требуется авторизация');
    await _client.from('poll_votes').insert({
      'poll_id': pollId,
      'option_id': optionId,
      'user_id': user.id,
    });
  }

  Future<void> sendMessage(String chatId, String content) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('Требуется авторизация');
    await _client.from('messages').insert({
      'chat_id': chatId,
      'sender_id': user.id,
      'content': content,
      'type': 'text',
    });
  }

  Future<void> sendAttachment({
    required String chatId,
    required String fileName,
    required List<int> bytes,
    required String mimeType,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('Требуется авторизация');
    if (bytes.length > maxUploadBytes) {
      throw Exception('Размер файла не должен превышать 10 МБ');
    }
    if (!allowedUploadExtensions.contains(fileName.split('.').last.toLowerCase())) {
      throw Exception('Поддерживаются только JPG, PNG, WEBP и PDF');
    }
    final normalizedMimeType = mimeType.toLowerCase();
    if (!const {'image/jpeg', 'image/png', 'image/webp', 'application/pdf'}
        .contains(normalizedMimeType)) {
      throw Exception('Неподдерживаемый тип файла');
    }
    final safeName = fileName.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_');
    final path =
        '${user.id}/chats/$chatId/${DateTime.now().millisecondsSinceEpoch}_$safeName';
    await _client.storage
        .from('house-media')
        .uploadBinary(
          path,
          Uint8List.fromList(bytes),
          fileOptions: FileOptions(contentType: normalizedMimeType, upsert: false),
        );
    await _client.from('messages').insert({
      'chat_id': chatId,
      'sender_id': user.id,
      'content': path,
      'type': normalizedMimeType.startsWith('image/') ? 'image' : 'document',
    });
  }

  Future<List<Map<String, dynamic>>> loadNotifications() async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('Требуется авторизация');
    final rows = await _client
        .from('notifications')
        .select('id, type, title, body, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', ascending: false)
        .limit(50);
    return rows.map((row) => Map<String, dynamic>.from(row)).toList();
  }

  Future<void> markNotificationRead(String notificationId) async {
    await _client
        .from('notifications')
        .update({'is_read': true}).eq('id', notificationId);
  }

  Future<void> createClassified({
    required String title,
    required String category,
    required String description,
    String? price,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('Требуется авторизация');
    final profile = await loadProfile();
    final complexId = profile?['complex_id'];
    if (complexId == null) throw Exception('Профиль ещё не привязан к ЖК');
    await _client.from('classifieds').insert({
      'author_id': user.id,
      'complex_id': complexId,
      'title': title.trim(),
      'category': category,
      'description': description.trim(),
      'price': price == null || price.trim().isEmpty
          ? null
          : num.tryParse(price.trim()),
      'currency': 'KZT',
    });
  }
}
