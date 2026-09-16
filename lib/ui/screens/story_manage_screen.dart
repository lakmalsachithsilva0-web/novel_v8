import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../data/services/api_service.dart';
import 'create_story_screen.dart';
import 'edit_chapter_screen.dart';
import 'chapter_reader_screen.dart';

/// Inkitt-style Manage Stories detail:
/// open one story → full chapter list → edit / delete / add / schedule.
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
    final raw = (c['submission_status'] ?? 'draft').toString().toLowerCase().trim();
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

  @override
  Widget build(BuildContext context) {
    final title = _story['title']?.toString() ?? 'Untitled';
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
          IconButton(
            tooltip: 'Edit details',
            icon: const Icon(Icons.edit_outlined),
            onPressed: _editDetails,
          ),
          PopupMenuButton<String>(
            onSelected: (v) {
              if (v == 'details') _editDetails();
              if (v == 'ongoing') _changeStoryStatus('Ongoing');
              if (v == 'completed') _changeStoryStatus('Completed');
              if (v == 'draft') _changeStoryStatus('Draft');
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'details', child: Text('Edit details')),
              if (_isDraftStory)
                const PopupMenuItem(
                  value: 'ongoing',
                  child: Text('Publish as Ongoing'),
                ),
              if (!_isDraftStory)
                const PopupMenuItem(
                  value: 'completed',
                  child: Text('Mark Completed'),
                ),
              if (!_isDraftStory)
                const PopupMenuItem(
                  value: 'draft',
                  child: Text('Move to Draft'),
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
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                    children: [
                      // Story header
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    title,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
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
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: _isDraftStory
                                          ? const Color(0xFFB45309)
                                          : const Color(0xFF047857),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${_chapters.length} chapter${_chapters.length == 1 ? '' : 's'}',
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppTheme.muted,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                OutlinedButton.icon(
                                  onPressed: _editDetails,
                                  icon: const Icon(Icons.settings_outlined, size: 18),
                                  label: const Text('Edit details'),
                                ),
                                if (_isDraftStory)
                                  FilledButton.icon(
                                    onPressed: () =>
                                        _changeStoryStatus('Ongoing'),
                                    icon: const Icon(Icons.public, size: 18),
                                    label: const Text('Publish story'),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Chapters',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Draft / Published / Scheduled — edit one chapter at a time. Editing details never removes chapters.',
                        style: TextStyle(fontSize: 12, color: AppTheme.muted),
                      ),
                      const SizedBox(height: 12),
                      if (_chapters.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: const Text(
                            'No chapters yet. Tap Add chapter to write the first one.',
                          ),
                        )
                      else
                        ..._chapters.map((c) {
                          final label = _chapterLabel(c);
                          final words = _wordCount(c);
                          final num = (c['chapter_number'] as num?)?.toInt() ?? 0;
                          final cTitle = (c['title'] ?? 'Chapter $num').toString();
                          return Card(
                            margin: const EdgeInsets.only(bottom: 10),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: const BorderSide(color: AppTheme.border),
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.fromLTRB(
                                12,
                                8,
                                4,
                                8,
                              ),
                              leading: CircleAvatar(
                                radius: 18,
                                backgroundColor: AppTheme.background,
                                child: Text(
                                  '$num',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                              title: Text(
                                cTitle,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Wrap(
                                  spacing: 8,
                                  runSpacing: 4,
                                  crossAxisAlignment: WrapCrossAlignment.center,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: _chipBg(label),
                                        borderRadius: BorderRadius.circular(6),
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
                          );
                        }),
                    ],
                  ),
                ),
    );
  }
}
