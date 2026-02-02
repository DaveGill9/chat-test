import "dotenv/config";
import fs from "fs";
import path from "path";
import { loadFile, writeResults } from "./file.ts";
import { callEndpoint, sendFollowup, getExtras } from "./http.ts";
import { evaluate } from "./eval.ts";
import { decideFollowup } from "./followup.ts";

const MAX_FOLLOWUP_TURNS = Math.max(
    1,
    parseInt(process.env.CHATBOT_MAX_FOLLOWUP_TURNS || "2", 10)
);
// Parse escape sequences in the separator (env vars don't interpret \n)
const rawSeparator = process.env.CHATBOT_RESPONSE_SEPARATOR || "\n---\n";
const RESPONSE_SEPARATOR = rawSeparator
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");

const FILES_DIR = "files";

const inputPath = process.argv[2];
const outputPathArg = process.argv[3];

if (!inputPath) {
    console.error("Usage: npm run eval -- path/to/tests.(csv|xlsx) [path/to/results.(csv|xlsx)]");
    process.exit(1);
}

const inputExt = path.extname(inputPath) || ".csv";
const defaultOutputName =
    `${path.basename(inputPath, inputExt)}-results${inputExt}`;
const outputPath =
    outputPathArg || path.join(FILES_DIR, defaultOutputName);

async function main() {
    const rows = loadFile(inputPath);

    const outDir = path.dirname(outputPath);
    if (outDir) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    console.log(`Loaded ${rows.length} tests from ${inputPath}`);
    console.log(`Results will be written to ${outputPath}\n`);

    for (const row of rows) {
        console.log(`Test ${row.id}: calling chatbot`);

        try {
            const responses: string[] = [];
            let chat = await callEndpoint(row);
            responses.push(chat.answer);
            let threadId = chat.threadId;

            for (let turn = 1; turn <= MAX_FOLLOWUP_TURNS; turn++) {
                const decision = await decideFollowup({
                    input: row.input,
                    expected: row.expected,
                    latestReply: chat.answer,
                });

                if (!decision.needsFollowup || !decision.followupMessage) {
                    break;
                }

                console.log(
                    `  → Follow-up ${turn}: ${decision.followupMessage.substring(0, 50)}...`
                );

                // Save the follow-up message before the response
                responses.push(`[Follow-up ${turn}]: ${decision.followupMessage}`);

                chat = await sendFollowup(
                    decision.followupMessage,
                    threadId,
                    getExtras(row)
                );
                responses.push(chat.answer);
                if (chat.threadId) {
                    threadId = chat.threadId;
                }
            }

            const actual = responses.join(RESPONSE_SEPARATOR);
            row.actual = actual;

            const result = await evaluate(row.input, row.expected, actual);
            row.score = result.score;
            row.reasoning = result.reasoning;

            console.log(`Test ${row.id}: score=${row.score}`);
        } catch (err: any) {
            row.actual = row.actual ?? "";
            row.score = 0;
            row.reasoning = `ERROR: ${err?.message ?? String(err)}`;
            console.error(`Test ${row.id} failed`, err);
        }
    }

    writeResults(outputPath, rows);
    console.log(`\nDone. Results written to ${outputPath}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
