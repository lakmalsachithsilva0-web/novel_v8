import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_styles.dart';

/// Dark purple theme matching Novara / Explore reference UI.
/// Prefer [AppStyles.colors] in widgets for adaptive surfaces.
class AppTheme {
  static const Color brand = AppStyles.purple;
  static const Color brandDeep = AppStyles.purpleDeep;
  static const Color accent = AppStyles.purpleBright;
  static const Color rose = AppStyles.purpleBright;
  static const Color coral = AppStyles.purple;
  static const Color amber = Color(0xFFFBBF24);
  static const Color teal = AppStyles.purple;
  static const Color sky = AppStyles.purpleBright;
  static const Color mint = AppStyles.purpleBright;
  static const Color pink = AppStyles.purpleBright;

  static const Color ink = AppStyles.black;
  static const Color muted = Color(0xFF8B8099);
  static const Color surface = Colors.white;
  static const Color border = Color(0xFFE8E0F0);
  static const Color background = Color(0xFFF6F2FF);
  static const Color field = Color(0xFFF0EBFA);

  static const Color darkInk = AppStyles.white;
  static const Color darkMuted = AppStyles.whiteMuted;
  static const Color darkCard = AppStyles.blackCard;
  static const Color darkField = AppStyles.blackSoft;
  static const Color darkBorder = AppStyles.border;
  static const Color darkBg = AppStyles.black;

  static ThemeData get lightTheme {
    final base = ColorScheme.light(
      primary: brandDeep,
      onPrimary: Colors.white,
      secondary: brand,
      onSecondary: Colors.white,
      surface: surface,
      onSurface: ink,
      error: AppStyles.danger,
      onError: Colors.white,
    );
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: background,
      colorScheme: base,
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
        systemOverlayStyle: SystemUiOverlayStyle.dark,
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppStyles.radiusMd),
          side: const BorderSide(color: border),
        ),
      ),
      elevatedButtonTheme:
          ElevatedButtonThemeData(style: AppStyles.primaryButton()),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: brand,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppStyles.radiusMd),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: brandDeep,
          side: BorderSide(color: brand.withValues(alpha: 0.4)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppStyles.radiusMd),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: field,
        hintStyle: const TextStyle(color: muted),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: brand, width: 1.6),
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: border),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        indicatorColor: brand.withValues(alpha: 0.18),
        height: 70,
        labelTextStyle: WidgetStateProperty.resolveWith((s) {
          final sel = s.contains(WidgetState.selected);
          return TextStyle(
            fontSize: 11,
            fontWeight: sel ? FontWeight.w700 : FontWeight.w500,
            color: sel ? brandDeep : muted,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((s) {
          final sel = s.contains(WidgetState.selected);
          return IconThemeData(size: 24, color: sel ? brandDeep : muted);
        }),
      ),
      tabBarTheme: const TabBarThemeData(
        labelColor: brandDeep,
        unselectedLabelColor: muted,
        indicatorColor: brand,
      ),
      dividerTheme: const DividerThemeData(color: border, thickness: 0.8),
      dialogTheme: DialogThemeData(
        backgroundColor: surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: ink,
        contentTextStyle: const TextStyle(color: Colors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      listTileTheme: const ListTileThemeData(
        textColor: ink,
        iconColor: brandDeep,
      ),
    );
  }

  static ThemeData get darkTheme {
    final scheme = ColorScheme.dark(
      primary: brand,
      onPrimary: Colors.white,
      secondary: brandBrightCompat,
      onSecondary: darkBg,
      surface: darkCard,
      onSurface: darkInk,
      error: AppStyles.danger,
      onError: Colors.white,
      surfaceContainerHighest: darkField,
    );
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkBg,
      colorScheme: scheme,
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: darkBg,
        foregroundColor: darkInk,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),
      cardTheme: CardThemeData(
        color: darkCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppStyles.radiusMd),
          side: const BorderSide(color: darkBorder),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: darkField,
        selectedColor: brand.withValues(alpha: 0.28),
        side: const BorderSide(color: darkBorder),
        labelStyle:
            const TextStyle(color: darkInk, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: brand,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: brand,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: brandBrightCompat,
          side: BorderSide(color: brand.withValues(alpha: 0.45)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: brandBrightCompat),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: brand,
        foregroundColor: Colors.white,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: darkCard,
        elevation: 0,
        height: 70,
        indicatorColor: brand.withValues(alpha: 0.22),
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
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkField,
        hintStyle: const TextStyle(color: darkMuted),
        labelStyle: const TextStyle(color: darkMuted),
        prefixIconColor: brand,
        suffixIconColor: darkMuted,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
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

const Color brandBrightCompat = Color(0xFFA78BFA);
