import youtubedl from 'youtube-dl-exec';
import fetch from 'node-fetch';

async function test(videoId) {
    try {
        const output = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
            dumpJson: true,
            writeAutoSubs: true,
            subLangs: 'de,en',
            skipDownload: true
        });

        const subs = output.automatic_captions || output.subtitles;
        if (!subs) return console.log("No subs");

        const langTracks = subs['de'] || subs['en'];
        if (!langTracks) return console.log("No de or en tracks");

        const json3Track = langTracks.find(t => t.ext === 'json3');
        if (!json3Track) return console.log("No json3 track found", langTracks.map(t => t.ext));

        console.log("Fetching JSON3 from URL:", json3Track.url);
        const res = await fetch(json3Track.url);
        const data = await res.json();

        const events = data.events || [];
        const lines = events.filter(e => e.segs && e.segs.length > 0).map(e => {
            const start = e.tStartMs / 1000;
            const text = e.segs.map(s => s.utf8).join('');
            return `[${start}] ${text}`;
        });

        console.log("Got", lines.length, "lines.");
        console.log(lines.slice(0, 5).join('\n'));
    } catch (e) {
        console.error("Failed:", e);
    }
}

test('0wz6lYgL-Do').catch(console.error);
