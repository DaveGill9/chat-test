export type EvalRow = {
    id: string;
    input: string;
    expected: string;
    actual?: string;
    score?: number;
    rationale?: string;
};

export type EvalResult = {
    score: number;
    rationale: string;
};