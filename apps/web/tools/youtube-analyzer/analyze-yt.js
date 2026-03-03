#!/usr/bin/env node

import { YoutubeTranscript } from 'youtube-transcript';

function printJson(data, exitCode = 0) {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
  process.exit(exitCode);
}

function extractVideoId(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Bitte eine YouTube-URL oder Video-ID angeben.');
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
    throw new Error('Ungueltige URL. Erwartet z.B. https://youtu.be/<id> oder https://youtube.com/watch?v=<id>.');
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

  throw new Error('Konnte keine gueltige YouTube Video-ID aus der URL extrahieren.');
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

function extractChaptersFromDescription(description) {
  const lines = (description || '').split(/\r?\n/);
  const chapters = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/);
    if (!match) continue;

    const seconds = parseTimestampToSeconds(match[1]);
    if (seconds === null) continue;

    chapters.push({
      title: match[2].trim(),
      timestamp: match[1],
      seconds
    });
  }

  const unique = [];
  const seen = new Set();
  for (const chapter of chapters) {
    const key = `${chapter.seconds}:${chapter.title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(chapter);
  }

  return unique.sort((a, b) => a.seconds - b.seconds);
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

  return preferred?.baseUrl || null;
}

async function fetchTranscriptWithFallback(videoUrl, playerResponse) {
  let transcriptError = null;

  try {
    const rows = await YoutubeTranscript.fetchTranscript(videoUrl);
    const mapped = mapYoutubeTranscriptRows(Array.isArray(rows) ? rows : []);
    if (mapped.length > 0) {
      return { transcript: mapped, transcript_error: null };
    }
    transcriptError = 'Kein Transcript via youtube-transcript gefunden.';
  } catch (err) {
    transcriptError = `Transcript via youtube-transcript fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`;
  }

  const captionUrl = pickCaptionTrack(playerResponse);
  if (!captionUrl) {
    return {
      transcript: [],
      transcript_error: transcriptError || 'Dieses Video hat kein verfuegbares Transcript.'
    };
  }

  try {
    const response = await fetch(captionUrl, { headers: { 'user-agent': 'Mozilla/5.0' } });
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
        transcript_error: transcriptError || 'Caption-Track gefunden, aber leer.'
      };
    }

    return { transcript, transcript_error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      transcript: [],
      transcript_error: `${transcriptError || 'Transcript nicht verfuegbar.'} Fallback fehlgeschlagen: ${msg}`
    };
  }
}

async function fetchPlayerResponse(videoId) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(watchUrl, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) {
    throw new Error(`YouTube-Request fehlgeschlagen (HTTP ${res.status}).`);
  }

  const html = await res.text();
  const playerResponse = extractJsonObjectByMarker(html, [
    'var ytInitialPlayerResponse = ',
    'ytInitialPlayerResponse = '
  ]);

  if (!playerResponse) {
    throw new Error('Konnte ytInitialPlayerResponse nicht aus dem HTML lesen.');
  }

  return { watchUrl, playerResponse };
}

async function analyze(videoInput) {
  const videoId = extractVideoId(videoInput);
  const { watchUrl, playerResponse } = await fetchPlayerResponse(videoId);

  const details = playerResponse?.videoDetails || {};
  const description = details.shortDescription || '';
  const chapters = extractChaptersFromDescription(description);

  const transcriptResult = await fetchTranscriptWithFallback(watchUrl, playerResponse);

  return {
    title: details.title || '',
    description,
    duration_seconds: Number(details.lengthSeconds || 0),
    channel: {
      name: details.author || '',
      id: details.channelId || ''
    },
    transcript: transcriptResult.transcript,
    chapters,
    summary_ready: transcriptResult.transcript.length > 0,
    transcript_error: transcriptResult.transcript_error
  };
}

const input = process.argv[2];
if (!input) {
  printJson({
    error: 'Bitte YouTube-URL als Parameter uebergeben.',
    usage: 'node analyze-yt.js "https://youtu.be/VIDEO_ID"'
  }, 1);
}

try {
  const result = await analyze(input);
  printJson(result, 0);
} catch (err) {
  printJson({
    error: err instanceof Error ? err.message : String(err),
    summary_ready: false,
    transcript: [],
    chapters: []
  }, 1);
}
