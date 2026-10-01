import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../data/models/app_bootstrap.dart';

/// Inkitt-style Achievements screen: badge groups with progress.
class AchievementsScreen extends StatelessWidget {
  const AchievementsScreen({
    super.key,
    required this.achievements,
    this.profile,
  });

  final List<AchievementGroupModel> achievements;
  final ProfileModel? profile;

  @override
  Widget build(BuildContext context) {
    final groups = achievements.isNotEmpty ? achievements : _fallbackGroups();

    return Scaffold(
      backgroundColor: AppTheme.bgOf(context),
      appBar: AppBar(
        title: const Text('Achievements'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppTheme.bgOf(context),
        foregroundColor: AppTheme.inkOf(context),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          if (profile != null) ...[
            _summaryRow(context, profile!),
            const SizedBox(height: 20),
          ],
          for (final group in groups) ...[
            Text(
              group.groupName,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.inkOf(context),
              ),
            ),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: group.items.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.05,
              ),
              itemBuilder: (context, i) {
                final a = group.items[i];
                return _BadgeCard(item: a);
              },
            ),
            const SizedBox(height: 24),
          ],
        ],
      ),
    );
  }

  Widget _summaryRow(BuildContext context, ProfileModel p) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceOf(context),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderOf(context)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _miniStat(context, '${p.chaptersRead}', 'Chapters'),
          _miniStat(context, '${p.dayStreak}', 'Day streak'),
          _miniStat(context, '${p.socialKarma}', 'Karma'),
        ],
      ),
    );
  }

  Widget _miniStat(BuildContext context, String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppTheme.brand,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(fontSize: 12, color: AppTheme.mutedOf(context)),
        ),
      ],
    );
  }

  List<AchievementGroupModel> _fallbackGroups() {
    return const [
      AchievementGroupModel(
        groupName: 'Reading',
        items: [
          AchievementItemModel(
            title: 'First Chapter',
            subtitle: 'Read your first chapter',
            progressLabel: '1/1',
            badgeValue: '✓',
            style: 'unlocked',
          ),
          AchievementItemModel(
            title: 'Night Owl',
            subtitle: 'Read after midnight',
            progressLabel: '0/1',
            badgeValue: '🦉',
            style: 'locked',
          ),
          AchievementItemModel(
            title: 'Streak Starter',
            subtitle: '3-day reading streak',
            progressLabel: '1/3',
            badgeValue: '🔥',
            style: 'progress',
          ),
          AchievementItemModel(
            title: 'Page Turner',
            subtitle: 'Read 50 chapters',
            progressLabel: '12/50',
            badgeValue: '📖',
            style: 'progress',
          ),
        ],
      ),
      AchievementGroupModel(
        groupName: 'Social',
        items: [
          AchievementItemModel(
            title: 'First Follow',
            subtitle: 'Follow an author',
            progressLabel: '0/1',
            badgeValue: '👤',
            style: 'locked',
          ),
          AchievementItemModel(
            title: 'Reviewer',
            subtitle: 'Leave 5 reviews',
            progressLabel: '0/5',
            badgeValue: '⭐',
            style: 'locked',
          ),
        ],
      ),
    ];
  }
}

class _BadgeCard extends StatelessWidget {
  const _BadgeCard({required this.item});

  final AchievementItemModel item;

  @override
  Widget build(BuildContext context) {
    final unlocked = item.style == 'unlocked' || item.badgeValue == '✓';
    final inProgress = item.style == 'progress';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: unlocked
            ? AppTheme.brand.withValues(alpha: 0.12)
            : AppTheme.surfaceOf(context),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: unlocked
              ? AppTheme.brand.withValues(alpha: 0.35)
              : AppTheme.borderOf(context),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: unlocked
                      ? AppTheme.brand.withValues(alpha: 0.15)
                      : AppTheme.bgOf(context),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: unlocked
                        ? AppTheme.brand
                        : AppTheme.borderOf(context),
                  ),
                ),
                child: Text(
                  item.badgeValue.length <= 2
                      ? item.badgeValue
                      : item.badgeValue[0],
                  style: TextStyle(
                    fontSize: unlocked || inProgress ? 18 : 14,
                    color: unlocked
                        ? AppTheme.brand
                        : AppTheme.mutedOf(context),
                  ),
                ),
              ),
              const Spacer(),
              if (item.progressLabel.isNotEmpty)
                Text(
                  item.progressLabel,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: unlocked
                        ? AppTheme.brand
                        : AppTheme.mutedOf(context),
                  ),
                ),
            ],
          ),
          const Spacer(),
          Text(
            item.title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: AppTheme.inkOf(context),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            item.subtitle,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 11,
              color: AppTheme.mutedOf(context),
              height: 1.25,
            ),
          ),
        ],
      ),
    );
  }
}
