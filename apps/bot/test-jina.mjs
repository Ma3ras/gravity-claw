import fetch from 'node-fetch';
import fs from 'fs';

async function test(videoId) {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(`https://r.jina.ai/${watchUrl}`);
    const text = await res.text();
    fs.writeFileSync('jina.md', text);
    console.log("Written to jina.md");
}

test('0wz6lYgL-Do').catch(console.error);
