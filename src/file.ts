import fs from "fs";
import Papa from "papaparse";
import XLSX from "xlsx";
import type { EvalRow } from "./types.ts";

export function loadFile(path: string): EvalRow[] {
    const ext = path.toLowerCase().split(".").pop() || "";

    if (ext === "csv") {
        return loadXlsx(path);
    }

    return loadCsv(path);
}

function loadCsv(path: string): EvalRow[] {
    const text = fs.readFileSync(path, "utf-8");

    const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
        throw new Error("CSV parse errors: " + JSON.stringify(result.errors));
    }

    const rows = result.data as EvalRow[];

    validateRequiredFields(rows, "CSV");

    return rows;
}

function loadXlsx(path: string): EvalRow[] {
    const workbook = XLSX.readFile(path);
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
        throw new Error("XLSX file has no sheets");
    }

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
    }) as EvalRow[];

    validateRequiredFields(rows, "XLSX");

    return rows;
}

function validateRequiredFields(rows: EvalRow[], source: string): void {
    for (const row of rows) {
        if (!row.id || !row.input || !row.expected) {
            throw new Error(
                `${source} row missing required fields (id, input, expected): ` +
                JSON.stringify(row)
            );
        }
    }
}

export function writeResults(path: string, rows: EvalRow[]): void {
    const ext = path.toLowerCase().split(".").pop() || "";

    if (ext === "xlsx" || ext === "xls") {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
        XLSX.writeFile(workbook, path);
        return;
    }

    const csv = Papa.unparse(rows);
    fs.writeFileSync(path, csv);
}