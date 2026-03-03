---
name: youtube-research-analysis-pro
description: Analyze YouTube videos end-to-end for Gravity Claw. Use when a user sends a YouTube URL, asks for transcript extraction, chapter/point lookup, metadata scraping, summary, key insights, or actionable takeaways.
---

# YouTube Research & Analysis Pro

Use this skill when a user provides a YouTube URL (`youtube.com` or `youtu.be`) or asks for chapter/point-specific analysis.

## Trigger

- If user text contains one or more YouTube URLs, offer analysis automatically.
- If user asks for "point N", "chapter N", "Kapitel N", or "Punkt N", run section mode.

## Tooling

Primary analyzer script:

`node tools/youtube-analyzer/analyze-yt.js "<youtube-url>" --markdown`

Section lookup:

`node tools/youtube-analyzer/analyze-yt.js "<youtube-url>" --section "point 4" --markdown`

Machine-readable output:

`node tools/youtube-analyzer/analyze-yt.js "<youtube-url>" --json`

Optional full transcript output:

`node tools/youtube-analyzer/analyze-yt.js "<youtube-url>" --full-transcript --markdown`

## Expected Capabilities

- Transcript extraction from manual captions first, then fallback to available caption tracks.
- Graceful handling of missing/private/deleted/unplayable videos.
- Chapter detection from description timestamps and chapter labels (`Chapter`, `Kapitel`, `Punkt`, numbered sections like `1.` / `2)`).
- Point-to-chapter resolution (e.g. "point 4").
- Metadata extraction: title, channel, duration, views, publication date, description.
- Content analysis: key insights, actionable items, timestamped quotes.
- Short-term cache to avoid repeated refetching.

## Response Format

Return markdown with these sections:

1. Video Metadata
2. Chapter Breakdown
3. Requested Section (if user asked for one)
4. Key Insights
5. Actionable Items
6. Transcript Status (if needed)
7. Transcript (only when requested)

Use clickable timestamp links in markdown where possible.
