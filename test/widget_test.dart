import 'package:flutter_test/flutter_test.dart';

import 'package:novel_mobile_app/main.dart';

void main() {
  testWidgets('starts on the login page', (WidgetTester tester) async {
    await tester.pumpWidget(const InkittCloneApp());
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('Welcome Back!'), findsOneWidget);
  });
}
