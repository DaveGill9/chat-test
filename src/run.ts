import "dotenv/config";
import { loadCsv, writeCsv } from "./csv.ts";
import { callEndpoint } from "./http.ts";
import { evaluate } from "./eval.ts";

const csvPath = process.argv[2];
if (!csvPath) {
    console.error("Usage: npm run eval -- path/to/tests.csv");
    process.exit(1);
}

async function main() {
    const rows = loadCsv(csvPath);

    for (const row of rows) {
        console.log(`Test ${row.id}: calling chatbot`);

        try {
            const actual = await callEndpoint(row.input);
            row.actual = actual;

            const result = await evaluate(row.input, row.expected, actual);
            row.score = result.score;
            row.rationale = result.rationale;

            console.log(`Test ${row.id}: score=${row.score}`);
        } catch (err: any) {
            row.actual = row.actual ?? "";
            row.score = 0;
            row.rationale = `ERROR: ${err?.message ?? String(err)}`;
            console.error(`Test ${row.id} failed`, err);
        }
    }

    writeCsv(csvPath, rows);
    console.log(`Done. Results written to ${csvPath}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
