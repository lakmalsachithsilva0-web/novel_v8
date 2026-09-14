import 'package:flutter/material.dart';

/// Shared Noir Mint design tokens — import in any screen for consistent UI.
/// Default experience is dark: deep black surfaces, white text, light green accent.
class AppStyles {
  AppStyles._();

  // Palette
  static const Color black = Color(0xFF0A0A0B);
  static const Color blackElevated = Color(0xFF141416);
  static const Color blackCard = Color(0xFF1A1A1E);
  static const Color blackSoft = Color(0xFF222228);
  static const Color white = Color(0xFFF5F7F5);
  static const Color whiteMuted = Color(0xFFB8C0B8);
  static const Color green = Color(0xFF8CFF9A);
  static const Color greenDeep = Color(0xFF3DDC84);
  static const Color greenDim = Color(0xFF1F3D2A);
  static const Color border = Color(0xFF2A2F2A);
  static const Color danger = Color(0xFFFF6B6B);

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
                  color: green.withValues(alpha: 0.18),
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

  static BoxDecoration pillGreen() => BoxDecoration(
        color: greenDim,
        borderRadius: BorderRadius.circular(radiusPill),
        border: Border.all(color: green.withValues(alpha: 0.35)),
      );

  static LinearGradient greenGradient() => const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [greenDeep, green],
      );

  static TextStyle title({Color? color, double size = 18}) => TextStyle(
        color: color ?? white,
        fontSize: size,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.3,
      );

  static TextStyle body({Color? color, double size = 14}) => TextStyle(
        color: color ?? whiteMuted,
        fontSize: size,
        height: 1.4,
      );

  static ButtonStyle primaryButton() => ElevatedButton.styleFrom(
        backgroundColor: green,
        foregroundColor: black,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
        ),
        textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
      );
}
