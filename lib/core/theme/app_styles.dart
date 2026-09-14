import 'package:flutter/material.dart';

/// Novara / Explore reference palette (dark purple).
class AppStyles {
  AppStyles._();

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

  static LinearGradient purpleGradient() => const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [purpleDeep, purpleBright],
      );

  static ButtonStyle primaryButton() => ElevatedButton.styleFrom(
        backgroundColor: purple,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
        ),
        textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
      );
}
