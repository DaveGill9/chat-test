import "dotenv/config";
import path from "path";
import { loadFile, writeResults } from "./file.ts";
import { callEndpoint } from "./http.ts";
import { evaluate } from "./eval.ts";

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
    outputPathArg || path.join(path.dirname(inputPath), defaultOutputName);

async function main() {
    const rows = loadFile(inputPath);

    console.log(`Loaded ${rows.length} tests from ${inputPath}`);
    console.log(`Results will be written to ${outputPath}\n`);

    for (const row of rows) {
        console.log(`Test ${row.id}: calling chatbot`);

        try {
            const actual = await callEndpoint(row);
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
