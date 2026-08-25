import 'package:flutter_test/flutter_test.dart';
import 'package:housesm_mobile/features/feed/models/post.dart';

void main() {
  group('PostType', () {
    test('label mapping', () {
      expect(PostType.post.label, 'Публикация');
      expect(PostType.poll.label, 'Опрос');
      expect(PostType.officialPoll.label, 'Официальный опрос');
      expect(PostType.fundraiser.label, 'Сбор');
    });

    test('apiValue', () {
      expect(PostType.officialPoll.apiValue, 'official_poll');
      expect(PostType.announcement.apiValue, 'announcement');
    });
  });

  group('InitiativeStage', () {
    test('hoaReview label', () {
      expect(InitiativeStage.hoaReview.label, 'На рассмотрении у ОСИ');
    });
  });

  group('MockPosts', () {
    test('returns 4 posts with correct territories', () {
      final posts = mockPosts();
      expect(posts.length, 4);
      expect(posts[0].territory, Territory.complex);
      expect(posts[2].territory, Territory.entrance);
      expect(posts[1].poll, isNotNull);
      expect(posts[1].poll!.options.length, 3);
      expect(posts[3].fundraiser, isNotNull);
      expect(posts[3].fundraiser!.progress, greaterThan(0));
    });

    test('fundraiser progress clamped', () {
      final f = Fundraiser(id: '1', targetAmount: 100, currentAmount: 150);
      expect(f.progress, 1.0);
    });
  });

  group('Author', () {
    test('initials', () {
      const a = Author(id: '1', fullName: 'Мария Иванова');
      expect(a.initials, 'МИ');
      const b = Author(id: '2', fullName: 'ОСИ «Солнечный»');
      expect(b.initials, 'О«');
    });
  });
}
