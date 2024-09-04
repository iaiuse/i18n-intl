import * as vscode from 'vscode';

export class Logger {
    private debugEnabled: boolean = false;
    private outputChannel: vscode.OutputChannel;

    constructor(channel: vscode.OutputChannel) {
        this.outputChannel = channel;
    }

    public log(message: string): void {
        if (this.debugEnabled) {
            console.log(message);
            this.outputChannel.appendLine(message);
        }
    }

    public warn(message: string): void {
        console.warn(message);
        this.outputChannel.appendLine(`WARN: ${message}`);
    }

    public error(message: string, error?: any): void {
        console.error(message, error);
        this.outputChannel.appendLine(`ERROR: ${message}`);
        if (error) {
            this.outputChannel.appendLine(error.toString());
        }
    }

    public toggleDebugOutput(): void {
        this.debugEnabled = !this.debugEnabled;
        this.log(`Debug output ${this.debugEnabled ? 'enabled' : 'disabled'}`);
    }

    public isDebugEnabled(): boolean {
        return this.debugEnabled;
    }
}