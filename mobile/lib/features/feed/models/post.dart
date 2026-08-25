enum PostType {
  post,
  announcement,
  service,
  helpRequest,
  poll,
  initiative,
  event,
  officialNews,
  officialPoll,
  fundraiser,
}

enum Territory { complex, building, entrance }

enum PostStatus { active, closed, archived, underReview }

extension PostTypeLabel on PostType {
  String get label {
    switch (this) {
      case PostType.post:
        return 'Публикация';
      case PostType.announcement:
        return 'Объявление';
      case PostType.service:
        return 'Услуга';
      case PostType.helpRequest:
        return 'Просьба о помощи';
      case PostType.poll:
        return 'Опрос';
      case PostType.initiative:
        return 'Инициатива';
      case PostType.event:
        return 'Событие';
      case PostType.officialNews:
        return 'Официальная новость';
      case PostType.officialPoll:
        return 'Официальный опрос';
      case PostType.fundraiser:
        return 'Сбор';
    }
  }

  String get apiValue {
    switch (this) {
      case PostType.post:
        return 'post';
      case PostType.announcement:
        return 'announcement';
      case PostType.service:
        return 'service';
      case PostType.helpRequest:
        return 'help_request';
      case PostType.poll:
        return 'poll';
      case PostType.initiative:
        return 'initiative';
      case PostType.event:
        return 'event';
      case PostType.officialNews:
        return 'official_news';
      case PostType.officialPoll:
        return 'official_poll';
      case PostType.fundraiser:
        return 'fundraiser';
    }
  }
}

enum InitiativeStage {
  proposal,
  discussion,
  voting,
  hoaReview,
  approved,
  fundraising,
  implementation,
  completed,
  rejected,
}

extension InitiativeStageLabel on InitiativeStage {
  String get label {
    switch (this) {
      case InitiativeStage.proposal:
        return 'Предложение';
      case InitiativeStage.discussion:
        return 'Обсуждение';
      case InitiativeStage.voting:
        return 'Голосование';
      case InitiativeStage.hoaReview:
        return 'На рассмотрении у ОСИ';
      case InitiativeStage.approved:
        return 'Одобрено';
      case InitiativeStage.fundraising:
        return 'Сбор средств';
      case InitiativeStage.implementation:
        return 'Реализация';
      case InitiativeStage.completed:
        return 'Завершено';
      case InitiativeStage.rejected:
        return 'Отклонено';
    }
  }
}

class Author {
  final String id;
  final String fullName;
  final String? avatarUrl;
  final bool verified;
  final bool isOfficial;
  const Author({
    required this.id,
    required this.fullName,
    this.avatarUrl,
    this.verified = false,
    this.isOfficial = false,
  });
  String get initials => fullName.isNotEmpty
      ? fullName.trim().split(' ').map((e) => e[0]).take(2).join().toUpperCase()
      : 'U';
}

class PollOption {
  final String id;
  final String text;
  int votesCount;
  PollOption({required this.id, required this.text, required this.votesCount});
}

class Poll {
  final String id;
  final List<PollOption> options;
  int totalVotes;
  final bool isMultiple;
  final DateTime? endsAt;
  Poll({
    required this.id,
    required this.options,
    required this.totalVotes,
    this.isMultiple = false,
    this.endsAt,
  });
}

class Initiative {
  final String id;
  final InitiativeStage stage;
  final String goal;
  int supporters;
  Initiative({required this.id, required this.stage, required this.goal, required this.supporters});
}

class Fundraiser {
  final String id;
  final int targetAmount;
  int currentAmount;
  final String currency;
  final DateTime? endsAt;
  Fundraiser({
    required this.id,
    required this.targetAmount,
    required this.currentAmount,
    this.currency = '₸',
    this.endsAt,
  });
  double get progress => (currentAmount / targetAmount).clamp(0, 1);
}

class PostAttachment {
  final String id;
  final String url;
  final String type; // image | document
  const PostAttachment({required this.id, required this.url, required this.type});
}

class Post {
  final String id;
  final Author author;
  final PostType type;
  final String? title;
  final String content;
  final Territory territory;
  final bool isOfficial;
  final DateTime createdAt;
  final List<PostAttachment> attachments;
  int reactionsCount;
  int commentsCount;
  final int viewsCount;
  final Poll? poll;
  final Initiative? initiative;
  final Fundraiser? fundraiser;
  final String? price;
  Post({
    required this.id,
    required this.author,
    required this.type,
    this.title,
    required this.content,
    required this.territory,
    this.isOfficial = false,
    required this.createdAt,
    this.attachments = const [],
    this.reactionsCount = 0,
    this.commentsCount = 0,
    this.viewsCount = 0,
    this.poll,
    this.initiative,
    this.fundraiser,
    this.price,
  });
}

// Mock data mirroring src/stores/appStore.ts
List<Post> mockPosts() {
  final now = DateTime.now();
  return [
    Post(
      id: 'post-1',
      author: const Author(
        id: 'user-1',
        fullName: 'Мария Иванова',
        avatarUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        verified: true,
      ),
      type: PostType.post,
      content:
          'Соседи, добрый день!\nКто подскажет, когда будут проводиться работы по благоустройству во дворе?',
      territory: Territory.complex,
      createdAt: now.subtract(const Duration(hours: 2)),
      attachments: const [
        PostAttachment(
          id: 'att-1',
          url:
              'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
          type: 'image',
        ),
      ],
      reactionsCount: 12,
      commentsCount: 8,
      viewsCount: 142,
    ),
    Post(
      id: 'post-2',
      author: const Author(
        id: 'hoa',
        fullName: 'ОСИ «Солнечный»',
        verified: true,
        isOfficial: true,
      ),
      type: PostType.officialPoll,
      title: 'Какой проект благоустройства двора вам больше нравится?',
      content:
          'Голосование до 25 мая. Просим каждого жителя отдать свой голос за лучший проект детской и прогулочной зоны.',
      territory: Territory.complex,
      isOfficial: true,
      createdAt: now.subtract(const Duration(hours: 5)),
      reactionsCount: 24,
      commentsCount: 15,
      viewsCount: 320,
      poll: Poll(
        id: 'poll-1',
        totalVotes: 68,
        options: [
          PollOption(id: 'opt-1', text: 'Проект А: Новая эко-площадка и беседки', votesCount: 42),
          PollOption(id: 'opt-2', text: 'Проект Б: Спортивный воркаут и тренажеры', votesCount: 18),
          PollOption(
            id: 'opt-3',
            text: 'Проект В: Дополнительное озеленение и аллея',
            votesCount: 8,
          ),
        ],
        endsAt: now.add(const Duration(days: 5)),
      ),
    ),
    Post(
      id: 'post-3',
      author: const Author(
        id: 'user-2',
        fullName: 'Алексей Петров',
        avatarUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        verified: true,
      ),
      type: PostType.initiative,
      title: 'Установка камеры видеонаблюдения в подъезде 2',
      content:
          'Предлагаю установить камеру видеонаблюдения в подъезде 2 для безопасности колясок, велосипедов и общего контроля доступа.',
      territory: Territory.entrance,
      createdAt: now.subtract(const Duration(days: 1)),
      reactionsCount: 19,
      commentsCount: 6,
      viewsCount: 89,
      initiative: Initiative(
        id: 'init-1',
        stage: InitiativeStage.hoaReview,
        goal: 'Безопасность и сохранность имущества жителей подъезда 2',
        supporters: 24,
      ),
    ),
    Post(
      id: 'post-4',
      author: const Author(
        id: 'hoa',
        fullName: 'ОСИ «Солнечный»',
        verified: true,
        isOfficial: true,
      ),
      type: PostType.fundraiser,
      title: 'Сбор на благоустройство двора',
      content:
          'Собираем средства на обустройство безопасного покрытия детской площадки и установку парковых фонарей.',
      territory: Territory.complex,
      isOfficial: true,
      createdAt: now.subtract(const Duration(days: 2)),
      reactionsCount: 45,
      commentsCount: 18,
      viewsCount: 512,
      fundraiser: Fundraiser(
        id: 'fund-1',
        targetAmount: 2000000,
        currentAmount: 1250000,
        endsAt: now.add(const Duration(days: 12)),
      ),
    ),
  ];
}
