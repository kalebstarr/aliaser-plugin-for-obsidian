import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface AliasPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: AliasPluginSettings = {
	mySetting: 'default'
}

export default class AliasPlugin extends Plugin {
	settings: AliasPluginSettings;

	async onload() {
		await this.loadSettings();
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'headers-to-frontmatter',
			name: 'Convert headers to frontmatter',
			editorCallback: (editor: Editor, view: MarkdownView) => {

				// const that = new Collector(editor.getValue(), editor);
				const list = new LineCollector(editor.getValue());
				const printer = new Printer(editor);
				const dictionary = list.getDictionary();

				// Two scenarios:
				// 1. The frontmatter already exists, and the aliases section is empty
				// 2. The frontmatter doesn't exist, and the aliases section is empty


				editor.setCursor(-1);
				editor.replaceSelection('---\n');
				editor.replaceSelection('aliases:\n');

				printer.printAliases(dictionary);

				editor.replaceSelection('---\n');
			}
		});

		this.addCommand({
			id: 'delete-frontmatter',
			name: 'Delete frontmatter',
			editorCallback: (editor: Editor, view: MarkdownView) => {

				const firstLineLength = editor.getLine(0).length;
				const excludeFirstLine = editor.getRange({line: 1, ch: 0}, {line: editor.lastLine(), ch: 0})
				const frontmatterEnd = excludeFirstLine.indexOf('---');
				const frontmatterLength = firstLineLength + frontmatterEnd;

				editor.replaceRange(' ', {line: 0, ch: 0}, {line: 1, ch: frontmatterLength});
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class Printer {
	editor: Editor;

	constructor(editor: Editor) {
		this.editor = editor;
	}

	private printFileShortcut(num: number, str: string) {
		str = this.removeFirstElement(str);
		
		// TODO
		this.editor.getValue();
	}

	printAliases(map: Map<string, number>) {
			let tempH1 = "";
			let tempH2 = "";

			let h2Counter = 1;
			let h3Counter = 1;

		
		for (const line of map) {
			let str = line[0];
			const num = line[1];

			str = this.removeFirstElement(str);

			switch (num) {
				case 1:
					this.editor.replaceSelection('- "[[' + str + '|' + str + ']]"\n');

					tempH1 = str;
					h2Counter = 1;
					break;
				case 2:
					this.editor.replaceSelection('- "[[' + tempH1 + '#' + str + '|' + h2Counter + '. ' + str + ']]"\n');
					
					tempH2 = str;
					h2Counter++;
					h3Counter = 1;
					break;
				case 3:
					this.editor.replaceSelection('- "[[' + tempH1 + '#' + tempH2 + '#' + str + '|' + h3Counter + '. ' + str + ']]"\n');

					h3Counter++;
					break;
			}
		}
	}

	private stringRemover(str: string, symbol: string) {

		const list = str.split(' ');

		for (const word of list) {
			if (word.contains(symbol)) {
				str.replace(word, '');
			}
		}
	}

	private removeFirstElement(str: string) {
		const list = str.split(' ');
		list.shift();
		return list.join(' ');
	}
}

class LineCollector {
	str: string;

	constructor(str: string) {
		this.str = str;
	}

	private getListOfLines() {
		const list = new Array<string>();
		const lines = this.str.split('\n');

		for (const line of lines) {
			list.push(line);
		}

		return list;
	}

	getDictionary() {
		const lines = this.getListOfLines();
		const dictionary = new Map<string, number>();

		for (const line of lines) {
			if (dictionary.has(line)) {
				continue;
			}

			if (line.contains('### ')) {
				dictionary.set(line, 3);
			} else if (line.contains('## ')) {
				dictionary.set(line, 2);
			} else if (line.contains('# ')) {
				dictionary.set(line, 1);
			} else {
				dictionary.set(line, 0);
			}
		}

		return dictionary;
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: AliasPlugin;

	constructor(app: App, plugin: AliasPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
