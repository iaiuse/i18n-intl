import { Logger } from './logger';
import * as vscode from 'vscode';

export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
}

export interface TranslationResult {
    translatedContent: any;
    tokensUsed: TokenUsage;
}

export interface ValidationResult {
    isValid: boolean;
    tokensUsed: TokenUsage;
}

export interface ILLMProvider {
    initialize(config: vscode.WorkspaceConfiguration, logger: Logger): void;
    translate(content: any, targetLang: string): Promise<TranslationResult>;
    compareAndUpdate(oldContent: any, newContent: any, targetLang: string): Promise<any>;
    validateTranslation(originalContent: any, translatedContent: any, targetLang: string): Promise<ValidationResult>;
    getProviderName(): string;
}