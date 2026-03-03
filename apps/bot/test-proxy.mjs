import fetch from 'node-fetch';

async function test(videoId) {
    const url = `https://youtubetranscript.com/?server_vid2=${videoId}`;
    console.log("Fetching", url);
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
    const text = await res.text();
    console.log("Length:", text.length);
    console.log("Body:", text.slice(0, 500));
}

test('0wz6lYgL-Do').catch(console.error);
