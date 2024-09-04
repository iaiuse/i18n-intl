import * as vscode from 'vscode';
import { Logger } from './logger';

interface LanguageItem extends vscode.QuickPickItem {
    code: string;
    selected: boolean;
}

export class LanguageSelector {
    private languageOptions: LanguageItem[] = [
        { label: "🇺🇸 English", code: "en", selected: false, description: "" },
        { label: "🇨🇳 简体中文", code: "zh-CN", selected: false, description: "" },
        { label: "🇹🇼 繁體中文", code: "zh-TW", selected: false, description: "" },
        { label: "🇪🇸 Español", code: "es", selected: false, description: "" },
        { label: "🇫🇷 Français", code: "fr", selected: false, description: "" },
        { label: "🇩🇪 Deutsch", code: "de", selected: false, description: "" },
        { label: "🇯🇵 日本語", code: "ja", selected: false, description: "" },
        { label: "🇰🇷 한국어", code: "ko", selected: false, description: "" },
        { label: "🇸🇦 العربية", code: "ar", selected: false, description: "" },
        { label: "🇵🇹 Português", code: "pt", selected: false, description: "" },
        { label: "🇷🇺 Русский", code: "ru", selected: false, description: "" }
    ];

    private logger: Logger;
    private outputChannel: vscode.OutputChannel;

    constructor(logger: Logger, channel: vscode.OutputChannel) {
        this.logger = logger;
        this.outputChannel = channel;
        this.logger.log('LanguageSelector initialized');
        this.loadSelectedLanguages();
    }

    public async showLanguageSelector(): Promise<string[] | undefined> {
        this.logger.log('showLanguageSelector method called');

        const quickPick = vscode.window.createQuickPick<LanguageItem>();
        quickPick.items = this.languageOptions;
        quickPick.canSelectMany = true;
        quickPick.title = 'Select Target Languages';
        quickPick.placeholder = 'Toggle languages to translate to';
        quickPick.selectedItems = this.languageOptions.filter(lang => lang.selected);

        quickPick.onDidChangeSelection(selection => {
            this.languageOptions.forEach(lang => {
                lang.selected = selection.some(item => item.code === lang.code);
                this.updateDescription(lang);
            });
            quickPick.items = [...this.languageOptions];
            this.logger.log(`Selection changed: ${selection.map(item => item.code).join(', ')}`);
        });

        quickPick.buttons = [vscode.QuickInputButtons.Back];
        quickPick.onDidTriggerButton(button => {
            if (button === vscode.QuickInputButtons.Back) {
                quickPick.hide();
            }
        });

        return new Promise<string[] | undefined>((resolve) => {
            quickPick.onDidAccept(async () => {
                await this.saveSelectedLanguages();
                const selectedLanguages = this.getSelectedLanguages();
                vscode.window.showInformationMessage(`Target languages updated: ${selectedLanguages.join(', ')}`);
                this.logger.log(`Target languages updated: ${selectedLanguages.join(', ')}`);
                quickPick.hide();
                resolve(selectedLanguages);
            });

            quickPick.onDidHide(() => {
                quickPick.dispose();
                resolve(undefined);
            });

            quickPick.show();
        });
    }

    private updateDescription(lang: LanguageItem) {
        lang.description = lang.selected ? "✅ Selected" : "❌ Not Selected";
    }

    public getSelectedLanguages(): string[] {
        const selected = this.languageOptions.filter(lang => lang.selected).map(lang => lang.code);
        this.logger.log(`Getting selected languages: ${selected.join(', ')}`);
        return selected;
    }

    private async saveSelectedLanguages() {
        const config = vscode.workspace.getConfiguration('i18nNexus');
        const selectedLanguages = this.languageOptions.reduce((acc, lang) => {
            acc[lang.code] = lang.selected;
            return acc;
        }, {} as Record<string, boolean>);
        
        await config.update('targetLanguages', selectedLanguages, vscode.ConfigurationTarget.Global);
        this.logger.log(`Saved selected languages to configuration: ${JSON.stringify(selectedLanguages)}`);
    }

    private loadSelectedLanguages() {
        const config = vscode.workspace.getConfiguration('i18nNexus');
        const targetLanguages = config.get('targetLanguages') as Record<string, boolean>;

        this.languageOptions.forEach(lang => {
            lang.selected = targetLanguages[lang.code] || false;
            this.updateDescription(lang);
        });
        this.logger.log(`Loaded selected languages from configuration: ${JSON.stringify(targetLanguages)}`);
    }

    public getLanguageItems(): vscode.TreeItem[] {
        this.logger.log('Getting language items for command center');
        return this.languageOptions.map(lang => {
            const treeItem = new vscode.TreeItem(lang.label, vscode.TreeItemCollapsibleState.None);
            treeItem.description = lang.selected ? "Selected" : "Not Selected";
            treeItem.contextValue = lang.selected ? "selectedLanguage" : "unselectedLanguage";
            treeItem.checkboxState = lang.selected ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;
            treeItem.command = {
                command: 'i18nNexus.toggleLanguage',
                title: 'Toggle Language',
                arguments: [lang.code]
            };
            return treeItem;
        });
    }

    public toggleLanguage(languageCode: string) {
        const lang = this.languageOptions.find(l => l.code === languageCode);
        if (lang) {
            lang.selected = !lang.selected;
            this.updateDescription(lang);
            this.saveSelectedLanguages();
            this.logger.log(`Toggled language ${languageCode}, new state: ${lang.selected ? 'selected' : 'unselected'}`);
            this.refreshTreeView();
            return lang.selected;
        }
        this.logger.log(`Failed to toggle language ${languageCode}: language not found`);
        return false;
    }

    private refreshTreeView() {
        vscode.commands.executeCommand('i18nNexus.refreshTreeView');
    }
}