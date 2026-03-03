import * as fs from "fs";

async function searchDDGLite(query: string) {
    try {
        const response = await fetch("https://lite.duckduckgo.com/lite/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            body: `q=${encodeURIComponent(query)}`
        });

        const html = await response.text();

        // Find the first occurrence of result-snippet and grab 1000 characters around it
        const index = html.indexOf('result-snippet');
        const snippetHtml = html.substring(Math.max(0, index - 500), index + 1000);

        fs.writeFileSync("test-ddg-output-node.txt", snippetHtml, "utf-8");
    } catch (error) {
        console.error(error);
    }
}

searchDDGLite("LCK 2026 Standings").catch(console.error);
