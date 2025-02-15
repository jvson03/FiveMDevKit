// src/extension.ts
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

interface FiveMNativeParam {
	name: string;
	type: string;
}

type FiveMNativeResults = string | string[] | undefined;

interface FiveMNative {
	name: string;
	hash?: string;
	params?: FiveMNativeParam[];
	results?: FiveMNativeResults;
	description?: string;
	module?: string;
}

export function activate(context: vscode.ExtensionContext) {
	// Load the natives.json file from the data folder in the extension package
	const nativesFile = path.join(context.extensionPath, "data", "natives.json");
	let allNatives: FiveMNative[] = [];

	if (fs.existsSync(nativesFile)) {
		const rawData = fs.readFileSync(nativesFile, "utf-8");
		const parsed = JSON.parse(rawData);
		allNatives = parseNatives(parsed);
	} else {
		vscode.window.showWarningMessage(
			'FiveM natives.json not found. Please run "npm run fetch-natives" or place the file in the data folder.'
		);
	}

	// Register the auto-completion provider for JavaScript and TypeScript
	// No trigger characters => suggestions appear on every keystroke
	const completionProvider = vscode.languages.registerCompletionItemProvider(
		["javascript", "typescript"],
		new FiveMCompletionProvider(allNatives)
	);

	// Register the go-to definition provider
	const definitionProvider = vscode.languages.registerDefinitionProvider(
		["javascript", "typescript"],
		new FiveMDefinitionProvider(allNatives)
	);

	// Register commands (e.g. Hello World, Debug Resource)
	const helloCmd = vscode.commands.registerCommand("fivemdevkit.helloWorld", () => {
		vscode.window.showInformationMessage("Hello from FiveMDevKit!");
	});
	const debugCmd = vscode.commands.registerCommand("fivemdevkit.debugResource", () => {
		vscode.window.showInformationMessage("Debug Resource: Not implemented yet!");
	});

	context.subscriptions.push(completionProvider, definitionProvider, helloCmd, debugCmd);

	vscode.window.showInformationMessage("FiveMDevKit is now active!");
}

export function deactivate() {
	// Cleanup logic if needed
}

/**
 * Flatten the nested JSON (modules -> hashes) into a flat array of FiveMNative objects.
 */
function parseNatives(nativesData: any): FiveMNative[] {
	const result: FiveMNative[] = [];
	for (const moduleName of Object.keys(nativesData)) {
		const moduleObj = nativesData[moduleName];
		for (const nativeHash of Object.keys(moduleObj)) {
			const nativeDef = moduleObj[nativeHash];
			if (nativeDef && nativeDef.name) {
				result.push({
					name: nativeDef.name,
					hash: nativeHash,
					params: nativeDef.params || [],
					// 'results' can be string or array in the JSON
					results: nativeDef.results,
					description: nativeDef.description || "",
					module: moduleName,
				});
			}
		}
	}
	return result;
}

/**
 * Completion Provider for FiveM natives.
 * Displays a list of known natives as IntelliSense suggestions.
 */
class FiveMCompletionProvider implements vscode.CompletionItemProvider {
	constructor(private natives: FiveMNative[]) {}

	public provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position
	): vscode.CompletionItem[] {
		return this.natives.map((native) => {
			const item = new vscode.CompletionItem(
				native.name,
				vscode.CompletionItemKind.Function
			);

			item.detail = `${native.module} - Hash: ${native.hash}`;

			// If 'results' is a string, wrap it in an array; if it's already an array, use it.
			let resultsArray: string[];
			if (typeof native.results === "string") {
				resultsArray = [native.results];
			} else if (Array.isArray(native.results)) {
				resultsArray = native.results;
			} else {
				resultsArray = [];
			}

			const returns = resultsArray.length > 0 ? resultsArray.join(" | ") : "void";
			const params = native.params?.map((p) => `${p.type} ${p.name}`).join(", ") || "";
			const docString = `
**Description**: ${native.description || "No description"}  
**Parameters**: \`${params}\`  
**Returns**: \`${returns}\`  
**Module**: \`${native.module}\`
**Hash**: \`${native.hash}\`
			`;
			item.documentation = new vscode.MarkdownString(docString);

			// Insert snippet with parameter placeholders
			if (native.params && native.params.length > 0) {
				const snippet = new vscode.SnippetString(`${native.name}(`);
				for (let i = 0; i < native.params.length; i++) {
					snippet.appendPlaceholder(native.params[i].name);
					if (i < native.params.length - 1) {
						snippet.appendText(", ");
					}
				}
				snippet.appendText(")");
				item.insertText = snippet;
			}

			return item;
		});
	}
}

/**
 * Definition Provider for FiveM natives.
 * Optionally opens docs in a browser or returns a location.
 */
class FiveMDefinitionProvider implements vscode.DefinitionProvider {
	constructor(private natives: FiveMNative[]) {}

	public provideDefinition(
		document: vscode.TextDocument,
		position: vscode.Position
	): vscode.Definition | undefined {
		const range = document.getWordRangeAtPosition(position);
		if (!range) {
			return;
		}

		const word = document.getText(range);
		const match = this.natives.find(
			(n) => n.name.toLowerCase() === word.toLowerCase()
		);
		if (match) {
			// For now, open the official docs page in the browser:
			const docUrl = `https://docs.fivem.net/natives/?_0x${match.hash?.slice(2) || ""}`;
			vscode.env.openExternal(vscode.Uri.parse(docUrl));
		}
		return undefined;
	}
}
