import 'package:flutter/material.dart';

/// Shared motion tokens — UI only, no feature logic.
class AppMotion {
  AppMotion._();

  static const Duration instant = Duration(milliseconds: 120);
  static const Duration fast = Duration(milliseconds: 200);
  static const Duration normal = Duration(milliseconds: 320);
  static const Duration slow = Duration(milliseconds: 480);
  static const Duration page = Duration(milliseconds: 380);

  static const Curve easeOut = Curves.easeOutCubic;
  static const Curve easeInOut = Curves.easeInOutCubic;
  static const Curve springy = Curves.easeOutBack;
  static const Curve emphasized = Curves.easeOutQuart;
}
