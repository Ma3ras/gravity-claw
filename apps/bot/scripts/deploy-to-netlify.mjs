/**
 * deploy-to-netlify.mjs
 * 
 * Deploys the apps/web/dist folder to Netlify using the REST API directly.
 * This bypasses the broken Netlify CLI on Windows.
 * 
 * Usage: node scripts/deploy-to-netlify.mjs
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const SITE_ID = "54a66979-1664-42ef-bfb4-bb595f6c2ee2";
const DIST_DIR = path.resolve("D:/ai/gravity-claw/apps/web/dist");
const TOKEN = process.env.NETLIFY_AUTH_TOKEN;

if (!TOKEN) {
    console.error("❌ NETLIFY_AUTH_TOKEN not set in .env");
    process.exit(1);
}

// 1. Collect all files and compute SHA1 hashes
function collectFiles(dir, base = "") {
    const files = {};
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const rel = base ? `${base}/${entry.name}` : entry.name;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            Object.assign(files, collectFiles(full, rel));
        } else {
            const content = fs.readFileSync(full);
            const sha1 = crypto.createHash("sha1").update(content).digest("hex");
            files[`/${rel}`] = { sha1, content, size: content.length };
        }
    }
    return files;
}

async function deploy() {
    console.log(`📁 Scanning ${DIST_DIR}...`);
    const files = collectFiles(DIST_DIR);
    const filePaths = Object.keys(files);
    console.log(`   Found ${filePaths.length} files`);

    // 2. Create deploy with file digests
    const fileDigests = {};
    for (const [p, f] of Object.entries(files)) {
        fileDigests[p] = f.sha1;
    }

    console.log("🚀 Creating deploy...");
    const createRes = await fetch(
        `https://api.netlify.com/api/v1/sites/${SITE_ID}/deploys`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ files: fileDigests }),
        }
    );

    if (!createRes.ok) {
        const err = await createRes.text();
        console.error("❌ Failed to create deploy:", createRes.status, err);
        process.exit(1);
    }

    const deploy = await createRes.json();
    console.log(`   Deploy ID: ${deploy.id}`);
    console.log(`   Required files: ${deploy.required?.length ?? 0}`);

    // 3. Upload required files
    const required = new Set(deploy.required || []);
    for (const [filePath, fileData] of Object.entries(files)) {
        if (!required.has(fileData.sha1)) continue;

        console.log(`   ⬆️  Uploading ${filePath} (${fileData.size} bytes)`);
        const uploadRes = await fetch(
            `https://api.netlify.com/api/v1/deploys/${deploy.id}/files${filePath}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${TOKEN}`,
                    "Content-Type": "application/octet-stream",
                },
                body: fileData.content,
            }
        );

        if (!uploadRes.ok) {
            console.error(`   ❌ Failed to upload ${filePath}:`, uploadRes.status);
        }
    }

    // 4. Get final deploy status
    const statusRes = await fetch(
        `https://api.netlify.com/api/v1/deploys/${deploy.id}`,
        { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    const final = await statusRes.json();
    console.log(`\n✅ Deploy complete!`);
    console.log(`🌐 Live URL: ${final.ssl_url || final.url}`);
}

deploy().catch(console.error);
