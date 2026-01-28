import fs from "fs";
import Papa from "papaparse";
import { EvalRow } from './types.js';

export function loadCsv(path: string): EvalRow[] {
    const text = fs.readFileSync(path, 'utf-8');

    const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
        throw new Error("CSV parse errors: " + JSON.stringify(result.errors));
    }

    const rows = result.data as EvalRow[];

    for (const row of rows) {
        if (!row.id || !row.input || !row.expected) {
            throw new Error("CSV row missing required fields");
        }
    }

    return rows;
}

export function writeCsv(path: string, rows: EvalRow[]) {
    const csv = Papa.unparse(rows);
    fs.writeFileSync(path, csv);
}