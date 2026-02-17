import "dotenv/config";
import path from "path";
import fs from "fs";
import OpenAI from "openai";
import { loadRawFile, writeRawFile, type RawRow } from "./file.ts";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("Missing OPENAI_API_KEY env var");

const client = new OpenAI({ apiKey });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const CONVERT_DIR = "convert";

const filePathArg = process.argv[2];
const promptArg = process.argv.slice(3).join(" ").trim();

if (!filePathArg) {
    console.error("Usage: npm run convert -- <file> <prompt>");
    console.error('Example: npm run convert -- "tests.csv" "Convert to id, input, expected. Combine expected and avoid into expected."');
    process.exit(1);
}

if (!promptArg) {
    console.error("Usage: npm run convert -- <file> <prompt>");
    console.error("A prompt is required.");
    process.exit(1);
}

function resolveInputPath(rawPath: string): string {
    const hasDir = path.dirname(rawPath) !== "." && path.dirname(rawPath) !== "";
    return hasDir ? rawPath : path.join(CONVERT_DIR, rawPath);
}

async function main() {
    const inputPath = resolveInputPath(filePathArg);

    if (!fs.existsSync(inputPath)) {
        console.error(`File not found: ${inputPath}`);
        process.exit(1);
    }

    const ext = path.extname(inputPath).toLowerCase();
    const outputPath = path.join(
        CONVERT_DIR,
        `${path.basename(inputPath, ext)}-converted${ext}`
    );

    console.log(`Loading ${inputPath}...`);
    const rows = loadRawFile(inputPath);

    if (rows.length === 0) {
        console.error("No rows found in file.");
        process.exit(1);
    }

    const systemPrompt = `You convert client test data into our eval format.

Our format requires each row to have:
- id: unique string (e.g. "1", "test_1", or generate if missing)
- input: the user message/prompt to send to the chatbot
- expected: what the chatbot should return (can include "avoid" instructions if the client had a separate avoid column)

Rules:
- Do NOT change the content of the tests. Only map and restructure columns.
- Preserve all meaningful content. If combining columns (e.g. expected + avoid), include both without adding new information.
- Return a JSON array of objects only. No markdown, no explanation.`;

    const userContent = `Data to convert (JSON array of ${rows.length} rows):
\`\`\`json
${JSON.stringify(rows, null, 0)}
\`\`\`

User instructions: ${promptArg}

Return a JSON array of objects with id, input, and expected (and any other columns you wish to keep).`;

    console.log("Sending to OpenAI for conversion...");
    const resp = await client.chat.completions.create({
        model: MODEL,
        temperature: 0,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
        ],
    });

    const content = resp.choices[0].message.content;
    if (!content) throw new Error("OpenAI returned empty response");

    let jsonStr = content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
        jsonStr = jsonMatch[0];
    }

    let converted: RawRow[];
    try {
        converted = JSON.parse(jsonStr);
    } catch {
        throw new Error(`OpenAI did not return valid JSON:\n${content}`);
    }

    if (!Array.isArray(converted)) {
        throw new Error("OpenAI did not return a JSON array");
    }

    fs.mkdirSync(CONVERT_DIR, { recursive: true });
    writeRawFile(outputPath, converted);
    console.log(`Done. Wrote ${converted.length} rows to ${outputPath}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
