import 'package:flutter/material.dart';

/// Simple breakpoints for Android phones / large phones / tablets.
class AppBreakpoints {
  static const double phone = 480;
  static const double largePhone = 600;
  static const double tablet = 840;

  static bool isPhone(BuildContext context) =>
      MediaQuery.sizeOf(context).width < phone;

  static bool isLargePhone(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    return w >= phone && w < tablet;
  }

  static bool isTablet(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= tablet;

  /// Horizontal page padding that scales with width.
  static double pagePadding(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    if (w >= tablet) return 28;
    if (w >= largePhone) return 20;
    return 16;
  }

  /// Story card width for horizontal rails.
  static double storyCardWidth(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    if (w >= tablet) return 140;
    if (w >= largePhone) return 120;
    return 110;
  }

  /// Cover height on hashtag / story detail heroes.
  static double heroCoverHeight(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    if (w >= tablet) return 260;
    if (w >= largePhone) return 220;
    return 200;
  }
}
