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

/**
 * Converts an all-uppercase-with-underscores name (e.g. "TRIGGER_MUSIC_EVENT")
 * to PascalCase ("TriggerMusicEvent"). If the name doesn't match that pattern,
 * we just uppercase the first letter and leave the rest as-is ("triggerEvent" -> "TriggerEvent").
 */
function toPascalCase(s: string): string {
	// Check if string is uppercase/underscore style (like "TRIGGER_SIREN")
	if (/^[A-Z0-9_]+$/.test(s)) {
		// Split on underscores, capitalize each chunk, lowercase the rest
		return s
			.split("_")
			.map(
				(chunk) =>
					chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase()
			)
			.join("");
	} else {
		// Just uppercase the first letter, leave the rest as-is
		return s.charAt(0).toUpperCase() + s.slice(1);
	}
}

/**
 * Maps FiveM param types to a more JavaScript-friendly type (e.g. "char*" -> "string").
 */
function mapType(type: string): string {
	switch (type.toLowerCase()) {
		case "char*":
			return "string";
		case "float":
		case "int":
			return "number";
		case "bool":
			return "boolean";
		default:
			return type.toLowerCase();
	}
}

/**
 * Parses the nested natives JSON into a flat array of FiveMNative objects.
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
 * Transforms all names to PascalCase for display and snippet insertion.
 */
class FiveMCompletionProvider implements vscode.CompletionItemProvider {
	constructor(private natives: FiveMNative[]) {}

	public provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position
	): vscode.CompletionItem[] {
		return this.natives.map((native) => {
			// Convert original name (e.g. "TRIGGER_MUSIC_EVENT" or "triggerEvent") to PascalCase
			const funcName = toPascalCase(native.name);

			const item = new vscode.CompletionItem(
				funcName,
				vscode.CompletionItemKind.Function
			);
			item.detail = `${native.module} - Hash: ${native.hash}`;

			// Process return value(s)
			const returns = Array.isArray(native.results)
				? native.results.join(" | ")
				: native.results || "void";

			// Build a parameter list for docs
			const paramList = native.params
				? native.params
						.map((p) => `${mapType(p.type)} ${p.name}`)
						.join(", ")
				: "";
			const docString = `
**Description:** ${native.description || "No description"}
**Parameters:** \`${paramList}\`
**Returns:** \`${returns}\`
**Module:** \`${native.module}\`
**Hash:** \`${native.hash}\`
			`;
			item.documentation = new vscode.MarkdownString(docString);

			// Build a multi-line snippet with typed parameters
			const snippet = new vscode.SnippetString(`${funcName}(`);
			if (native.params && native.params.length > 0) {
				for (let i = 0; i < native.params.length; i++) {
					const param = native.params[i];
					snippet.appendText("\n\t");
					snippet.appendPlaceholder(
						`${param.name}: ${mapType(param.type)}`
					);
					if (i < native.params.length - 1) {
						snippet.appendText(",");
					}
				}
				snippet.appendText("\n)");
			} else {
				snippet.appendText(")");
			}
			snippet.appendText(";");
			item.insertText = snippet;

			return item;
		});
	}
}

/**
 * Completion Provider for common FiveM events (onNet, emitNet, etc.).
 */
class FiveMEventsCompletionProvider implements vscode.CompletionItemProvider {
	public provideCompletionItems(): vscode.CompletionItem[] {
		const completions: vscode.CompletionItem[] = [];

		// onNet
		const onNetItem = new vscode.CompletionItem("onNet", vscode.CompletionItemKind.Function);
		onNetItem.detail = "FiveM event listener (client/server)";
		onNetItem.documentation = new vscode.MarkdownString(
			"**onNet(eventName, handler)**\n\nListens for server-to-client or client-to-server events."
		);
		onNetItem.insertText = new vscode.SnippetString("onNet('${1:eventName}', (${2:args}) => {\n\t$0\n});");
		completions.push(onNetItem);

		// emitNet
		const emitNetItem = new vscode.CompletionItem("emitNet", vscode.CompletionItemKind.Function);
		emitNetItem.detail = "FiveM event emitter (client/server)";
		emitNetItem.documentation = new vscode.MarkdownString(
			"**emitNet(eventName, target, ...args)**\n\nEmits an event from the client to the server or vice versa."
		);
		emitNetItem.insertText = new vscode.SnippetString("emitNet('${1:eventName}', ${2:target}, ${3:...args});");
		completions.push(emitNetItem);

		// on
		const onItem = new vscode.CompletionItem("on", vscode.CompletionItemKind.Function);
		onItem.detail = "Generic event listener";
		onItem.documentation = new vscode.MarkdownString(
			"**on(eventName, handler)**\n\nListens for events on the same side (client or server)."
		);
		onItem.insertText = new vscode.SnippetString("on('${1:eventName}', (${2:args}) => {\n\t$0\n});");
		completions.push(onItem);

		// registerNetEvent
		const registerNetEventItem = new vscode.CompletionItem("registerNetEvent", vscode.CompletionItemKind.Function);
		registerNetEventItem.detail = "Register a network event";
		registerNetEventItem.documentation = new vscode.MarkdownString(
			"**registerNetEvent(eventName)**\n\nRegisters a network event to be handled by the client or server."
		);
		registerNetEventItem.insertText = new vscode.SnippetString("registerNetEvent('${1:eventName}');");
		completions.push(registerNetEventItem);

		// triggerEvent
		const triggerEventItem = new vscode.CompletionItem("triggerEvent", vscode.CompletionItemKind.Function);
		triggerEventItem.detail = "Trigger a local event";
		triggerEventItem.documentation = new vscode.MarkdownString(
			"**triggerEvent(eventName, ...args)**\n\nTriggers an event on the local side (client or server)."
		);
		triggerEventItem.insertText = new vscode.SnippetString("triggerEvent('${1:eventName}', ${2:...args});");
		completions.push(triggerEventItem);

		return completions;
	}
}

/**
 * Activates the extension.
 */
export function activate(context: vscode.ExtensionContext) {
	const nativesFile = path.join(context.extensionPath, "data", "natives.json");
	let allNatives: FiveMNative[] = [];

	if (fs.existsSync(nativesFile)) {
		try {
			const rawData = fs.readFileSync(nativesFile, "utf-8");
			const parsed = JSON.parse(rawData);
			allNatives = parseNatives(parsed);
		} catch (e) {
			vscode.window.showErrorMessage("Failed to parse natives.json");
		}
	} else {
		vscode.window.showWarningMessage("natives.json not found in the data folder.");
	}

	// Register the completion provider for FiveM natives.
	const nativesProvider = vscode.languages.registerCompletionItemProvider(
		["javascript", "typescript"],
		new FiveMCompletionProvider(allNatives)
	);

	// Register the completion provider for FiveM events.
	const eventsProvider = vscode.languages.registerCompletionItemProvider(
		["javascript", "typescript"],
		new FiveMEventsCompletionProvider()
	);

	// Register commands (e.g. Hello World).
	const helloCmd = vscode.commands.registerCommand("fivemdevkit.helloWorld", () => {
		vscode.window.showInformationMessage("Hello from FiveMDevKit!");
	});
	const debugCmd = vscode.commands.registerCommand("fivemdevkit.debugResource", () => {
		vscode.window.showInformationMessage("Debug Resource: Not implemented yet!");
	});

	context.subscriptions.push(nativesProvider, eventsProvider, helloCmd, debugCmd);

	vscode.window.showInformationMessage("FiveMDevKit is now active!");
}

/**
 * Deactivates the extension.
 */
export function deactivate() {
	// Cleanup if needed.
}
