import { YoutubeTranscript } from 'youtube-transcript';
async function test() {
    try {
        const rows = await YoutubeTranscript.fetchTranscript('https://youtu.be/0wz6lYgL-Do', { lang: 'de' });
        console.log("de lang Row count:", rows.length);
        if (rows.length > 0) {
            console.log("First line:", rows[0].text);
        }
    } catch (e) {
        console.error("Error from youtube-transcript:");
        console.error(e);
    }
}
test();
