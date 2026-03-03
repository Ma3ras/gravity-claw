import { execSync } from 'child_process';
import fetch from 'node-fetch';

async function test(videoId) {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(watchUrl, { headers: { 'user-agent': 'Mozilla/5.0' } });
    const html = await res.text();

    function extractJsonObject(html, marker) {
        const markerPos = html.indexOf(marker);
        if (markerPos < 0) return null;
        let depth = 0; let inString = false; let stringQuote = ''; let escaped = false;
        const maybeStart = html.indexOf('{', markerPos + marker.length);
        for (let i = maybeStart; i < html.length; i++) {
            const ch = html[i];
            if (inString) {
                if (escaped) escaped = false;
                else if (ch === '\\') escaped = true;
                else if (ch === stringQuote) { inString = false; stringQuote = ''; }
                continue;
            }
            if (ch === '"' || ch === "'") { inString = true; stringQuote = ch; continue; }
            if (ch === '{') depth++;
            if (ch === '}') depth--;
            if (depth === 0) return JSON.parse(html.slice(maybeStart, i + 1));
        }
    }

    const playerResponse = extractJsonObject(html, 'var ytInitialPlayerResponse = ') || extractJsonObject(html, 'ytInitialPlayerResponse = ');
    const track = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks?.[0];
    if (!track) return console.log('No track');

    console.log("Track URL:", track.baseUrl);
    try {
        const curlOut = execSync(`curl -s -A "Mozilla/5.0" "${track.baseUrl}"`);
        console.log("CURL output length:", curlOut.length);
        console.log("CURL head:", curlOut.toString().slice(0, 500));
    } catch (e) {
        console.error("CURL failed");
    }
}

test('0wz6lYgL-Do').catch(console.error);
