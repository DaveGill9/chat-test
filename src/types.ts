export type EvalRow = {
    id: string;
    input: string;
    expected: string;
    actual?: string;
    score?: number;
    reasoning?: string;
    [key: string]: unknown;
};

export type EvalResult = {
    score: number;
    reasoning: string;
};