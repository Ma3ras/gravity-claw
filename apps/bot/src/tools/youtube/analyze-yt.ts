// @ts-nocheck

import { YoutubeTranscript } from 'youtube-transcript';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_DIR = path.join(__dirname, '.cache');
const DEFAULT_CACHE_TTL_SECONDS = 15 * 60;

function extractVideoId(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Please provide a YouTube URL or a video ID.');
  }

  const trimmed = input.trim();
  const bareId = /^[a-zA-Z0-9_-]{11}$/;
  if (bareId.test(trimmed)) {
    return trimmed;
  }

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error('Invalid URL. Expected e.g. https://youtu.be/<id> or https://youtube.com/watch?v=<id>.');
  }

  const host = url.hostname.replace(/^www\./, '');

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    if (id && bareId.test(id)) return id;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    const fromQuery = url.searchParams.get('v');
    if (fromQuery && bareId.test(fromQuery)) return fromQuery;

    const parts = url.pathname.split('/').filter(Boolean);
    const shortsIdx = parts.indexOf('shorts');
    const embedIdx = parts.indexOf('embed');

    if (shortsIdx >= 0 && parts[shortsIdx + 1] && bareId.test(parts[shortsIdx + 1])) {
      return parts[shortsIdx + 1];
    }

    if (embedIdx >= 0 && parts[embedIdx + 1] && bareId.test(parts[embedIdx + 1])) {
      return parts[embedIdx + 1];
    }
  }

  throw new Error('Could not extract a valid YouTube video ID from the input.');
}

function detectYouTubeUrls(text) {
  const value = String(text || '');
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/[^\s)]+|youtu\.be\/[^\s)]+)/gi;
  return Array.from(new Set(value.match(regex) || []));
}

function extractJsonObjectByMarker(html, markers) {
  for (const marker of markers) {
    const markerPos = html.indexOf(marker);
    if (markerPos < 0) continue;

    const jsonStart = markerPos + marker.length;
    const maybeStart = html.indexOf('{', jsonStart);
    if (maybeStart < 0) continue;

    let depth = 0;
    let inString = false;
    let stringQuote = '';
    let escaped = false;

    for (let i = maybeStart; i < html.length; i++) {
      const ch = html[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === stringQuote) {
          inString = false;
          stringQuote = '';
        }
        continue;
      }

      if (ch === '"' || ch === "'") {
        inString = true;
        stringQuote = ch;
        continue;
      }

      if (ch === '{') depth++;
      if (ch === '}') depth--;

      if (depth === 0) {
        const jsonText = html.slice(maybeStart, i + 1);
        try {
          return JSON.parse(jsonText);
        } catch {
          break;
        }
      }
    }
  }

  return null;
}

function printResult(data, { asJson = false } = {}, exitCode = 0) {
  if (asJson) {
    process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
    process.exit(exitCode);
  }

  if (!data || !data.metadata) {
    if (data?.error) {
      process.stdout.write(`# YouTube Research & Analysis Pro\n\n## Error\n- ${data.error}\n`);
      process.exit(exitCode);
    }
    process.stdout.write('# YouTube Research & Analysis Pro\n\n## Error\n- Unknown analyzer error.\n');
    process.exit(exitCode);
  }

  process.stdout.write(`${formatMarkdown(data)}\n`);
  process.exit(exitCode);
}

function parseTimestampToSeconds(ts) {
  const parts = ts.split(':').map((p) => Number(p.trim()));
  if (parts.some((p) => Number.isNaN(p))) return null;

  if (parts.length === 2) {
    return (parts[0] * 60) + parts[1];
  }
  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  }

  return null;
}

function formatSeconds(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

function parseLocalizedNumber(input) {
  if (input === null || input === undefined) return null;
  const str = String(input).trim();
  if (!str) return null;
  const digitsOnly = str.replace(/[^\d]/g, '');
  if (!digitsOnly) return null;
  const num = Number(digitsOnly);
  return Number.isFinite(num) ? num : null;
}

function parseChapterIndex(titleOrLine) {
  const value = String(titleOrLine || '').trim();
  if (!value) return null;
  const patterns = [
    /^(?:chapter|kapitel|punkt|point|teil|section)\s*[:.-]?\s*(\d{1,3})\b/i,
    /^(\d{1,3})[.)]\s+\S+/,
    /^(?:part)\s*(\d{1,3})\b/i
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

function normalizeChapterTitle(rawTitle) {
  const title = String(rawTitle || '').trim();
  if (!title) return '';
  const withoutLabel = title
    .replace(/^(?:chapter|kapitel|punkt|point|teil|section)\s*[:.-]?\s*\d{1,3}\s*[:.-]?\s*/i, '')
    .replace(/^\d{1,3}[.)]\s*/, '')
    .trim();
  return withoutLabel || title;
}

function extractChaptersFromDescription(description) {
  const lines = (description || '').split(/\r?\n/);
  const chapters = [];

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    const tsMatch = trimmed.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
    if (tsMatch) {
      const seconds = parseTimestampToSeconds(tsMatch[1]);
      if (seconds === null) continue;

      let title = trimmed.replace(tsMatch[1], '').replace(/^[-–—:|]\s*/, '').trim();
      if (!title && lines[i + 1]) {
        title = lines[i + 1].trim();
      }
      const chapterIndex = parseChapterIndex(title || trimmed);
      chapters.push({
        explicit_index: chapterIndex ?? null,
        title: normalizeChapterTitle(title || `Chapter ${chapters.length + 1}`),
        raw_title: title || '',
        timestamp: tsMatch[1],
        seconds
      });
      continue;
    }

    const chapterIndex = parseChapterIndex(trimmed);
    if (chapterIndex !== null) {
      chapters.push({
        explicit_index: chapterIndex,
        title: normalizeChapterTitle(trimmed) || trimmed,
        raw_title: trimmed,
        timestamp: null,
        seconds: null
      });
    }
  }

  const unique = [];
  const seen = new Set();
  for (const chapter of chapters) {
    const key = `${chapter.seconds ?? 'na'}:${chapter.title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(chapter);
  }

  const sorted = unique.sort((a, b) => {
    if (a.seconds === null && b.seconds === null) return 0;
    if (a.seconds === null) return 1;
    if (b.seconds === null) return -1;
    return a.seconds - b.seconds;
  });

  return sorted.map((chapter, idx) => ({
    ...chapter,
    chapter_index: idx + 1,
    point_index: chapter.explicit_index ?? null
  }));
}

function htmlDecode(text) {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#10;/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTimeValue(raw) {
  const num = Number(raw || 0);
  if (!Number.isFinite(num)) return 0;
  return num > 10000 ? num / 1000 : num;
}

function mapYoutubeTranscriptRows(rows) {
  return rows
    .map((row) => ({
      text: (row.text || '').trim(),
      start: normalizeTimeValue(row.offset ?? row.start),
      duration: normalizeTimeValue(row.duration)
    }))
    .filter((row) => row.text.length > 0);
}

function pickCaptionTrack(playerResponse) {
  const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!Array.isArray(tracks) || tracks.length === 0) return null;

  const preferred = tracks.find((t) => t.languageCode === 'en' && t.kind !== 'asr')
    || tracks.find((t) => t.languageCode === 'en')
    || tracks.find((t) => t.kind !== 'asr')
    || tracks[0];

  if (!preferred?.baseUrl) return null;
  return {
    baseUrl: preferred.baseUrl,
    language: preferred.languageCode || null,
    auto_generated: preferred.kind === 'asr'
  };
}

async function fetchTranscriptWithFallback(videoUrl, playerResponse) {
  let transcriptError = null;

  try {
    const rows = await YoutubeTranscript.fetchTranscript(videoUrl);
    const mapped = mapYoutubeTranscriptRows(Array.isArray(rows) ? rows : []);
    if (mapped.length > 0) {
      return {
        transcript: mapped,
        transcript_error: null,
        transcript_source: {
          provider: 'youtube-transcript',
          language: null,
          auto_generated: null
        }
      };
    }
    transcriptError = 'No transcript found via youtube-transcript.';
  } catch (err) {
    transcriptError = `Transcript via youtube-transcript failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  const captionTrack = pickCaptionTrack(playerResponse);
  if (!captionTrack) {
    return {
      transcript: [],
      transcript_error: transcriptError || 'No transcript/captions available for this video.',
      transcript_source: null
    };
  }

  try {
    const response = await fetch(captionTrack.baseUrl, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    const matches = [...xml.matchAll(/<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g)];
    const transcript = matches.map((m) => ({
      text: htmlDecode(m[3]),
      start: Number(m[1] || 0),
      duration: Number(m[2] || 0)
    })).filter((item) => item.text.length > 0);

    if (transcript.length === 0) {
      return {
        transcript: [],
        transcript_error: transcriptError || 'Caption track found but empty.',
        transcript_source: null
      };
    }

    return {
      transcript,
      transcript_error: null,
      transcript_source: {
        provider: 'caption-track-fallback',
        language: captionTrack.language,
        auto_generated: captionTrack.auto_generated
      }
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      transcript: [],
      transcript_error: `${transcriptError || 'Transcript unavailable.'} Fallback failed: ${msg}`,
      transcript_source: null
    };
  }
}

function extractViewCount(playerResponse, initialData) {
  const fromVideoDetails = parseLocalizedNumber(playerResponse?.videoDetails?.viewCount);
  if (fromVideoDetails !== null) return fromVideoDetails;

  const fromMicroformat = parseLocalizedNumber(
    playerResponse?.microformat?.playerMicroformatRenderer?.viewCount
  );
  if (fromMicroformat !== null) return fromMicroformat;

  const title = initialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.find(
    (item) => item?.videoPrimaryInfoRenderer
  )?.videoPrimaryInfoRenderer?.viewCount?.videoViewCountRenderer?.viewCount?.simpleText;

  return parseLocalizedNumber(title);
}

async function fetchPlayerData(videoId) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(watchUrl, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Video not found (HTTP 404). It may be deleted or unavailable.');
    }
    throw new Error(`YouTube request failed (HTTP ${res.status}).`);
  }

  const html = await res.text();
  const playerResponse = extractJsonObjectByMarker(html, [
    'var ytInitialPlayerResponse = ',
    'ytInitialPlayerResponse = '
  ]);
  const initialData = extractJsonObjectByMarker(html, [
    'var ytInitialData = ',
    'ytInitialData = '
  ]);

  if (!playerResponse) {
    throw new Error('Could not read ytInitialPlayerResponse from YouTube watch HTML.');
  }

  const playability = playerResponse?.playabilityStatus;
  const playabilityStatus = playability?.status || 'UNKNOWN';
  const playabilityReason = playability?.reason
    || playability?.messages?.find(Boolean)
    || null;

  if (playabilityStatus !== 'OK' && playabilityStatus !== 'LIVE_STREAM_OFFLINE') {
    if (playabilityStatus === 'LOGIN_REQUIRED') {
      throw new Error(`Video requires login or is private.${playabilityReason ? ` Reason: ${playabilityReason}` : ''}`);
    }
    throw new Error(`Video is not playable (${playabilityStatus}).${playabilityReason ? ` Reason: ${playabilityReason}` : ''}`);
  }

  return { watchUrl, playerResponse, initialData };
}

function buildChapterRanges(chapters, durationSeconds) {
  const timed = chapters.filter((chapter) => chapter.seconds !== null).sort((a, b) => a.seconds - b.seconds);
  return timed.map((chapter, index) => {
    const next = timed[index + 1];
    return {
      chapter,
      start: chapter.seconds,
      end: next ? next.seconds : Math.max(chapter.seconds, durationSeconds || chapter.seconds)
    };
  });
}

function getTranscriptInRange(transcript, startSeconds, endSeconds) {
  return transcript.filter((row) => {
    const t = Number(row.start || 0);
    return t >= startSeconds && t < endSeconds;
  });
}

function tokenizeWords(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9äöüß\s]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function getKeySentences(transcriptRows, limit = 6) {
  const candidates = transcriptRows
    .map((row) => ({
      text: row.text.trim(),
      start: Number(row.start || 0)
    }))
    .filter((row) => row.text.length > 30);

  if (candidates.length === 0) return [];

  const freq = new Map();
  for (const item of candidates) {
    const words = new Set(tokenizeWords(item.text));
    for (const word of words) {
      if (word.length < 4) continue;
      freq.set(word, (freq.get(word) || 0) + 1);
    }
  }

  const scored = candidates.map((item) => {
    const words = tokenizeWords(item.text);
    const score = words.reduce((sum, word) => sum + (freq.get(word) || 0), 0) / Math.max(1, words.length);
    return { ...item, score };
  }).sort((a, b) => b.score - a.score);

  const selected = [];
  for (const item of scored) {
    const duplicate = selected.some((prev) => prev.text.toLowerCase() === item.text.toLowerCase());
    if (!duplicate) selected.push(item);
    if (selected.length >= limit) break;
  }
  return selected.sort((a, b) => a.start - b.start);
}

function getActionableItems(sentences, limit = 5) {
  const actionableHints = /\b(should|must|need to|try|build|use|avoid|start|focus|do|don't|sollte|musst|nutze|baue|vermeide|fokus)\b/i;
  return sentences
    .filter((item) => actionableHints.test(item.text))
    .slice(0, limit);
}

function resolveChapterReference(query, chapters) {
  if (!query || chapters.length === 0) return null;
  const text = String(query).toLowerCase().trim();
  const match = text.match(/\b(?:point|punkt|chapter|kapitel|section|teil)?\s*(\d{1,3})\b/);
  if (match) {
    const wanted = Number(match[1]);
    if (/\b(point|punkt)\b/.test(text)) {
      return chapters.find((chapter) => chapter.point_index === wanted) || null;
    }
    if (/\b(chapter|kapitel|section|teil)\b/.test(text)) {
      return chapters.find((chapter) => chapter.chapter_index === wanted) || null;
    }
    return chapters.find((chapter) => chapter.point_index === wanted)
      || chapters.find((chapter) => chapter.chapter_index === wanted)
      || null;
  }
  return chapters.find((chapter) => chapter.title.toLowerCase().includes(text)) || null;
}

function buildMetadata({ videoId, watchUrl, playerResponse, initialData }) {
  const details = playerResponse?.videoDetails || {};
  const micro = playerResponse?.microformat?.playerMicroformatRenderer || {};
  const description = details.shortDescription || micro.description?.simpleText || '';

  return {
    video_id: videoId,
    watch_url: watchUrl,
    title: details.title || micro.title?.simpleText || '',
    description,
    duration_seconds: Number(details.lengthSeconds || 0),
    duration_human: formatSeconds(details.lengthSeconds || 0),
    view_count: extractViewCount(playerResponse, initialData),
    publication_date: micro.publishDate || micro.uploadDate || null,
    channel: {
      name: details.author || micro.ownerChannelName || '',
      id: details.channelId || micro.externalChannelId || ''
    }
  };
}

function buildTimestampLink(videoId, seconds) {
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.max(0, Math.floor(seconds || 0))}s`;
}

function buildAnalysis(metadata, chapters, transcript) {
  const chapterRanges = buildChapterRanges(chapters, metadata.duration_seconds);
  const keySentences = getKeySentences(transcript, 8);
  const actionable = getActionableItems(keySentences, 5);
  const chapterSummaries = chapterRanges.map((range) => {
    const chunk = getTranscriptInRange(transcript, range.start, range.end);
    const highlights = getKeySentences(chunk, 3);
    return {
      chapter_index: range.chapter.chapter_index,
      point_index: range.chapter.point_index,
      title: range.chapter.title,
      start_seconds: range.start,
      end_seconds: range.end,
      highlights
    };
  });

  return {
    chapter_summaries: chapterSummaries,
    key_points: keySentences,
    actionable_items: actionable
  };
}

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function getCacheFilePath(videoId) {
  return path.join(CACHE_DIR, `${videoId}.json`);
}

async function readCache(videoId, ttlSeconds) {
  try {
    const cachePath = getCacheFilePath(videoId);
    const raw = await fs.readFile(cachePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed?.cached_at) return null;

    const ageSeconds = (Date.now() - new Date(parsed.cached_at).getTime()) / 1000;
    if (!Number.isFinite(ageSeconds) || ageSeconds > ttlSeconds) return null;

    return parsed?.data || null;
  } catch {
    return null;
  }
}

async function writeCache(videoId, data) {
  try {
    await ensureCacheDir();
    const cachePath = getCacheFilePath(videoId);
    await fs.writeFile(cachePath, JSON.stringify({
      cached_at: new Date().toISOString(),
      data
    }), 'utf8');
  } catch {
    // Cache write failures should never break the analyzer.
  }
}

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    asJson: false,
    includeTranscript: false,
    sectionQuery: null,
    cacheTtl: DEFAULT_CACHE_TTL_SECONDS,
    noCache: false
  };

  let input = null;
  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];
    if (current === '--json') {
      options.asJson = true;
      continue;
    }
    if (current === '--markdown') {
      options.asJson = false;
      continue;
    }
    if (current === '--full-transcript') {
      options.includeTranscript = true;
      continue;
    }
    if (current === '--no-cache') {
      options.noCache = true;
      continue;
    }
    if (current === '--section' || current === '--chapter' || current === '--point') {
      options.sectionQuery = args[i + 1] || null;
      i += 1;
      continue;
    }
    if (current === '--ttl') {
      const next = Number(args[i + 1]);
      if (Number.isFinite(next) && next > 0) options.cacheTtl = next;
      i += 1;
      continue;
    }
    if (!input) input = current;
  }

  return { input, options };
}

function formatViewCount(viewCount) {
  if (viewCount === null || viewCount === undefined) return 'Unknown';
  return new Intl.NumberFormat('en-US').format(viewCount);
}

function formatTimestampMarkdown(videoId, seconds) {
  const text = formatSeconds(seconds);
  return `[${text}](${buildTimestampLink(videoId, seconds)})`;
}

function formatMarkdown(result) {
  const md = [];
  const metadata = result.metadata;

  md.push(`# YouTube Research & Analysis Pro`);
  md.push('');
  md.push(`## Video Metadata`);
  md.push(`- **Title:** ${metadata.title || 'Unknown'}`);
  md.push(`- **Channel:** ${metadata.channel.name || 'Unknown'}`);
  md.push(`- **Duration:** ${metadata.duration_human}`);
  md.push(`- **Views:** ${formatViewCount(metadata.view_count)}`);
  md.push(`- **Published:** ${metadata.publication_date || 'Unknown'}`);
  md.push(`- **URL:** ${metadata.watch_url}`);
  md.push('');

  md.push(`## Chapter Breakdown`);
  if (result.chapters.length === 0) {
    md.push('- No chapters/timestamps detected in description.');
  } else {
    for (const chapter of result.chapters) {
      const ts = chapter.seconds !== null
        ? formatTimestampMarkdown(metadata.video_id, chapter.seconds)
        : '_no timestamp_';
      const point = chapter.point_index !== null ? `, Point ${chapter.point_index}` : '';
      md.push(`- **Chapter ${chapter.chapter_index}${point}:** ${chapter.title} (${ts})`);
    }
  }
  md.push('');

  if (result.requested_section) {
    md.push(`## Requested Section`);
    if (result.requested_section.chapter) {
      const point = result.requested_section.chapter.point_index !== null
        ? `, Point ${result.requested_section.chapter.point_index}`
        : '';
      md.push(`- Matched **${result.requested_section.label}** -> **Chapter ${result.requested_section.chapter.chapter_index}${point}: ${result.requested_section.chapter.title}**`);
    } else {
      md.push(`- No matching chapter found for **${result.requested_section.label}**.`);
    }
    if (result.requested_section.chapter && result.requested_section.chapter.seconds !== null) {
      md.push(`- Start: ${formatTimestampMarkdown(metadata.video_id, result.requested_section.chapter.seconds)}`);
    }
    if (result.requested_section.summary.length > 0) {
      md.push(`- Summary:`);
      for (const item of result.requested_section.summary) {
        md.push(`  - ${formatTimestampMarkdown(metadata.video_id, item.start)} ${item.text}`);
      }
    } else {
      md.push(`- No transcript lines found for this section.`);
    }
    md.push('');
  }

  md.push(`## Key Insights`);
  if (result.analysis.key_points.length === 0) {
    md.push('- No key insights extracted (transcript unavailable).');
  } else {
    for (const point of result.analysis.key_points.slice(0, 8)) {
      md.push(`- ${formatTimestampMarkdown(metadata.video_id, point.start)} ${point.text}`);
    }
  }
  md.push('');

  md.push(`## Actionable Items`);
  if (result.analysis.actionable_items.length === 0) {
    md.push('- No explicit actionable phrases detected.');
  } else {
    for (const item of result.analysis.actionable_items) {
      md.push(`- ${formatTimestampMarkdown(metadata.video_id, item.start)} ${item.text}`);
    }
  }
  md.push('');

  if (result.transcript_error) {
    md.push(`## Transcript Status`);
    md.push(`- ${result.transcript_error}`);
    md.push('');
  }

  if (result.include_full_transcript) {
    md.push(`## Transcript`);
    if (result.transcript.length === 0) {
      md.push('- Transcript unavailable.');
    } else {
      for (const row of result.transcript) {
        md.push(`- ${formatTimestampMarkdown(metadata.video_id, row.start)} ${row.text}`);
      }
    }
    md.push('');
  }

  return md.join('\n');
}

async function analyze(videoInput, options = {}) {
  const videoId = extractVideoId(videoInput);

  if (!options.noCache) {
    const cached = await readCache(videoId, options.cacheTtl || DEFAULT_CACHE_TTL_SECONDS);
    if (cached) {
      return applySectionAndTranscriptOptions(cached, options);
    }
  }

  const { watchUrl, playerResponse, initialData } = await fetchPlayerData(videoId);
  const metadata = buildMetadata({ videoId, watchUrl, playerResponse, initialData });
  const chapters = extractChaptersFromDescription(metadata.description);
  const transcriptResult = await fetchTranscriptWithFallback(watchUrl, playerResponse);
  const analysis = buildAnalysis(metadata, chapters, transcriptResult.transcript);

  const baseResult = {
    metadata,
    chapters,
    transcript: transcriptResult.transcript,
    transcript_error: transcriptResult.transcript_error,
    transcript_source: transcriptResult.transcript_source,
    analysis
  };

  await writeCache(videoId, baseResult);
  return applySectionAndTranscriptOptions(baseResult, options);
}

function applySectionAndTranscriptOptions(baseResult, options) {
  const sectionQuery = options.sectionQuery || null;
  let requestedSection = null;

  if (sectionQuery) {
    const chapter = resolveChapterReference(sectionQuery, baseResult.chapters);
    if (chapter) {
      const ranges = buildChapterRanges(baseResult.chapters, baseResult.metadata.duration_seconds);
      const range = ranges.find((r) => r.chapter.chapter_index === chapter.chapter_index);
      const sectionRows = range
        ? getTranscriptInRange(baseResult.transcript, range.start, range.end)
        : [];
      requestedSection = {
        label: sectionQuery,
        chapter,
        summary: getKeySentences(sectionRows, 5)
      };
    } else {
      requestedSection = {
        label: sectionQuery,
        chapter: null,
        summary: []
      };
    }
  }

  return {
    ...baseResult,
    include_full_transcript: Boolean(options.includeTranscript),
    transcript: options.includeTranscript ? baseResult.transcript : [],
    requested_section: requestedSection,
    requested_section_found: requestedSection ? Boolean(requestedSection.chapter) : null
  };
}

function printUsage() {
  process.stdout.write([
    'Usage:',
    '  node analyze-yt.js "<youtube-url-or-id>" [--markdown|--json] [--full-transcript]',
    '                     [--section "point 4"] [--no-cache] [--ttl 900]',
    '',
    'Examples:',
    '  node analyze-yt.js "https://youtu.be/0wz6lYgL-Do"',
    '  node analyze-yt.js "https://youtu.be/0wz6lYgL-Do" --section "chapter 4"',
    '  node analyze-yt.js "0wz6lYgL-Do" --json --full-transcript'
  ].join('\n'));
}

if (path.resolve(process.argv[1] || '') === __filename) {
  const { input, options } = parseArgs(process.argv.slice(2));
  if (!input || input === '--help' || input === '-h') {
    printUsage();
    if (!input || input === '--help' || input === '-h') process.exit(input ? 0 : 1);
  }

  try {
    const result = await analyze(input, options);
    printResult(result, { asJson: options.asJson }, 0);
  } catch (err) {
    printResult({
      error: err instanceof Error ? err.message : String(err),
      summary_ready: false
    }, { asJson: options.asJson }, 1);
  }
}

export {
  analyze,
  detectYouTubeUrls,
  extractVideoId,
  resolveChapterReference
};
