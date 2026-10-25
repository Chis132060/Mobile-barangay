export const FOUR_GB_PRESET: Readonly<{model:string;maxQuestionCharacters:number;maxAnswerCharacters:number;targetAnswerWords:number;maxHistoryTurns:number}>;
export function prepareSmallDeviceQuestion(question: unknown): string;
export function boundSmallDeviceReply(reply: unknown): string;
