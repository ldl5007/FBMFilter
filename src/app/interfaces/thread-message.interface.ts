export interface ILogMessage {
    type: "message",
    message: string
}

export class LogMessage implements ILogMessage {
    public type;
    public message;

    constructor(message: string) {
        this.type = "message";
        this.message = message;
    } 
}

export interface IProgressUpdate {
    type: "progress",
    val: number,
    max: Number
}

export class ProgressUpdate implements IProgressUpdate {
    public type;
    public val;
    public max;

    constructor(val?: number, max?: number) {
        this.type = "progress";
        this.val = val;
        this.max = max;
    }
}

export type ThreadMessage = ILogMessage | IProgressUpdate;