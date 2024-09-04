import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { LLMService } from './llmService';
import { Logger } from './logger';
import { execSync } from 'child_process';

interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
}

// 定义差异结果接口
interface DiffResult {
    added: Record<string, any>; // 新增的键值对
    modified: Record<string, any>; // 修改的键值对
    deleted: string[]; // 删除的键
}

export class TranslationManager {
    private llmService: LLMService;
    private logger: Logger;
    private outputChannel: vscode.OutputChannel;
    private totalTokens: TokenUsage = { inputTokens: 0, outputTokens: 0 };
    private pauseBetweenLanguages: number = 1000; // 默认每种语言翻译之间暂停 1 秒

    constructor(logger: Logger, channel: vscode.OutputChannel) {
        this.llmService = new LLMService(logger, channel);
        this.logger = logger;
        this.outputChannel = channel;
        this.logger.log('TranslationManager initialized');
        this.outputChannel.appendLine('i18n Nexus Translation Manager initialized');
    }

    // 翻译主函数
    public async translate() {
        this.logger.log('translate method called');
        this.outputChannel.appendLine('Starting translation process...');
        this.totalTokens = { inputTokens: 0, outputTokens: 0 };

        // 获取配置
        const config = vscode.workspace.getConfiguration('i18nNexus');
        const basePath = config.get<string>('basePath'); // 翻译文件路径
        const baseLanguage = config.get<string>('baseLanguage'); // 基准语言
        const targetLanguagesConfig = config.get<Record<string, boolean>>('targetLanguages'); // 目标语言配置
        const llmModel = config.get<string>('llmModel') || 'default'; // LLM 模型
        const providerName = config.get('llmProvider') || 'openai'; // LLM 提供商

        // 验证配置
        if (!this.validateConfig(basePath, baseLanguage, targetLanguagesConfig)) {
            return;
        }

        // 确保 baseLanguage 不是 undefined
        if (!baseLanguage) {
            this.logger.error('Base language is not defined');
            this.outputChannel.appendLine('Error: Base language is not defined');
            vscode.window.showErrorMessage('Base language is not defined. Please check your settings.');
            return;
        }

        // 获取启用的目标语言
        const targetLanguages = Object.entries(targetLanguagesConfig!)
            .filter(([_, isEnabled]) => isEnabled)
            .map(([lang, _]) => lang);

        // 输出翻译信息
        this.outputChannel.appendLine(`Base Language: ${baseLanguage}`);
        this.outputChannel.appendLine(`Target Languages: ${targetLanguages.join(', ')}`);
        this.outputChannel.appendLine(`LLM provider: ${providerName}`);
        this.outputChannel.appendLine(`LLM Model: ${llmModel}`);

        // 获取工作区文件夹
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            this.logger.error('No workspace folder found');
            this.outputChannel.appendLine('Error: No workspace folder found');
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        // 获取翻译文件路径
        const messagesPath = path.join(workspaceFolders[0].uri.fsPath, basePath!);
        const baseFilePath = path.join(messagesPath, `${baseLanguage}.json`); // 基准语言文件路径

        // 检查基准语言文件是否存在
        if (!fs.existsSync(baseFilePath)) {
            this.logger.error(`Base language file ${baseLanguage}.json not found`);
            this.outputChannel.appendLine(`Error: Base language file ${baseLanguage}.json not found`);
            vscode.window.showErrorMessage(`Base language file ${baseLanguage}.json not found`);
            return;
        }

        // 读取基准语言文件内容
        let baseContent: any;
        try {
            baseContent = JSON.parse(fs.readFileSync(baseFilePath, 'utf8'));
            this.outputChannel.appendLine(`Base content loaded from ${baseFilePath}`);
        } catch (error) {
            this.logger.error(`Error reading base language file: ${error}`);
            this.outputChannel.appendLine(`Error reading base language file: ${error}`);
            vscode.window.showErrorMessage(`Error reading base language file: ${error}`);
            return;
        }

        // 遍历目标语言进行翻译
        for (const lang of targetLanguages) {
            if (lang !== baseLanguage) {
                this.outputChannel.appendLine(`\nTranslating to ${lang}...`);
                this.outputChannel.appendLine(`Base Language: ${baseLanguage}, Target Language: ${lang}, LLM provider: ${providerName}, LLM Model: ${llmModel}`);
                try {
                    // 翻译单个语言
                    const tokensUsed = await this.translateLanguage(messagesPath, lang, baseContent, baseLanguage);
                    this.totalTokens.inputTokens += tokensUsed.inputTokens;
                    this.totalTokens.outputTokens += tokensUsed.outputTokens;
                    this.outputChannel.appendLine(`Tokens used for ${lang}: Input: ${tokensUsed.inputTokens}, Output: ${tokensUsed.outputTokens}`);

                    // 在每种语言之间添加暂停
                    if (this.pauseBetweenLanguages > 0) {
                        this.outputChannel.appendLine(`Pausing for ${this.pauseBetweenLanguages}ms before next language...`);
                        await this.pause(this.pauseBetweenLanguages);
                    }
                } catch (error) {
                    this.logger.error(`Error translating ${lang}: ${error}`);
                    this.outputChannel.appendLine(`Error translating ${lang}: ${error}`);
                    vscode.window.showWarningMessage(`Error translating ${lang}. Skipping to next language.`);
                    continue;
                }
            }
        }

        this.outputChannel.appendLine(`\nTranslation process completed. Total tokens used: Input: ${this.totalTokens.inputTokens}, Output: ${this.totalTokens.outputTokens}`);
        vscode.window.showInformationMessage(`Translation completed. Total tokens used: Input: ${this.totalTokens.inputTokens}, Output: ${this.totalTokens.outputTokens}`);
    }

    // 暂停函数
    private pause(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 验证配置函数
    private validateConfig(basePath?: string, baseLanguage?: string, targetLanguagesConfig?: Record<string, boolean>): boolean {
        if (!basePath || typeof basePath !== 'string') {
            this.logger.error('Invalid or missing basePath configuration');
            this.outputChannel.appendLine('Error: Invalid or missing basePath configuration');
            vscode.window.showErrorMessage('Invalid or missing basePath configuration. Please check your settings.');
            return false;
        }

        if (!baseLanguage || typeof baseLanguage !== 'string') {
            this.logger.error('Invalid or missing baseLanguage configuration');
            this.outputChannel.appendLine('Error: Invalid or missing baseLanguage configuration');
            vscode.window.showErrorMessage('Invalid or missing baseLanguage configuration. Please check your settings.');
            return false;
        }

        if (!targetLanguagesConfig || typeof targetLanguagesConfig !== 'object') {
            this.logger.error('Invalid or missing targetLanguages configuration');
            this.outputChannel.appendLine('Error: Invalid or missing targetLanguages configuration');
            vscode.window.showErrorMessage('Invalid or missing targetLanguages configuration. Please check your settings.');
            return false;
        }

        const enabledLanguages = Object.values(targetLanguagesConfig).filter(Boolean).length;
        if (enabledLanguages === 0) {
            this.logger.error('No target languages enabled');
            this.outputChannel.appendLine('Error: No target languages enabled');
            vscode.window.showErrorMessage('No target languages enabled. Please enable at least one target language in your settings.');
            return false;
        }

        return true;
    }

    // 获取基准语言文件的变更
    private getBaseChanges(messagesPath: string, baseLanguage: string): Record<string, any> {
        const baseFilePath = path.join(messagesPath, `${baseLanguage}.json`);
        const changes: Record<string, any> = {};

        try {
            // 首先检查是否在 Git 仓库中
            const isGitRepo = this.isGitRepository(messagesPath);
            if (!isGitRepo) {
                this.logger.warn('Not a Git repository. Skipping base changes detection.');
                return changes;
            }

            // 使用相对路径
            const relativeFilePath = path.relative(process.cwd(), baseFilePath);

            // 执行 Git 命令获取差异
            const gitDiff = execSync(`git diff HEAD~1 HEAD -- "${relativeFilePath}"`, {
                encoding: 'utf-8',
                cwd: messagesPath // 设置工作目录为 messagesPath
            });

            const lines = gitDiff.split('\n');
            let currentKey = '';

            // 解析 Git 差异
            for (const line of lines) {
                if (line.startsWith('+') && line.includes(':')) {
                    const [key, value] = line.substring(1).split(':').map(s => s.trim());
                    currentKey = key.replace(/"/g, '');
                    if (value) {
                        changes[currentKey] = JSON.parse(value);
                    }
                } else if (line.startsWith('+') && currentKey) {
                    changes[currentKey] += line.substring(1);
                }
            }

            // 解析可能为 JSON 格式的字符串值
            for (const key in changes) {
                if (typeof changes[key] === 'string') {
                    try {
                        changes[key] = JSON.parse(changes[key]);
                    } catch (e) {
                        // 如果不是有效的 JSON，则保留为字符串
                    }
                }
            }
        } catch (error) {
            this.logger.error(`Error getting base changes: ${error}`);
            // 如果出错，返回空的 changes 对象，而不是抛出异常
        }

        return changes;
    }

    // 检查是否为 Git 仓库
    private isGitRepository(directory: string): boolean {
        try {
            execSync('git rev-parse --is-inside-work-tree', {
                cwd: directory,
                stdio: 'ignore'
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    // 翻译单个语言
    private async translateLanguage(messagesPath: string, lang: string, baseContent: any, baseLanguage: string): Promise<TokenUsage> {
        this.logger.log(`translateLanguage method called for ${lang}`);
        this.outputChannel.appendLine(`Processing ${lang}...`);
    
        const targetFilePath = path.join(messagesPath, `${lang}.json`);
        let targetContent = {};
        let originalBaseContent = {};
    
        // 加载目标语言文件
        if (fs.existsSync(targetFilePath)) {
            targetContent = JSON.parse(fs.readFileSync(targetFilePath, 'utf8'));
            this.outputChannel.appendLine(`Existing content loaded for ${lang}`);
        } else {
            this.outputChannel.appendLine(`No existing content found for ${lang}, starting fresh`);
        }
    
        // 加载原始基准语言文件
        const originalBaseFilePath = path.join(messagesPath, `${baseLanguage}.json.original`);
        if (fs.existsSync(originalBaseFilePath)) {
            originalBaseContent = JSON.parse(fs.readFileSync(originalBaseFilePath, 'utf8'));
        } else {
            // 如果原始文件不存在，则使用当前基准文件作为原始文件
            originalBaseContent = baseContent;
            fs.writeFileSync(originalBaseFilePath, JSON.stringify(baseContent, null, 2));
        }
    
        // 获取差异，包括原始基准内容
        const diff = this.getDiff(baseContent, targetContent, originalBaseContent);
        const baseChanges = this.getBaseChanges(messagesPath, baseLanguage);
    
        const toTranslate = { ...diff.added, ...diff.modified, ...baseChanges };
    
        if (Object.keys(toTranslate).length === 0) {
            this.outputChannel.appendLine(`No changes detected for ${lang}`);
            return { inputTokens: 0, outputTokens: 0 };
        }
    
        this.outputChannel.appendLine(`Translating ${Object.keys(toTranslate).length} keys...`);
    
        // 使用批量翻译方法
        const { translatedContent, tokensUsed } = await this.llmService.translate(toTranslate, lang);
    
        // 合并翻译后的内容和目标语言文件内容
        const newContent = this.mergeContents(targetContent, translatedContent, diff.deleted);
    
        // 验证翻译结果
        this.outputChannel.appendLine('Validating translation...');
        const { isValid, tokensUsed: validationTokens } = await this.llmService.validateTranslation(baseContent, newContent, lang);
        if (!isValid) {
            this.logger.warn(`Translation validation failed for ${lang}`);
            this.outputChannel.appendLine(`Warning: Translation validation failed for ${lang}. Please review the changes manually.`);
            vscode.window.showWarningMessage(`Translation validation failed for ${lang}. Please review the changes manually.`);
        } else {
            this.outputChannel.appendLine('Translation validation passed.');
        }
    
        // 将翻译后的内容写入目标语言文件
        fs.writeFileSync(targetFilePath, JSON.stringify(newContent, null, 2));
        this.outputChannel.appendLine(`Updated content written to ${targetFilePath}`);
    
        // 更新原始基准文件
        fs.writeFileSync(originalBaseFilePath, JSON.stringify(baseContent, null, 2));
    
        return {
            inputTokens: tokensUsed.inputTokens + validationTokens.inputTokens,
            outputTokens: tokensUsed.outputTokens + validationTokens.outputTokens
        };
    }

    // 获取两个 JSON 对象的差异
    private getDiff(baseContent: any, targetContent: any, originalBaseContent: any): DiffResult {
        const added: Record<string, any> = {};
        const modified: Record<string, any> = {};
        const deleted: string[] = [];
    
        // 递归比较
        this.diffRecursive(baseContent, targetContent, originalBaseContent, added, modified, deleted);
    
        this.logger.log(`Diff result: added=${Object.keys(added).length}, modified=${Object.keys(modified).length}, deleted=${deleted.length}`);
        return { added, modified, deleted };
    }
    
    private diffRecursive(base: any, target: any, originalBase: any, added: Record<string, any>, modified: Record<string, any>, deleted: string[], path: string = '') {
        // 遍历基准对象
        for (const key in base) {
            const newPath = path ? `${path}.${key}` : key;
            if (!(key in target)) {
                // 如果目标对象中不存在该键，则添加到 added
                added[newPath] = base[key];
            } else if (typeof base[key] === 'object' && base[key] !== null) {
                // 如果是对象，则递归比较
                this.diffRecursive(base[key], target[key], originalBase ? originalBase[key] : undefined, added, modified, deleted, newPath);
            } else if (base[key] !== target[key]) {
                // 只有当基准语言的值改变时，才标记为需要修改
                const originalValue = this.getNestedValue(originalBase, newPath);
                if (base[key] !== originalValue) {
                    modified[newPath] = base[key];
                }
            }
        }
    
        // 遍历目标对象
        for (const key in target) {
            const newPath = path ? `${path}.${key}` : key;
            // 如果基准对象中不存在该键，则添加到 deleted
            if (!(key in base)) {
                deleted.push(newPath);
            }
        }
    }

    // 获取原始基础内容
    // 从 Git 获取原始基础内容
    private getOriginalBaseContent(filePath: string): any {
        try {
            // 获取文件的上一个版本内容
            const gitCommand = `git show HEAD~1:"${path.relative(process.cwd(), filePath)}"`;
            const output = execSync(gitCommand, { encoding: 'utf-8' });
            return JSON.parse(output);
        } catch (error) {
            this.logger.warn(`无法从 Git 获取原始内容: ${error}`);
            // 如果无法获取 Git 历史，则返回当前文件内容
            return this.loadJsonFile(filePath);
        }
    }

    // 准备翻译内容
    private prepareTranslationContent(baseContent: any, targetContent: any, originalBaseContent: any): any {
        const toTranslate: any = {};
        this.deepCompare(baseContent, targetContent, originalBaseContent, toTranslate);
        return toTranslate;
    }

    // 深度比较并准备翻译内容
    private deepCompare(base: any, target: any, original: any, result: any, currentPath: string = '') {
        for (const key in base) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            if (typeof base[key] === 'object' && base[key] !== null) {
                if (!(key in target) || typeof target[key] !== 'object') {
                    result[newPath] = base[key];
                } else {
                    if (!(newPath in result)) result[newPath] = {};
                    this.deepCompare(base[key], target[key], original[key] || {}, result[newPath], newPath);
                    if (Object.keys(result[newPath]).length === 0) delete result[newPath];
                }
            } else {
                if (!(key in target) || target[key] === '' || 
                    (original && this.getNestedValue(original, newPath) !== base[key]) ||
                    (target[key] !== base[key])) {
                    result[newPath] = base[key];
                }
            }
        }

        // 移除目标中多余的键
        for (const key in target) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            if (!(key in base)) {
                result[newPath] = null;  // 标记为删除
            }
        }
    }
    
    // 辅助方法：获取嵌套对象的值
    // 获取嵌套对象的值
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((o, i) => o ? o[i] : undefined, obj);
    }

    // 合并翻译后的内容和目标语言文件内容
    private mergeContents(baseContent: any, targetContent: any, translatedContent: any): any {
        const merged = JSON.parse(JSON.stringify(baseContent));

        for (const key in translatedContent) {
            if (translatedContent[key] === null) {
                this.deleteNestedProperty(merged, key);
            } else {
                this.setNestedProperty(merged, key, translatedContent[key]);
            }
        }

        return merged;
    }

    // 设置嵌套属性值
    private setNestedProperty(obj: any, path: string, value: any) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
    }

    // 删除嵌套属性
    private deleteNestedProperty(obj: any, path: string) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
                return;
            }
            current = current[keys[i]];
        }
        delete current[keys[keys.length - 1]];
    }


    // 翻译特定文件的方法
    // 修改 translateFile 方法
    public async translateFile(fileUri: vscode.Uri) {
        const filePath = fileUri.fsPath;
        this.logger.log(`正在翻译文件: ${filePath}`);

        const config = vscode.workspace.getConfiguration('i18nNexus');
        const basePath = config.get<string>('basePath');
        const baseLanguage = config.get<string>('baseLanguage');

        if (!basePath || !baseLanguage) {
            vscode.window.showErrorMessage('基础路径或基础语言未配置。');
            return;
        }

        const workspaceRoot = vscode.workspace.rootPath || '';
        const fullBasePath = path.join(workspaceRoot, basePath);
        const fileName = path.basename(filePath);
        const lang = path.parse(fileName).name;

        if (lang === baseLanguage) {
            vscode.window.showInformationMessage('这是基础语言文件，无需翻译。');
            return;
        }

        const baseFilePath = path.join(fullBasePath, `${baseLanguage}.json`);
        const targetFilePath = filePath;

        if (!fs.existsSync(baseFilePath)) {
            vscode.window.showErrorMessage(`找不到基础语言文件: ${baseFilePath}`);
            return;
        }

        try {
            const baseContent = this.loadJsonFile(baseFilePath);
            const targetContent = fs.existsSync(targetFilePath) ? this.loadJsonFile(targetFilePath) : {};
            const originalBaseContent = this.getOriginalBaseContent(baseFilePath);

            const toTranslate = this.prepareTranslationContent(baseContent, targetContent, originalBaseContent);

            if (Object.keys(toTranslate).length === 0) {
                vscode.window.showInformationMessage('未检测到变化，无需翻译。');
                return;
            }

            const { translatedContent, tokensUsed } = await this.llmService.translate(toTranslate, lang);

            const newContent = this.mergeContents(baseContent, targetContent, translatedContent);

            fs.writeFileSync(targetFilePath, JSON.stringify(newContent, null, 2));
            vscode.window.showInformationMessage(`${lang} 的翻译已完成`);

            this.totalTokens.inputTokens += tokensUsed.inputTokens;
            this.totalTokens.outputTokens += tokensUsed.outputTokens;
        } catch (error) {
            this.logger.error(`翻译过程中出错: ${error}`);
            vscode.window.showErrorMessage(`翻译失败: ${error}`);
        }
    }

    
   

    // 加载JSON文件的方法
    private loadJsonFile(filePath: string): any {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
            this.logger.error(`加载 JSON 文件出错: ${filePath}`);
            throw error;
        }
    }
}