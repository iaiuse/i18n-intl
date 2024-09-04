import * as vscode from 'vscode';
import { Logger } from './logger';
import { ILLMProvider, TranslationResult, ValidationResult } from './llm-provider.interface';
import { OpenAIProvider } from './providers/openai-provider';
import { GeminiProvider } from './providers/gemini-provider';
import { ClaudeProvider } from './providers/claude-provider';
import { OpenAICompatibleProvider } from './providers/openai-compatible-provider';


export class LLMService {
    private provider!: ILLMProvider;
    private logger: Logger;
    private outputChannel: vscode.OutputChannel;
    private batchSize: number;

    constructor(logger: Logger, channel: vscode.OutputChannel) {
        this.logger = logger;
        this.outputChannel = channel;
        const config = vscode.workspace.getConfiguration('i18nNexus');
        this.batchSize = config.get('translationBatchSize', 1000); // 默认批次大小为1000
        this.initializeProvider();
    }

    private initializeProvider() {
        const config = vscode.workspace.getConfiguration('i18nNexus');
        const providerName = config.get('llmProvider') || 'openai';
        this.logger.log(`Initializing LLM provider: ${providerName}`);

        switch (providerName) {
            case 'openai':
                this.provider = new OpenAIProvider();
                break;
            case 'gemini':
                this.provider = new GeminiProvider();
                break;
            case 'claude':
                this.provider = new ClaudeProvider();
                break;
            case 'openai-compatible':
                this.provider = new OpenAICompatibleProvider();
                break;
            //case 'zhipuai':
            //    this.provider = new ZhipuAIProvider();
            //    break;
            default:
                this.logger.error(`Unsupported LLM provider: ${providerName}`);
                throw new Error(`Unsupported LLM provider: ${providerName}`);
        }

        this.provider.initialize(config, this.logger);
        this.logger.log(`LLM provider ${providerName} initialized successfully`);
    }

    public async translate(content: any, targetLang: string): Promise<TranslationResult> {
        this.logger.log(`Starting translation to ${targetLang}`);
        try {
            const result = await this.translateInBatches(content, targetLang);
            this.logger.log(`Translation to ${targetLang} completed successfully`);
            this.logger.log(`Total tokens used: Input: ${result.tokensUsed.inputTokens}, Output: ${result.tokensUsed.outputTokens}`);
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Translation failed: ${errorMessage}`, error);
            vscode.window.showErrorMessage(`Translation failed: ${errorMessage}`);
            throw error;
        }
    }

    private async translateInBatches(content: any, targetLang: string): Promise<TranslationResult> {
        const batches = this.splitIntoBatches(content, this.batchSize);
        let totalTranslatedContent: any = {};
        let totalTokensUsed = { inputTokens: 0, outputTokens: 0 };

        for (let i = 0; i < batches.length; i++) {
            this.outputChannel.appendLine(`Translating batch ${i + 1} of ${batches.length}...`);
            const batchResult = await this.provider.translate(batches[i], targetLang);
            
            Object.assign(totalTranslatedContent, batchResult.translatedContent);
            totalTokensUsed.inputTokens += batchResult.tokensUsed.inputTokens;
            totalTokensUsed.outputTokens += batchResult.tokensUsed.outputTokens;

            this.outputChannel.appendLine(`Batch ${i + 1} translated. Tokens used: Input: ${batchResult.tokensUsed.inputTokens}, Output: ${batchResult.tokensUsed.outputTokens}`);
        }

        return { translatedContent: totalTranslatedContent, tokensUsed: totalTokensUsed };
    }

    private splitIntoBatches(obj: any, batchSize: number): any[] {
        const result: any[] = [];
        let currentBatch: any = {};
        let currentSize = 0;

        for (const [key, value] of Object.entries(obj)) {
            if (currentSize >= batchSize) {
                result.push(currentBatch);
                currentBatch = {};
                currentSize = 0;
            }
            currentBatch[key] = value;
            currentSize++;
        }

        if (currentSize > 0) {
            result.push(currentBatch);
        }

        return result;
    }

    public async validateTranslation(originalContent: any, translatedContent: any, targetLang: string): Promise<ValidationResult> {
        this.logger.log(`Starting translation validation for ${targetLang}`);
        try {
            const result = await this.provider.validateTranslation(originalContent, translatedContent, targetLang);
            this.logger.log(`Translation validation for ${targetLang} completed`);
            this.logger.log(`Validation tokens used: Input: ${result.tokensUsed.inputTokens}, Output: ${result.tokensUsed.outputTokens}`);
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Translation validation failed: ${errorMessage}`, error);
            vscode.window.showErrorMessage(`Translation validation failed: ${errorMessage}`);
            throw error;
        }
    }

    public getProviderName(): string {
        return this.provider.getProviderName();
    }
}