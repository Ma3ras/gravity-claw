import fetch from "node-fetch";

async function testOllama() {
    try {
        console.log("Checking Ollama connection on http://localhost:11434/api/tags...");
        const response = await fetch("http://localhost:11434/api/tags");
        if (!response.ok) {
            console.error("HTTP Error:", response.status, response.statusText);
            return;
        }

        const data = await response.json();
        console.log("Found Models:");
        data.models.forEach((m: any) => console.log(` - ${m.name}`));

        const hasQwen = data.models.some((m: any) => m.name.includes("qwen"));
        if (!hasQwen) {
            console.error("\nERROR: qwen2.5-coder:14b is NOT installed in Ollama!");
        } else {
            console.log("\nSUCCESS: qwen2.5-coder:14b is installed and Ollama is reachable.");
        }
    } catch (e) {
        console.error("Failed to connect to Ollama. Is the Ollama app running?", e);
    }
}

testOllama();
