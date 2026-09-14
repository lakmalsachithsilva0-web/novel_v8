import 'package:flutter/material.dart';

import 'core/theme/app_theme.dart';
import 'core/theme/theme_controller.dart';
import 'ui/screens/root_shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ThemeController.instance.load();
  runApp(const InkittCloneApp());
}

class InkittCloneApp extends StatelessWidget {
  const InkittCloneApp({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: ThemeController.instance,
      builder: (context, _) {
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Novel Mobile App',
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: ThemeController.instance.mode,
          home: const RootShell(),
        );
      },
    );
  }
}
