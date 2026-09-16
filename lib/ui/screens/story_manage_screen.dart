import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../data/services/api_service.dart';
import 'create_story_screen.dart';
import 'edit_chapter_screen.dart';
import 'chapter_reader_screen.dart';

/// Inkitt-style Manage Stories detail:
/// open one story → full chapter list → reorder / edit / delete / schedule / submit all.
class StoryManageScreen extends StatefulWidget {
  const StoryManageScreen({
    super.key,
    required this.apiService,
    required this.story,
  });

  final ApiService apiService;
  final Map<String, dynamic> story;

  @override
  State<StoryManageScreen> createState() => _StoryManageScreenState();
}

class _StoryManageScreenState extends State<StoryManageScreen> {
  late Map<String, dynamic> _story;
  List<Map<String, dynamic>> _chapters = const [];
  bool _loading = true;
  bool _reordering = false;
  String? _error;

  int get _storyId => (_story['id'] as num?)?.toInt() ?? 0;

  String get _statusRaw =>
      (_story['status_text'] ?? 'Draft').toString().trim();

  bool get _isDraftStory {
    final s = _statusRaw.toLowerCase();
    return s.isEmpty ||
        s.contains('draft') ||
        s.contains('private') ||
        s.contains('unpublish');
  }

  @override
  void initState() {
    super.initState();
    _story = Map<String, dynamic>.from(widget.story);
    _reload();
  }

  Future<void> _reload() async {
    if (_storyId <= 0) {
      setState(() {
        _loading = false;
        _error = 'Invalid story';
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final latest = await widget.apiService.fetchWriterStory(_storyId);
      final chapters = await widget.apiService.fetchStoryChapters(_storyId);
      if (!mounted) return;
      setState(() {
        if (latest != null) _story = latest;
        _chapters = chapters;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  bool _detailsComplete(Map<String, dynamic> story) {
    final title = story['title']?.toString().trim() ?? '';
    final summary =
        (story['description'] ?? story['summary'])?.toString().trim() ?? '';
    final genre =
        (story['genre'] ?? story['primary_genre'])?.toString().trim() ?? '';
    return title.isNotEmpty && summary.isNotEmpty && genre.isNotEmpty;
  }

  String _chapterLabel(Map<String, dynamic> c) {
    final raw = (c['submission_status'] ?? 'draft')
        .toString()
        .toLowerCase()
        .trim();
    if (raw == 'published' ||
        raw == 'submitted' ||
        raw == 'ongoing' ||
        raw == 'completed') {
      return 'Published';
    }
    if (raw == 'scheduled') return 'Scheduled';
    return 'Draft';
  }

  Color _chipBg(String label) {
    switch (label) {
      case 'Published':
        return const Color(0xFFD1FAE5);
      case 'Scheduled':
        return const Color(0xFFE0E7FF);
      default:
        return const Color(0xFFFEF3C7);
    }
  }

  Color _chipFg(String label) {
    switch (label) {
      case 'Published':
        return const Color(0xFF047857);
      case 'Scheduled':
        return const Color(0xFF3730A3);
      default:
        return const Color(0xFFB45309);
    }
  }

  int _wordCount(Map<String, dynamic> c) {
    return (c['content'] ?? '')
        .toString()
        .trim()
        .split(RegExp(r'\s+'))
        .where((w) => w.isNotEmpty)
        .length;
  }

  Future<void> _editDetails() async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
        builder: (_) => CreateStoryScreen(
          apiService: widget.apiService,
          story: _story,
        ),
      ),
    );
    if (!mounted) return;
    await _reload();
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Details updated — chapters unchanged')),
      );
    }
  }

  Future<void> _addOrEditChapter({Map<String, dynamic>? chapter}) async {
    if (!_detailsComplete(_story)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Complete story details before adding chapters'),
        ),
      );
      return;
    }
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) => EditChapterScreen(
          apiService: widget.apiService,
          storyId: _storyId,
          chapterId: (chapter?['id'] as num?)?.toInt(),
          chapterNumber: (chapter?['chapter_number'] as num?)?.toInt(),
          chapterTitle: chapter?['title']?.toString() ??
              (chapter == null ? 'Chapter ${_chapters.length + 1}' : 'Chapter'),
          initialContent: chapter?['content']?.toString() ?? '',
          createNew: chapter == null,
        ),
      ),
    );
    if (!mounted) return;
    await _reload();
  }

  Future<void> _readChapter(Map<String, dynamic> chapter) async {
    final chapterNumber = (chapter['chapter_number'] as num?)?.toInt() ?? 1;
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) => ChapterReaderScreen(
          apiService: widget.apiService,
          title: _story['title']?.toString() ?? 'Story',
          author: _story['author']?.toString() ?? '',
          coverPath: _story['cover_path']?.toString() ?? '',
          chapterNumber: chapterNumber,
          chapterTitle:
              chapter['title']?.toString() ?? 'Chapter $chapterNumber',
          chapterContent: chapter['content']?.toString() ?? '',
          bookId: _storyId,
        ),
      ),
    );
  }

  Future<void> _deleteChapter(Map<String, dynamic> chapter) async {
    final id = (chapter['id'] as num?)?.toInt();
    if (id == null) return;
    final title = chapter['title']?.toString() ?? 'this chapter';
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete chapter?'),
        content: Text(
          'Delete "$title" permanently?\n\nOther chapters stay. This cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await widget.apiService.deleteStoryChapter(id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Chapter deleted')),
      );
      await _reload();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not delete: $e')),
      );
    }
  }

  Future<void> _changeStoryStatus(String status) async {
    final confirmMsg = status == 'Ongoing'
        ? 'Readers will see this story. Continue?'
        : status == 'Completed'
            ? 'Mark as finished? Chapters stay available.'
            : 'Unpublish? Story will be hidden from readers. Chapters are kept.';
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Change status'),
        content: Text(confirmMsg),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await widget.apiService.updateWriterStory(_storyId, {
        'status_text': status,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Status → $status')),
      );
      await _reload();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not update status: $e')),
      );
    }
  }

  Future<void> _onReorder(int oldIndex, int newIndex) async {
    if (oldIndex < newIndex) newIndex -= 1;
    final items = List<Map<String, dynamic>>.from(_chapters);
    final item = items.removeAt(oldIndex);
    items.insert(newIndex, item);
    setState(() {
      _chapters = items;
      _reordering = true;
    });
    final ids = items
        .map((c) => (c['id'] as num?)?.toInt() ?? 0)
        .where((id) => id > 0)
        .toList();
    try {
      await widget.apiService.reorderStoryChapters(_storyId, ids);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Chapter order saved')),
      );
      await _reload();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not reorder: $e')),
      );
      await _reload();
    } finally {
      if (mounted) setState(() => _reordering = false);
    }
  }

  Future<void> _submitAllDrafts() async {
    final drafts = _chapters.where((c) {
      final s = (c['submission_status'] ?? 'draft')
          .toString()
          .toLowerCase()
          .trim();
      return s == 'draft' || s.isEmpty;
    }).toList();
    if (drafts.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No draft chapters to submit')),
      );
      return;
    }
    final eligible = drafts.where((c) => _wordCount(c) >= 60).length;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Submit all drafts?'),
        content: Text(
          'Draft chapters: ${drafts.length}\n'
          'Ready (≥60 words): $eligible\n\n'
          'Eligible chapters become Published. '
          'Story stays meta-only (chapters not deleted).',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Submit all'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      final result = await widget.apiService.submitAllStoryChapters(_storyId);
      if (!mounted) return;
      final count = result['submitted_count'] ?? 0;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result['message']?.toString() ??
                'Submitted $count chapter(s) — others unchanged',
          ),
        ),
      );
      await _reload();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Submit all failed: $e')),
      );
    }
  }

  Future<void> _openScheduleManager() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.7,
          minChildSize: 0.4,
          maxChildSize: 0.95,
          builder: (_, scrollController) {
            return _ScheduleManagerSheet(
              apiService: widget.apiService,
              storyId: _storyId,
              chapters: _chapters,
              scrollController: scrollController,
              onChanged: () async {
                await _reload();
              },
            );
          },
        );
      },
    );
    if (mounted) await _reload();
  }

  @override
  Widget build(BuildContext context) {
    final title = _story['title']?.toString() ?? 'Story';
    final statusLabel = _isDraftStory
        ? 'Draft'
        : (_statusRaw.toLowerCase().contains('complete')
            ? 'Completed'
            : 'Ongoing');

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Manage story'),
        actions: [
          if (_reordering)
            const Padding(
              padding: EdgeInsets.only(right: 12),
              child: Center(
                child: SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            ),
          PopupMenuButton<String>(
            onSelected: (v) {
              if (v == 'details') {
                _editDetails();
              } else if (v == 'schedule') {
                _openScheduleManager();
              } else if (v == 'submit_all') {
                _submitAllDrafts();
              } else if (v == 'ongoing') {
                _changeStoryStatus('Ongoing');
              } else if (v == 'completed') {
                _changeStoryStatus('Completed');
              } else if (v == 'draft') {
                _changeStoryStatus('Draft');
              }
            },
            itemBuilder: (_) => [
              const PopupMenuItem(
                value: 'details',
                child: Text('Edit details'),
              ),
              const PopupMenuItem(
                value: 'schedule',
                child: Text('Schedule manager'),
              ),
              const PopupMenuItem(
                value: 'submit_all',
                child: Text('Submit all drafts'),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(
                value: 'ongoing',
                child: Text('Publish story (Ongoing)'),
              ),
              const PopupMenuItem(
                value: 'completed',
                child: Text('Mark Completed'),
              ),
              const PopupMenuItem(
                value: 'draft',
                child: Text('Unpublish (Draft)'),
              ),
            ],
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _addOrEditChapter(),
        icon: const Icon(Icons.add),
        label: const Text('Add chapter'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 12),
                        FilledButton(
                          onPressed: _reload,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _reload,
                  child: CustomScrollView(
                    slivers: [
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                title,
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: _isDraftStory
                                          ? const Color(0xFFFEF3C7)
                                          : const Color(0xFFD1FAE5),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      statusLabel,
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 12,
                                        color: _isDraftStory
                                            ? const Color(0xFFB45309)
                                            : const Color(0xFF047857),
                                      ),
                                    ),
                                  ),
                                  Text(
                                    '${_chapters.length} chapter${_chapters.length == 1 ? '' : 's'}',
                                    style: const TextStyle(
                                      color: AppTheme.muted,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  OutlinedButton.icon(
                                    onPressed: _editDetails,
                                    icon: const Icon(Icons.edit_outlined, size: 18),
                                    label: const Text('Edit details'),
                                  ),
                                  OutlinedButton.icon(
                                    onPressed: _openScheduleManager,
                                    icon: const Icon(Icons.schedule, size: 18),
                                    label: const Text('Schedule'),
                                  ),
                                  OutlinedButton.icon(
                                    onPressed: _submitAllDrafts,
                                    icon: const Icon(Icons.publish_outlined, size: 18),
                                    label: const Text('Submit all'),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'Long-press a chapter to reorder. '
                                'Edit details never removes chapters.',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.muted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      if (_chapters.isEmpty)
                        const SliverFillRemaining(
                          hasScrollBody: false,
                          child: Center(
                            child: Text('No chapters yet — add one'),
                          ),
                        )
                      else
                        SliverReorderableList(
                          itemCount: _chapters.length,
                          onReorder: _onReorder,
                          itemBuilder: (context, index) {
                            final c = _chapters[index];
                            final label = _chapterLabel(c);
                            final words = _wordCount(c);
                            final chTitle = c['title']?.toString() ??
                                'Chapter ${c['chapter_number'] ?? index + 1}';
                            final scheduled =
                                c['scheduled_for']?.toString() ?? '';
                            return ReorderableDelayedDragStartListener(
                              key: ValueKey('ch_${c['id']}_$index'),
                              index: index,
                              child: Card(
                                margin: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 4,
                                ),
                                child: ListTile(
                                  leading: CircleAvatar(
                                    radius: 14,
                                    backgroundColor: AppTheme.surface,
                                    child: Text(
                                      '${index + 1}',
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                  ),
                                  title: Text(
                                    chTitle,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  subtitle: Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Wrap(
                                      spacing: 8,
                                      runSpacing: 4,
                                      crossAxisAlignment:
                                          WrapCrossAlignment.center,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: _chipBg(label),
                                            borderRadius:
                                                BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            label,
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                              color: _chipFg(label),
                                            ),
                                          ),
                                        ),
                                        if (words > 0)
                                          Text(
                                            '$words words',
                                            style: const TextStyle(
                                              fontSize: 11,
                                              color: AppTheme.muted,
                                            ),
                                          ),
                                        if (scheduled.isNotEmpty)
                                          Text(
                                            '⏱ ${scheduled.length > 16 ? scheduled.substring(0, 16) : scheduled}',
                                            style: const TextStyle(
                                              fontSize: 11,
                                              color: Color(0xFF3730A3)
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                  trailing: PopupMenuButton<String>(
                                    onSelected: (v) {
                                      if (v == 'edit') {
                                        _addOrEditChapter(chapter: c);
                                      } else if (v == 'read') {
                                        _readChapter(c);
                                      } else if (v == 'delete') {
                                        _deleteChapter(c);
                                      }
                                    },
                                    itemBuilder: (_) => const [
                                      PopupMenuItem(
                                        value: 'edit',
                                        child: Text('Edit chapter'),
                                      ),
                                      PopupMenuItem(
                                        value: 'read',
                                        child: Text('Read'),
                                      ),
                                      PopupMenuItem(
                                        value: 'delete',
                                        child: Text(
                                          'Delete',
                                          style: TextStyle(color: Colors.red),
                                        ),
                                      ),
                                    ],
                                  ),
                                  onTap: () => _addOrEditChapter(chapter: c),
                                ),
                              ),
                            );
                          },
                        ),
                      const SliverToBoxAdapter(child: SizedBox(height: 88)),
                    ],
                  ),
                ),
    );
  }
}

/// Full schedule manager — set / clear scheduled_for per chapter.
class _ScheduleManagerSheet extends StatefulWidget {
  const _ScheduleManagerSheet({
    required this.apiService,
    required this.storyId,
    required this.chapters,
    required this.scrollController,
    required this.onChanged,
  });

  final ApiService apiService;
  final int storyId;
  final List<Map<String, dynamic>> chapters;
  final ScrollController scrollController;
  final Future<void> Function() onChanged;

  @override
  State<_ScheduleManagerSheet> createState() => _ScheduleManagerSheetState();
}

class _ScheduleManagerSheetState extends State<_ScheduleManagerSheet> {
  late List<Map<String, dynamic>> _items;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _items = List<Map<String, dynamic>>.from(widget.chapters);
  }

  Future<void> _pickSchedule(Map<String, dynamic> chapter) async {
    final id = (chapter['id'] as num?)?.toInt();
    if (id == null) return;
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 365 * 2)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 9, minute: 0),
    );
    if (time == null || !mounted) return;
    final when = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
    setState(() => _busy = true);
    try {
      await widget.apiService.updateStoryChapter(id, {
        'submission_status': 'scheduled',
        'scheduled_for': when.toIso8601String(),
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Scheduled for ${when.toLocal()}')),
      );
      await widget.onChanged();
      if (mounted) {
        setState(() {
          final idx = _items.indexWhere((c) => c['id'] == id);
          if (idx >= 0) {
            _items[idx] = {
              ..._items[idx],
              'submission_status': 'scheduled',
              'scheduled_for': when.toIso8601String(),
            };
          }
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Schedule failed: $e')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _clearSchedule(Map<String, dynamic> chapter) async {
    final id = (chapter['id'] as num?)?.toInt();
    if (id == null) return;
    setState(() => _busy = true);
    try {
      await widget.apiService.updateStoryChapter(id, {
        'submission_status': 'draft',
        'scheduled_for': null,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Schedule cleared — back to Draft')),
      );
      await widget.onChanged();
      if (mounted) {
        setState(() {
          final idx = _items.indexWhere((c) => c['id'] == id);
          if (idx >= 0) {
            _items[idx] = {
              ..._items[idx],
              'submission_status': 'draft',
              'scheduled_for': null,
            };
          }
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Clear failed: $e')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppTheme.background,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
      child: Column(
        children: [
          const SizedBox(height: 8),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade400,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Schedule manager',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                if (_busy)
                  const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Pick a publish time per chapter. Other chapters stay unchanged.',
              style: TextStyle(fontSize: 12, color: AppTheme.muted),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.builder(
              controller: widget.scrollController,
              itemCount: _items.length,
              itemBuilder: (context, index) {
                final c = _items[index];
                final title = c['title']?.toString() ?? 'Chapter ${index + 1}';
                final scheduled = c['scheduled_for']?.toString() ?? '';
                final status = (c['submission_status'] ?? 'draft')
                    .toString()
                    .toLowerCase();
                return ListTile(
                  title: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
                  subtitle: Text(
                    scheduled.isNotEmpty
                        ? 'Scheduled: $scheduled'
                        : (status == 'published' || status == 'submitted'
                            ? 'Already published'
                            : 'Not scheduled'),
                    style: const TextStyle(fontSize: 12),
                  ),
                  trailing: Wrap(
                    spacing: 4,
                    children: [
                      IconButton(
                        tooltip: 'Set schedule',
                        icon: const Icon(Icons.schedule),
                        onPressed: _busy ? null : () => _pickSchedule(c),
                      ),
                      if (scheduled.isNotEmpty)
                        IconButton(
                          tooltip: 'Clear',
                          icon: const Icon(Icons.clear),
                          onPressed: _busy ? null : () => _clearSchedule(c),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
