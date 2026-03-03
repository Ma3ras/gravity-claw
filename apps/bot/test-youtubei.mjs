import { Innertube } from 'youtubei.js';

async function test() {
    try {
        const yt = await Innertube.create();
        const info = await yt.getInfo('0wz6lYgL-Do');
        const transcriptData = await info.getTranscript();

        console.log("Success! Transcript fetched.");
        if (transcriptData && transcriptData.transcript) {
            const body = transcriptData.transcript.content?.body;
            if (body && body.initial_segments) {
                console.log(`Found ${body.initial_segments.length} segments.`);
                console.log(body.initial_segments.slice(0, 3).map(s => `[${s.start_ms}] ${s.snippet.text}`).join('\n'));
            } else {
                console.log("No initial_segments found. Body:", Object.keys(body || {}));
            }
        } else {
            console.log("No transcript property found in getTranscript() response.");
        }
    } catch (e) {
        console.error("youtubei.js failed:");
        console.error(e);
    }
}
test();
