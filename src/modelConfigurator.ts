import * as vscode from 'vscode';
import { Logger } from './logger';

export class ModelConfigurator {
    private logger: Logger;

    private outputChannel: vscode.OutputChannel;

    constructor(logger: Logger, channel: vscode.OutputChannel) {
        this.logger = logger;
        this.outputChannel = channel;
        this.logger.log('ModelConfigurator initialized');
    }

    // 配置AI模型
    public async configureModel() {
        this.logger.log('configureModel method called');

        const config = vscode.workspace.getConfiguration('i18nNexus');
        const currentProvider = config.get('llmProvider') as string;
        const currentModel = config.get('llmModel') as string;

        // 准备LLM提供商选项
        const providerOptions: vscode.QuickPickItem[] = [
            'openai', 'gemini', 'claude',"openai-compatible"
        ].map(provider => ({
            label: provider,
            description: provider === currentProvider ? '(current)' : ''
        }));

        this.logger.log(`Current provider: ${currentProvider}, Current model: ${currentModel}`);

        // 选择LLM提供商
        const selectedProvider = await vscode.window.showQuickPick(providerOptions, {
            placeHolder: 'Select LLM provider'
        });

        if (selectedProvider) {
            const provider = selectedProvider.label;
            this.logger.log(`Selected provider: ${provider}`);

            // 更新LLM提供商
            await config.update('llmProvider', provider, vscode.ConfigurationTarget.Global);
            this.logger.log(`Updated llmProvider to: ${provider}`);

            // 输入模型名称
            const model = await vscode.window.showInputBox({
                prompt: `Enter the model name for ${provider}`,
                value: currentModel
            });

            if (model) {
                await config.update('llmModel', model, vscode.ConfigurationTarget.Global);
                this.logger.log(`Updated llmModel to: ${model}`);
            }

            // 输入API URL
            const apiUrl = await vscode.window.showInputBox({
                prompt: `Enter the API URL for ${provider}`,
                value: config.get('llmApiUrl') as string
            });

            if (apiUrl) {
                await config.update('llmApiUrl', apiUrl, vscode.ConfigurationTarget.Global);
                this.logger.log(`Updated llmApiUrl to: ${apiUrl}`);
            }

            // 输入API Key
            const apiKey = await vscode.window.showInputBox({
                prompt: `Enter the API Key for ${provider}`,
                value: config.get('llmApiKey') as string,
                password: true
            });

            if (apiKey) {
                await config.update('llmApiKey', apiKey, vscode.ConfigurationTarget.Global);
                this.logger.log('Updated llmApiKey (value hidden for security)');
            }

            vscode.window.showInformationMessage(`AI model configuration updated for ${provider}`);
            this.logger.log(`AI model configuration completed for ${provider}`);
        } else {
            this.logger.log('Model configuration cancelled');
        }
    }
}