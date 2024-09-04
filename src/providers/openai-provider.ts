import * as vscode from 'vscode';
import OpenAI from 'openai';
import { ILLMProvider, TranslationResult, ValidationResult, TokenUsage } from '../llm-provider.interface';
import { Logger } from '../logger';

export class OpenAIProvider implements ILLMProvider {
    private client!: OpenAI;
    private logger!: Logger;
    private llmModel!: string;
    

    initialize(config: vscode.WorkspaceConfiguration, logger: Logger): void {
        const apiKey = config.get('llmApiKey');
        const apiUrl = config.get('llmApiUrl');
        this.llmModel = config.get('llmModel') || 'gpt-3.5-turbo';
        this.logger = logger || { log: console.log, error: console.error };

        if (typeof apiKey !== 'string' || apiKey.trim() === '') {
            throw new Error('Invalid or missing OpenAI API key');
        }

        this.client = new OpenAI({ apiKey });
        
        if (typeof apiUrl === 'string' && apiUrl.trim() !== '') {
            this.client.baseURL = apiUrl;
            this.logger.log(`Using custom API URL: ${apiUrl}`);
        }
        //this.logger = logger;
        // 添加安全检查
        
        this.logger.log('OpenAIProvider initialized');
    }

    async translate(content: any, targetLang: string): Promise<TranslationResult> {
        this.logger.log(`OpenAI: Starting translation to ${targetLang}`);
        const prompt = this.generatePrompt(content, targetLang);
        
        try {
            const result = await this.callAPI(prompt);
            const parsedResponse = this.parseResponse(result.content);
            this.logger.log(`OpenAI: Translation to ${targetLang} completed`);
            return {
                translatedContent: parsedResponse,
                tokensUsed: result.tokensUsed
            };
        } catch (error) {
            this.logger.error('OpenAI: Translation failed', error);
            throw error;
        }
    }

    async compareAndUpdate(oldContent: any, newContent: any, targetLang: string): Promise<any> {
        this.logger.log(`OpenAI: Starting compare and update for ${targetLang}`);
        const prompt = this.generateCompareAndUpdatePrompt(oldContent, newContent, targetLang);
        
        try {
            const response = await this.callAPI(prompt);
            const parsedResponse = this.parseResponse(response.content);
            this.logger.log(`OpenAI: Compare and update for ${targetLang} completed`);
            return parsedResponse;
        } catch (error) {
            this.logger.error('OpenAI: Compare and update failed', error);
            throw error;
        }
    }

    async validateTranslation(originalContent: any, translatedContent: any, targetLang: string): Promise<ValidationResult> {
        this.logger.log(`OpenAI: Starting translation validation for ${targetLang}`);
        const prompt = this.generateValidationPrompt(originalContent, translatedContent, targetLang);
        
        try {
            const result = await this.callAPI(prompt);
            const isValid = this.parseValidationResponse(result.content);
            this.logger.log(`OpenAI: Translation validation for ${targetLang} completed`);
            return {
                isValid,
                tokensUsed: result.tokensUsed
            };
        } catch (error) {
            this.logger.error('OpenAI: Translation validation failed', error);
            throw error;
        }
    }

    getProviderName(): string {
        return 'OpenAI';
    }

    private generatePrompt(content: any, targetLang: string): string {
        return `Translate the following JSON content to ${targetLang}. Maintain the JSON structure and keys. Only translate the values. Ensure the translation is culturally appropriate and uses common expressions in the target language:\n\n${JSON.stringify(content, null, 2)}`;
    }

    private generateCompareAndUpdatePrompt(oldContent: any, newContent: any, targetLang: string): string {
        return `Compare the following two JSON structures. The first is the old content, and the second is the new content. Translate only the changed or new parts in the new content to ${targetLang}. Maintain the JSON structure and keys. Ensure the translation is culturally appropriate and uses common expressions in the target language.\n\nOld content:\n${JSON.stringify(oldContent, null, 2)}\n\nNew content:\n${JSON.stringify(newContent, null, 2)}`;
    }

    private generateValidationPrompt(originalContent: any, translatedContent: any, targetLang: string): string {
        return `Validate the following translation from the original language to ${targetLang}. Check if the translation maintains the correct meaning, is culturally appropriate, and uses common expressions in the target language. Respond with 'true' if the translation is correct, or 'false' if there are any issues.\n\nOriginal content:\n${JSON.stringify(originalContent, null, 2)}\n\nTranslated content:\n${JSON.stringify(translatedContent, null, 2)}`;
    }


    private async callAPI(prompt: string): Promise<{ content: string; tokensUsed: TokenUsage }> {
        this.logger.log('OpenAI: Calling API');
        this.logger.log(`user prompt: ${prompt}`);
        try {
            const completion = await this.client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: this.llmModel,
            });
            const result = completion.choices[0].message.content || '';
            this.logger.log(`llm result: ${result}`);
            const tokensUsed: TokenUsage = {
                inputTokens: completion.usage?.prompt_tokens || 0,
                outputTokens: completion.usage?.completion_tokens || 0
            };
            this.logger.log('OpenAI: API call successful');
            return { content: result, tokensUsed };
        } catch (error) {
            this.logger.error('OpenAI: API call failed', error);
            throw error;
        }
    }

    private parseResponse(response: string): any {
        this.logger.log('OpenAI: Parsing response');
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                this.logger.log('OpenAI: JSON part extracted successfully');
                return JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No valid JSON found in the response");
            }
        } catch (error) {
            this.logger.error('OpenAI: Failed to parse response as JSON');
            throw new Error("Failed to parse OpenAI response as JSON");
        }
    }

    private parseValidationResponse(response: string): boolean {
        this.logger.log('OpenAI: Parsing validation response');
        return response.toLowerCase().includes('true');
    }
}