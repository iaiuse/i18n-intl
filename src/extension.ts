// vscode 模块包含 VS Code 可扩展性 API
// 导入模块并在下面的代码中使用别名 vscode 引用它
import * as vscode from 'vscode';
import { TranslationManager } from './translationManager';
import { LanguageSelector } from './languageSelector';
import { ModelConfigurator } from './modelConfigurator';
import { Logger } from './logger';
// 当扩展首次激活时调用此方法
export function activate(context: vscode.ExtensionContext) {
    const channel = vscode.window.createOutputChannel('i18n Nexus');
    const logger = new Logger(channel);
    logger.log('i18n Nexus activation started');


    const translationManager = new TranslationManager(logger, channel);
    const modelConfigurator = new ModelConfigurator(logger, channel);


    logger.log('All managers initialized');

    const showConfigDisposable = vscode.commands.registerCommand('i18n-nexus.showConfig', () => {
        const config = vscode.workspace.getConfiguration('i18nNexus');
        const configObject = {
            basePath: config.get('basePath'),
            baseLanguage: config.get('baseLanguage'),
            targetLanguages: config.get('targetLanguages'),
            llmProvider: config.get('llmProvider'),
            llmApiKey: '******', // 为了安全，不显示实际的 API 密钥
            llmApiUrl: config.get('llmApiUrl'),
            // 添加其他配置项...
        };

        const configJson = JSON.stringify(configObject, null, 2);

        // 创建并显示输出通道
        // const channel = vscode.window.createOutputChannel('i18n Nexus Configuration');
        channel.appendLine('Current i18n Nexus Configuration:');
        channel.appendLine(configJson);
        channel.show();

        // 同时在信息提示中显示简略信息
        logger.toggleDebugOutput();
        vscode.window.showInformationMessage(`${logger.isDebugEnabled() ? 'd-' : ''}i18n Nexus configuration has been output to the "i18n Nexus Configuration" channel.`);
    });

    context.subscriptions.push(showConfigDisposable);

    // 注册翻译命令
    let translateDisposable = vscode.commands.registerCommand('i18n-nexus.translateFiles', () => {
        console.log('翻译命令被触发');
        try {
            translationManager.translate().catch(error => {
                console.error('翻译过程中发生错误:', error);
                vscode.window.showErrorMessage(`翻译失败: ${error.message}`);
            });
            console.log('翻译操作完成');
        } catch (error) {
            console.error('翻译过程中发生错误:', error);
            if (error instanceof Error) {
                vscode.window.showErrorMessage(`翻译失败: ${error.message}`);
            } else {
                vscode.window.showErrorMessage('翻译过程中发生未知错误');
            }
        }
    });

    // 注册配置模型命令
    let configureModelDisposable = vscode.commands.registerCommand('i18n-nexus.configureModel', () => {
        logger.log('Configure model command triggered');
        modelConfigurator.configureModel();
    });
    logger.log('Configure model command registered');

    // 注册切换调试输出命令
    let toggleDebugOutputDisposable = vscode.commands.registerCommand('i18n-nexus.toggleDebugOutput', () => {
        logger.toggleDebugOutput();
        vscode.window.showInformationMessage(`Debug output ${logger.isDebugEnabled() ? 'enabled' : 'disabled'}`);
    });
    logger.log('Toggle debug output command registered');

    context.subscriptions.push(
        translateDisposable,
        configureModelDisposable,
        toggleDebugOutputDisposable
    );


    // 在 extension.ts 文件中添加以下代码

    // 注册翻译当前文件命令
    let translateCurrentFileDisposable = vscode.commands.registerCommand('i18n-nexus.translateCurrentFile', () => {
        logger.log('Translate current file command triggered');
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            translationManager.translateFile(activeEditor.document.uri);
        } else {
            vscode.window.showErrorMessage('No active file to translate');
        }
    });


    // 注册打开设置命令
    let openSettingsDisposable = vscode.commands.registerCommand('i18n-nexus.openSettings', () => {
        logger.log('Open settings command triggered');
        vscode.commands.executeCommand('workbench.action.openSettings', 'i18nNexus');
    });

    // 将新注册的命令添加到 context.subscriptions
    context.subscriptions.push(
        translateCurrentFileDisposable,
        openSettingsDisposable
    );

    logger.log('All commands registered and added to subscriptions');

    vscode.window.showInformationMessage('i18n Nexus has been successfully activated');
}

// 当扩展被停用时调用此函数
export function deactivate() {
    console.log('i18n Nexus is being deactivated');
}
