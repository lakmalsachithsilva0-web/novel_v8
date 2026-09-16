import 'package:flutter/material.dart';

/// Novara / Explore reference palette (dark purple).
/// Use [AppStyles.colors] for theme-aware surfaces/text so dark & light stay consistent.
class AppStyles {
  AppStyles._();

  // ── Brand (same in light & dark) ──────────────────────────────────────────
  static const Color black = Color(0xFF0B0A12);
  static const Color blackElevated = Color(0xFF12101A);
  static const Color blackCard = Color(0xFF1A1625);
  static const Color blackSoft = Color(0xFF221C30);
  static const Color white = Color(0xFFF5F3FF);
  static const Color whiteMuted = Color(0xFFA89BB8);
  static const Color purple = Color(0xFF8B5CF6);
  static const Color purpleBright = Color(0xFFA78BFA);
  static const Color purpleDeep = Color(0xFF7C3AED);
  static const Color purpleDim = Color(0xFF2A1F3D);
  static const Color border = Color(0xFF2E2640);
  static const Color danger = Color(0xFFFF6B6B);

  // Light companions
  static const Color lightBg = Color(0xFFF6F2FF);
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightField = Color(0xFFF0EBFA);
  static const Color lightBorder = Color(0xFFE8E0F0);
  static const Color lightText = Color(0xFF231F20);
  static const Color lightMuted = Color(0xFF8B8099);

  // Aliases used by older call sites
  static const Color green = purple;
  static const Color greenDeep = purpleDeep;
  static const Color greenDim = purpleDim;

  static const double radiusSm = 10;
  static const double radiusMd = 16;
  static const double radiusLg = 22;
  static const double radiusPill = 28;

  static const Duration animFast = Duration(milliseconds: 200);
  static const Duration animNormal = Duration(milliseconds: 320);
  static const Duration animSlow = Duration(milliseconds: 480);
  static const Curve animCurve = Curves.easeOutCubic;

  /// Theme-aware bundle — prefer this over hardcoded Colors.white / light hex.
  static AppColorBundle colors(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return dark ? AppColorBundle.dark : AppColorBundle.light;
  }

  static bool isDark(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark;

  static BoxDecoration cardDark({bool glow = false}) => BoxDecoration(
        color: blackCard,
        borderRadius: BorderRadius.circular(radiusMd),
        border: Border.all(color: border),
        boxShadow: glow
            ? [
                BoxShadow(
                  color: purple.withValues(alpha: 0.22),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ]
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.35),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
      );

  static BoxDecoration card(BuildContext context, {bool glow = false}) {
    final c = colors(context);
    return BoxDecoration(
      color: c.card,
      borderRadius: BorderRadius.circular(radiusMd),
      border: Border.all(color: c.border),
      boxShadow: glow
          ? [
              BoxShadow(
                color: purple.withValues(alpha: 0.2),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ]
          : [
              BoxShadow(
                color: Colors.black.withValues(alpha: c.isDark ? 0.35 : 0.06),
                blurRadius: 14,
                offset: const Offset(0, 4),
              ),
            ],
    );
  }

  static LinearGradient purpleGradient() => const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [purpleDeep, purpleBright],
      );

  static LinearGradient heroGradient(BuildContext context) {
    final dark = isDark(context);
    return LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: dark
          ? const [Color(0xFF3B2A6B), Color(0xFF1A1228)]
          : const [Color(0xFF6C3CE1), Color(0xFF9B6DFF)],
    );
  }

  static ButtonStyle primaryButton() => ElevatedButton.styleFrom(
        backgroundColor: purple,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
        ),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
      );
}

/// Semantic colors that flip with theme brightness.
class AppColorBundle {
  const AppColorBundle({
    required this.isDark,
    required this.bg,
    required this.card,
    required this.elevated,
    required this.field,
    required this.border,
    required this.borderSoft,
    required this.textPrimary,
    required this.textMuted,
    required this.textFaint,
    required this.brand,
    required this.brandSoft,
  });

  final bool isDark;
  final Color bg;
  final Color card;
  final Color elevated;
  final Color field;
  final Color border;
  final Color borderSoft;
  final Color textPrimary;
  final Color textMuted;
  final Color textFaint;
  final Color brand;
  final Color brandSoft;

  static const dark = AppColorBundle(
    isDark: true,
    bg: AppStyles.black,
    card: AppStyles.blackCard,
    elevated: AppStyles.blackElevated,
    field: AppStyles.blackSoft,
    border: AppStyles.border,
    borderSoft: Color(0xFF3A3150),
    textPrimary: AppStyles.white,
    textMuted: AppStyles.whiteMuted,
    textFaint: Color(0xFF7A6F8F),
    brand: AppStyles.purple,
    brandSoft: AppStyles.purpleDim,
  );

  static const light = AppColorBundle(
    isDark: false,
    bg: AppStyles.lightBg,
    card: AppStyles.lightCard,
    elevated: Color(0xFFF3F0FF),
    field: AppStyles.lightField,
    border: AppStyles.lightBorder,
    borderSoft: Color(0xFFEDE9FE),
    textPrimary: AppStyles.lightText,
    textMuted: AppStyles.lightMuted,
    textFaint: Color(0xFF9A9A9A),
    brand: Color(0xFF6C3CE1),
    brandSoft: Color(0xFFF3EEFF),
  );
}
