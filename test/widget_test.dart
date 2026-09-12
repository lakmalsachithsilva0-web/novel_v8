import 'package:flutter_test/flutter_test.dart';

import 'package:novel_mobile_app/main.dart';
import 'package:novel_mobile_app/ui/screens/hashtag_detail_screen.dart';
import 'package:novel_mobile_app/ui/screens/write_screen.dart';

void main() {
  testWidgets('starts on the login page', (WidgetTester tester) async {
    await tester.pumpWidget(const InkittCloneApp());
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('Welcome Back!'), findsOneWidget);
  });

  test(
    'story with mixed draft and published chapters appears in both write tabs',
    () {
      final story = <String, dynamic>{
        'id': 42,
        'title': 'Mixed story',
        'status_text': 'Ongoing',
        'published_chapter_count': 2,
        'draft_chapter_count': 1,
      };

      expect(storyMatchesWriteTab(story, 0), isTrue);
      expect(storyMatchesWriteTab(story, 1), isTrue);
    },
  );

  test('hashtag cover prefers admin tag artwork when available', () {
    final tagMeta = <String, dynamic>{
      'name': 'romance',
      'cover_path': '/uploads/tag-cover.jpg',
      'description': 'Popular romance stories',
    };
    final books = [
      <String, dynamic>{'cover_path': '/uploads/book-cover.jpg'},
    ];

    expect(
      HashtagDetailScreen.resolveTagCover(tagMeta, books),
      '/uploads/tag-cover.jpg',
    );
  });

  test(
    'hashtag cover falls back to first story cover when tag book art is empty',
    () {
      final tagMeta = <String, dynamic>{'name': 'romance', 'cover_path': ''};
      final books = [
        <String, dynamic>{'cover_path': '/uploads/fallback-book.jpg'},
      ];

      expect(
        HashtagDetailScreen.resolveTagCover(tagMeta, books),
        '/uploads/fallback-book.jpg',
      );
    },
  );
}
