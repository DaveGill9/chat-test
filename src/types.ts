export type EvalRow = {
    id: string;
    input: string;
    expected: string;
    actual?: string;
    score?: number;
    rationale?: string;
};

export type JudgeResult = {
    score: number;
    rationale: string;
};