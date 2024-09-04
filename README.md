# i18n Nexus

English | [中文](./README_zh.md)

**i18n Nexus** is your ultimate localization companion for `next-intl` projects. Streamline your internationalization workflow with AI-powered translations, smart incremental updates, and collaborative feedback tools.

## Why Choose i18n Nexus?

When developing multilingual applications, we often face the following challenges:

1. **Time-consuming translation process**: Traditional methods require frequent translation of entire files, even when only a small portion of the content has changed.
2. **Difficulty in file synchronization**: When content is added or deleted in the base language file, ensuring all target language files are synchronized is a tedious task.
3. **Complex management of large JSON files**: As projects grow, manually managing and updating large language JSON files becomes extremely difficult and prone to errors.

## Key Features

- 🚀 **AI-Powered Translations**: Leverage cutting-edge LLM technology for accurate and context-aware translations.
- 🔄 **Incremental Updates**: Efficiently translate only what's changed, saving time and preserving existing translations.
- 🌐 **Multi-Language Support**: Easily manage translations for multiple target languages from a single source.
- ⚙️ **Customizable Workflow**: Configure your base language, target languages, and preferred LLM provider.
- 📝 **Feedback Mechanism**: Collaboratively improve translations with a built-in feedback system.

## Quick Start

1. **Install**: Search for "i18n Nexus" in the VSCode extension store and install.
2. **Configure**: Set your base path, languages, and LLM provider in VSCode settings (search for "i18n Nexus").
3. **Translate**: Use the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and run `i18n Nexus: Translate Files`.
4. **Review**: Check generated translations in your message files.
5. **Feedback**: Use `i18n Nexus: Provide Translation Feedback` to suggest improvements.

## Configuration Options

You can configure i18n Nexus directly in your VSCode settings:

- `i18nNexus.basePath`: Relative path to the messages folder.
- `i18nNexus.baseLanguage`: Base language code (e.g., 'en' for English).
- `i18nNexus.targetLanguages`: Array of target language codes.
- `i18nNexus.llmProvider`: Selected LLM provider (e.g., `openai`, `gemini`, etc.).
- `i18nNexus.llmApiUrl`: API URL for the selected LLM provider.
- `i18nNexus.llmApiKey`: API Key for the selected LLM provider.

## How It Works

i18n Nexus uses advanced AI models to understand and translate your text. It analyzes your base language file, identifies new or changed content, and then only translates these parts. This incremental update method is both efficient and maintains translation consistency.

## Notes

- Ensure to keep your API key secure.
- For first-time use, it's recommended to test on non-critical projects.
- AI translations may not be perfect, human review is recommended.

## Feedback and Contributions

Feel free to contribute to the project or provide feedback on translations. Visit our [GitHub repository](https://github.com/iaiuse/i18n-nexus) for more information.

# i18n Nexus Usage Guide

## Screenshots Explanation

### 1. Translate Current File
![Translate Current File](resources/screenshots/translatecurrent.png)

This screenshot shows how to use i18n Nexus to translate the current file being edited. In the VSCode command palette, you can find the "i18n Nexus: Translate Current File" option. This feature allows you to quickly translate the JSON language file you're editing, making it very convenient for real-time translation updates.

### 2. Plugin Settings
![Settings](resources/screenshots/settings.png)


This screenshot shows the settings interface for i18n Nexus. Here you can configure the following options:
- Base Language: The reference language, e.g., 'en' for English
- Base Path: Relative path to the language files
- LLM API Key: API key for AI translation
- LLM API URL: API address of the AI service provider
- LLM Model: Specific AI model being used
- LLM Provider: Selected AI service provider
- Target Languages: List of target languages for translation

These settings allow you to customize the plugin to fit your project needs.

### 3. Plugin Homepage
![Home](resources/screenshots/home.png)

This is the homepage of i18n Nexus in the VSCode extension marketplace. It outlines the main features of the plugin, including AI-driven translation, incremental updates, multi-language support, and more. This page also provides a quick start guide to help new users get started with the plugin quickly.

### 4. Available Commands
![Commands](resources/screenshots/command.png)


This screenshot shows the available commands for i18n Nexus in the VSCode command palette. They include:
- Show i18n Nexus Configuration: Display plugin configuration
- Translate Current File: Translate the current file
- Translate Files: Translate multiple files
- Focus on Command Center View: Focus on the command center view
- Configure AI Model: Configure the AI model

These commands provide quick access to various functions of the plugin.

### 5. Baseline File
![Baseline](resources/screenshots/baseline.png)


This screenshot shows the language file structure in the project. In the messages folder, you can see JSON files for different languages, such as en.json (English), de.json (German), etc. Among them, en.json is marked as the baseline file. The plugin will generate translations for other languages based on this file.

## Summary

i18n Nexus is a powerful VSCode plugin designed for the localization workflow of next-intl projects. It provides an intuitive interface to configure translation settings, supports multiple languages, and utilizes AI technology to achieve efficient translation processes. Through the command palette, users can easily trigger translation tasks, whether for a single file or an entire project. The plugin's settings interface allows users to customize various parameters to adapt to different project requirements and preferences.

## Developer Guide

### Prerequisites

- Node.js (version 14.0.0 or higher)
- VSCode (version 1.60.0 or higher)

### Getting the Code

```bash
git clone https://github.com/iaiuse/i18n-nexus.git
cd i18n-nexus
```

### Installing Dependencies

```bash
npm install
```

### Compiling

```bash
npm run compile
```

### Running Tests

```bash
npm test
```

### Local Debugging

1. Open the project folder in VSCode
2. Press F5 to start debugging
3. Test the extension in the newly opened Extension Development Host window

### Packaging

```bash
npm run package
```

![build package](/resources/screenshots/build.png)

This will generate a `.vsix` file in the project root directory.

### Publishing

1. Ensure you have a Visual Studio Marketplace account
2. Log in to the [Visual Studio Marketplace Management page](https://marketplace.visualstudio.com/manage)
3. Click "New Extension" and upload the generated `.vsix` file

Alternatively, you can use the command line:

```bash
npm install -g vsce
vsce publish
```

Note: Before publishing, make sure you've updated the version number in `package.json`.

### Contribution Guidelines

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Accelerate your global reach - Let i18n Nexus handle the complexities of localization while you focus on building great features for your international audience!