import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_styles.dart';

/// Noir Mint — ONLY black, white, and light green.
/// Dark mode is the default product look.
class AppTheme {
  // Accent = light green only
  static const Color brand = AppStyles.green; // #8CFF9A
  static const Color brandDeep = AppStyles.greenDeep; // #3DDC84
  static const Color accent = AppStyles.green;

  // Legacy aliases mapped to green so old call sites stay green (no purple/blue)
  static const Color rose = AppStyles.green;
  static const Color coral = AppStyles.greenDeep;
  static const Color amber = AppStyles.green;
  static const Color teal = AppStyles.greenDeep;
  static const Color sky = AppStyles.green;
  static const Color mint = AppStyles.green;
  static const Color pink = AppStyles.green;

  // Light surfaces (rarely used — app defaults dark)
  static const Color ink = AppStyles.black;
  static const Color muted = Color(0xFF6B7A6E);
  static const Color surface = AppStyles.white;
  static const Color border = Color(0xFFD4DED6);
  static const Color background = Color(0xFFF2F6F3);
  static const Color field = Color(0xFFEAF2EC);

  // Dark surfaces
  static const Color darkInk = AppStyles.white;
  static const Color darkMuted = AppStyles.whiteMuted;
  static const Color darkCard = AppStyles.blackCard;
  static const Color darkField = AppStyles.blackSoft;
  static const Color darkBorder = AppStyles.border;
  static const Color darkBg = AppStyles.black;

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: background,
      colorScheme: const ColorScheme.light(
        primary: brandDeep,
        onPrimary: Colors.white,
        secondary: brand,
        surface: surface,
        onSurface: ink,
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: background,
        foregroundColor: ink,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(style: AppStyles.primaryButton()),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: brandDeep,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        indicatorColor: brand.withValues(alpha: 0.25),
        height: 70,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: field,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: brandDeep, width: 1.5),
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    const textTheme = TextTheme(
      headlineLarge: TextStyle(
        fontSize: 34,
        fontWeight: FontWeight.w800,
        color: darkInk,
        letterSpacing: -1.1,
      ),
      headlineSmall: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: darkInk,
      ),
      titleLarge: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w700,
        color: darkInk,
      ),
      titleMedium: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: darkInk,
      ),
      bodyLarge: TextStyle(fontSize: 15, height: 1.5, color: darkInk),
      bodyMedium: TextStyle(fontSize: 14, height: 1.4, color: darkMuted),
      bodySmall: TextStyle(fontSize: 12, color: darkMuted),
      labelLarge: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        color: AppStyles.black,
      ),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkBg,
      colorScheme: const ColorScheme.dark(
        primary: brand,
        onPrimary: AppStyles.black,
        secondary: brandDeep,
        surface: darkCard,
        onSurface: darkInk,
        error: Color(0xFFFF6B6B),
      ),
      textTheme: textTheme,
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: darkBg,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        foregroundColor: darkInk,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        titleTextStyle: TextStyle(
          color: darkInk,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        color: darkCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: darkBorder),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: darkField,
        selectedColor: brand.withValues(alpha: 0.22),
        side: const BorderSide(color: darkBorder),
        labelStyle: const TextStyle(color: darkInk, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: brand,
          foregroundColor: AppStyles.black,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: brand,
          foregroundColor: AppStyles.black,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: brand,
          side: BorderSide(color: brand.withValues(alpha: 0.45)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: brand),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: brand,
        foregroundColor: AppStyles.black,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: darkCard,
        elevation: 0,
        height: 70,
        indicatorColor: brand.withValues(alpha: 0.2),
        labelTextStyle: WidgetStateProperty.resolveWith((s) {
          final sel = s.contains(WidgetState.selected);
          return TextStyle(
            fontSize: 11,
            fontWeight: sel ? FontWeight.w700 : FontWeight.w500,
            color: sel ? brand : darkMuted,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((s) {
          final sel = s.contains(WidgetState.selected);
          return IconThemeData(size: 24, color: sel ? brand : darkMuted);
        }),
      ),
      tabBarTheme: const TabBarThemeData(
        labelColor: brand,
        unselectedLabelColor: darkMuted,
        indicatorColor: brand,
        dividerColor: darkBorder,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: darkCard,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: darkCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        titleTextStyle: const TextStyle(
          color: darkInk,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: darkField,
        contentTextStyle: const TextStyle(color: darkInk),
        actionTextColor: brand,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      listTileTheme: const ListTileThemeData(
        textColor: darkInk,
        iconColor: brand,
        subtitleTextStyle: TextStyle(color: darkMuted),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: brand,
        circularTrackColor: darkField,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.all(darkInk),
        trackColor: WidgetStateProperty.resolveWith((s) {
          if (s.contains(WidgetState.selected)) return brand;
          return darkField;
        }),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkField,
        hintStyle: const TextStyle(color: darkMuted),
        labelStyle: const TextStyle(color: darkMuted),
        prefixIconColor: brand,
        suffixIconColor: darkMuted,
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: brand, width: 1.6),
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: darkBorder),
        ),
      ),
      dividerTheme: const DividerThemeData(color: darkBorder, thickness: 0.8),
      popupMenuTheme: const PopupMenuThemeData(
        color: darkCard,
        textStyle: TextStyle(color: darkInk),
      ),
    );
  }
}
