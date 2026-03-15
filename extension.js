const vscode = require('vscode');

const DARK_ONLY_KEYS = new Set([
	'terminalEditor.background',
	'terminal.background',
	'terminal.foreground',
	'terminalCursor.foreground'
]);

const DARK_TERMINAL = {
	'terminalEditor.background': '#1e1e1e',
	'terminal.background': '#1e1e1e',
	'terminal.foreground': '#cccccc',
	'terminalCursor.foreground': '#ffffff',
	// 'terminal.ansiBlack': '#000000',
	// 'terminal.ansiRed': '#cd3131',
	// 'terminal.ansiGreen': '#0dbc79',
	// 'terminal.ansiYellow': '#e5e510',
	// 'terminal.ansiBlue': '#2472c8',
	// 'terminal.ansiMagenta': '#bc3fbc',
	// 'terminal.ansiCyan': '#11a8cd',
	// 'terminal.ansiWhite': '#e5e5e5',
	// 'terminal.ansiBrightBlack': '#000000',
	// 'terminal.ansiBrightRed': '#f14c4c',
	// 'terminal.ansiBrightGreen': '#23d18b',
	// 'terminal.ansiBrightYellow': '#f5f543',
	// 'terminal.ansiBrightBlue': '#3b8eea',
	// 'terminal.ansiBrightMagenta': '#d670d6',
	// 'terminal.ansiBrightCyan': '#29b8db',
	// 'terminal.ansiBrightWhite': '#e5e5e5'
	'terminal.selectionBackground': '#264f78',
	'terminal.selectionForeground': '#ffffff',
	'terminal.findMatchBackground': '#515c6a',
	'terminal.findMatchHighlightBackground': '#ea5c0055',
	'terminal.inactiveSelectionBackground': '#3A3D41'
};

function activate(context) {
	let active = vscode.workspace.getConfiguration('workbench').get('colorTheme') === 'Notepad++ Classic Light';

	// ========== Feature 1: Fold underline ==========
	const foldDecoration = vscode.window.createTextEditorDecorationType({
		isWholeLine: true,
		borderWidth: '0 0 1px 0',
		borderStyle: 'solid',
		borderColor: '#C0C0C0'
	});

	function clearAllDecorations() {
		greyRangesList = [];
		rawGreyRanges = [];
		rawRedRanges = [];
		cursorInGreyIdx = -1;
		for (const editor of vscode.window.visibleTextEditors) {
			editor.setDecorations(foldDecoration, []);
			editor.setDecorations(blueDecoration, []);
			editor.setDecorations(purpleDecoration, []);
			editor.setDecorations(keywordDecoration, []);
			editor.setDecorations(fastBlueDecoration, []);
			editor.setDecorations(fastPurpleDecoration, []);
			editor.setDecorations(fastKeywordDecoration, []);
			editor.setDecorations(greyDecoration, []);
			editor.setDecorations(redDecoration, []);
		}
	}

	function updateFoldDecorations(editor) {
		if (!active || !editor) return;
		const ranges = editor.visibleRanges;
		const decorations = [];
		for (let i = 0; i < ranges.length - 1; i++) {
			const line = ranges[i].end.line;
			decorations.push(new vscode.Range(line, 0, line, 0));
		}
		editor.setDecorations(foldDecoration, decorations);
	}

	// ========== Feature 2: Lua semantic coloring ==========
	const BLUE_NAMES = new Set([
		'assert','collectgarbage','dofile','error','getfenv','getmetatable',
		'ipairs','load','loadfile','loadstring','module','next','newproxy',
		'pairs','pcall','print','rawequal','rawget','rawlen','rawset',
		'require','select','setfenv','setmetatable','tonumber','tostring',
		'type','unpack','xpcall','_G','tostringall','time','date','gcinfo',
		'difftime','debugprofilestop','debugprofilestart','debugstack',
		'coroutine','io','os','debug','bit','bit32','utf8','package'
	]);

	const PURPLE_NAMES = new Set([
		'string','table','math',
		'wipe','strjoin','strconcat','strchar','strbyte','strformat',
		'strfind','strmatch','strsub','strgsub','strgmatch','strlower',
		'strupper','strlen','strrep','strrev','strdump'
	]);

	const METAMETHODS = new Set([
		'__index','__newindex','__call','__tostring','__len','__unm',
		'__add','__sub','__mul','__div','__mod','__pow','__concat',
		'__eq','__lt','__le','__gc','__mode','__metatable','__pairs',
		'__ipairs','__close',
		'__idiv','__band','__bor','__bxor','__bnot','__shl','__shr','__name'
	]);

	const PURPLE_METHODS = new Set([
		// string methods
		'byte','char','dump','find','format','gmatch','gsub','len',
		'lower','match','rep','reverse','sub','upper',
		// table methods
		'concat','insert','move','pack','remove','sort','unpack',
		// math methods
		'abs','acos','asin','atan','atan2','ceil','cos','cosh',
		'deg','exp','floor','fmod','frexp','huge','ldexp','log',
		'log10','max','min','modf','pi','pow','rad','random',
		'randomseed','sin','sinh','sqrt','tan','tanh'
	]);

	const LUA_KEYWORD_OPS = new Set(['and', 'or', 'not']);

	const blueDecoration = vscode.window.createTextEditorDecorationType({
		fontWeight: 'bold',
		color: '#0080C0'
	});

	const purpleDecoration = vscode.window.createTextEditorDecorationType({
		fontWeight: 'bold',
		color: '#8000FF'
	});

	const keywordDecoration = vscode.window.createTextEditorDecorationType({
		fontWeight: 'bold',
		color: '#0000FF'
	});

	// Fast pass decorations (instant, regex-based) — separate from semantic pass
	const fastBlueDecoration = vscode.window.createTextEditorDecorationType({
		fontWeight: 'bold',
		color: '#0080C0'
	});
	const fastPurpleDecoration = vscode.window.createTextEditorDecorationType({
		fontWeight: 'bold',
		color: '#8000FF'
	});
	const fastKeywordDecoration = vscode.window.createTextEditorDecorationType({
		fontWeight: 'bold',
		color: '#0000FF'
	});

	// ========== Feature 3: Unused code decorations ==========
	const greyDecoration = vscode.window.createTextEditorDecorationType({
		opacity: '1.0',
		// fontStyle: 'italic',
		color: '#808080'
	});

	const redDecoration = vscode.window.createTextEditorDecorationType({
		fontWeight: 'italic',
		color: '#ff0000'
	});

	let greyRangesList = [];
	let rawGreyRanges = [];
	let rawRedRanges = [];
	let cursorInGreyIdx = -1;

	function isInGreyRange(line) {
		for (const r of greyRangesList) {
			if (line >= r.start.line && line <= r.end.line) return true;
		}
		return false;
	}

	function applyUnusedDecorations(editor) {
		if (!active || !editor) return;

		const cursorLine = editor.selection.active.line;
		const newIdx = rawGreyRanges.findIndex(r =>
			cursorLine >= r.range.start.line && cursorLine <= r.range.end.line
		);

		if (newIdx === cursorInGreyIdx) return;
		cursorInGreyIdx = newIdx;

		const filtered = newIdx === -1
			? rawGreyRanges
			: rawGreyRanges.filter((_, i) => i !== newIdx);

		greyRangesList = filtered.map(r => r.range);
		editor.setDecorations(greyDecoration, filtered);
		editor.setDecorations(redDecoration, rawRedRanges);

		if (editor.document.languageId === 'lua') {
			fastColorPass(editor);
			scheduleUpdate();
		}
	}

	// ========== Feature 4: Cross-file alias map ==========
	const fieldColorMap = new Map();

	async function buildWorkspaceFieldMap() {
		fieldColorMap.clear();
		const files = await vscode.workspace.findFiles('**/*.lua', null, 500);
		for (const uri of files) {
			const doc = await vscode.workspace.openTextDocument(uri);
			scanFileForFieldAliases(doc);
		}
	}

	function scanFileForFieldAliases(doc) {
		const limit = Math.min(doc.lineCount, 150);
		for (let l = 0; l < limit; l++) {
			const text = doc.lineAt(l).text;
			let m = /(\w+)\.(\w+)\s*=\s*(\w+)\s*(?:$|--)/.exec(text);
			if (m) {
				const field = m[2], source = m[3];
				if (BLUE_NAMES.has(source)) fieldColorMap.set(field, 'blue');
				else if (PURPLE_NAMES.has(source)) fieldColorMap.set(field, 'purple');
				continue;
			}
			m = /(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/.exec(text);
			if (m) {
				const field = m[2], ns = m[3];
				if (BLUE_NAMES.has(ns)) fieldColorMap.set(field, 'blue');
				else if (PURPLE_NAMES.has(ns)) fieldColorMap.set(field, 'purple');
			}
		}
	}

	buildWorkspaceFieldMap();

	const watcher = vscode.workspace.createFileSystemWatcher('**/*.lua');
	watcher.onDidChange(async uri => {
		const doc = await vscode.workspace.openTextDocument(uri);
		scanFileForFieldAliases(doc);
		scheduleUpdate();
	});
	watcher.onDidCreate(async uri => {
		const doc = await vscode.workspace.openTextDocument(uri);
		scanFileForFieldAliases(doc);
		scheduleUpdate();
	});

	// ========== Feature 5: Fast color pass (instant regex-based) ==========
	const FAST_RE = /\b([a-zA-Z_]\w*)\b/g;

	function fastColorPass(editor) {
		if (!active) return;
		const blueRanges = [], purpleRanges = [], keywordRanges = [];
		const lineCount = editor.document.lineCount;

		for (let l = 0; l < lineCount; l++) {
			if (isInGreyRange(l)) continue;
			const text = editor.document.lineAt(l).text;
			const commentPos = text.indexOf('--');

			FAST_RE.lastIndex = 0;
			let m;
			while ((m = FAST_RE.exec(text)) !== null) {
				if (commentPos >= 0 && m.index >= commentPos) break;
				const name = m[1], col = m.index;

				if (col > 0 && (text[col - 1] === '.' || text[col - 1] === ':')) {
					if (PURPLE_METHODS.has(name)) {
						purpleRanges.push({ range: new vscode.Range(l, col, l, col + name.length) });
					}
					continue;
				}

				// P3: Keyword operators — bold blue #0000FF
				if (LUA_KEYWORD_OPS.has(name)) {
					keywordRanges.push({ range: new vscode.Range(l, col, l, col + name.length) });
					continue;
				}

				// P2: Skip function declarations (local function strconcat, function foo)
				if (/\b(?:function|local)$/.test(text.substring(0, col).trimEnd())) continue;

				if (!BLUE_NAMES.has(name) && !PURPLE_NAMES.has(name)) continue;

				const after = text.substring(col + name.length).trimStart();
				if (after[0] === '=' && after[1] !== '=') continue;

				const range = new vscode.Range(l, col, l, col + name.length);
				if (BLUE_NAMES.has(name)) blueRanges.push({ range });
				else purpleRanges.push({ range });
			}
		}

		editor.setDecorations(fastBlueDecoration, blueRanges);
		editor.setDecorations(fastPurpleDecoration, purpleRanges);
		editor.setDecorations(fastKeywordDecoration, keywordRanges);
	}

	// ========== Unused code decorations ==========
	let clearTimer = null;

	function findFunctionAtName(diagRange, symbols) {
		for (const sym of symbols) {
			const isFunc = sym.kind === vscode.SymbolKind.Function || sym.kind === vscode.SymbolKind.Method;
			const isFuncVar = sym.kind === vscode.SymbolKind.Variable
				&& sym.range.start.line !== sym.range.end.line;
			if (isFunc || isFuncVar) {
				const sel = sym.selectionRange;
				if (sel.start.line === diagRange.start.line
					&& sel.start.character === diagRange.start.character) {
					return sym.range;
				}
				if (diagRange.contains(sel)) {
					return sym.range;
				}
			}
			if (sym.children) {
				const result = findFunctionAtName(diagRange, sym.children);
				if (result) return result;
			}
		}
		return null;
	}

	async function updateUnusedDecorations(editor) {
		if (!active || !editor) return;
		const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
		const unnDiags = diagnostics.filter(d => {
			if (d.tags && d.tags.includes(vscode.DiagnosticTag.Unnecessary)) return true;
			if (typeof d.code === 'string' && d.code.startsWith('unused-')) return true;
			return false;
		});
		if (unnDiags.length === 0) {
			if (!clearTimer) {
				clearTimer = setTimeout(() => {
					clearTimer = null;
					const e = vscode.window.activeTextEditor;
					if (!e) return;
					const freshDiags = vscode.languages.getDiagnostics(e.document.uri);
					const freshUnn = freshDiags.filter(d => {
						if (d.tags && d.tags.includes(vscode.DiagnosticTag.Unnecessary)) return true;
						if (typeof d.code === 'string' && d.code.startsWith('unused-')) return true;
						return false;
					});
					if (freshUnn.length === 0) {
						greyRangesList = [];
						rawGreyRanges = [];
						rawRedRanges = [];
						cursorInGreyIdx = -1;
						e.setDecorations(greyDecoration, []);
						e.setDecorations(redDecoration, []);
					}
				}, 3000);
			}
			return;
		}
		if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }

		let symbols = [];
		try {
			symbols = await vscode.commands.executeCommand(
				'vscode.executeDocumentSymbolProvider', editor.document.uri
			) || [];
			if (!active) return;
		} catch (e) {
			console.error('[UW Theme] updateUnusedDecorations error:', e);
		}
		const greyRanges = [], redRanges = [];

		if (symbols.length === 0) {
			for (const diag of unnDiags) {
				if (diag.range.start.line !== diag.range.end.line) {
					greyRanges.push({ range: diag.range });
				} else {
					redRanges.push({ range: diag.range });
				}
			}
		} else {
			for (const diag of unnDiags) {
				let funcRange = findFunctionAtName(diag.range, symbols);
				if (funcRange) {
					// Extend to include 'local' keyword if sym.range starts after it
					const lineText = editor.document.lineAt(funcRange.start.line).text;
					const prefix = lineText.substring(0, funcRange.start.character).trimEnd();
					if (prefix === 'local') {
						funcRange = new vscode.Range(
							funcRange.start.line, lineText.indexOf('local'),
							funcRange.end.line, funcRange.end.character
						);
					}
					if (!greyRanges.some(r => r.range.isEqual(funcRange))) {
						greyRanges.push({ range: funcRange });
					}
				}
			}

			for (const diag of unnDiags) {
				const funcRange = findFunctionAtName(diag.range, symbols);
				if (!funcRange && !greyRanges.some(r => r.range.contains(diag.range))) {
					redRanges.push({ range: diag.range });
				}
			}
		}

		rawGreyRanges = greyRanges;
		rawRedRanges = redRanges;
		cursorInGreyIdx = -2;  // force re-evaluate
		applyUnusedDecorations(editor);
	}

	// ========== Semantic token processing ==========
	let updateTimer = null;

	async function updateGlobalDecorations(editor) {
		if (!active) return;
		if (!editor || editor.document.languageId !== 'lua') {
			if (editor) {
				editor.setDecorations(blueDecoration, []);
				editor.setDecorations(purpleDecoration, []);
				editor.setDecorations(keywordDecoration, []);
				editor.setDecorations(fastBlueDecoration, []);
				editor.setDecorations(fastPurpleDecoration, []);
				editor.setDecorations(fastKeywordDecoration, []);
			}
			return;
		}
		try {
			const uri = editor.document.uri;
			const [tokens, legend] = await Promise.all([
				vscode.commands.executeCommand('vscode.provideDocumentSemanticTokens', uri),
				vscode.commands.executeCommand('vscode.provideDocumentSemanticTokensLegend', uri)
			]);
			if (!tokens || !legend) return;

			const globalIdx = legend.tokenModifiers.indexOf('global');
			const defLibIdx = legend.tokenModifiers.indexOf('defaultLibrary');
			const globalMask = (globalIdx >= 0 ? 1 << globalIdx : 0)
				| (defLibIdx >= 0 ? 1 << defLibIdx : 0);

			const commentIdx = legend.tokenTypes.indexOf('comment');
			const stringIdx = legend.tokenTypes.indexOf('string');
			const propertyIdx = legend.tokenTypes.indexOf('property');
			const methodIdx = legend.tokenTypes.indexOf('method');
			const operatorIdx = legend.tokenTypes.indexOf('operator');

			// Build alias map by scanning document
			const aliasMap = new Map();
			const lineCount = editor.document.lineCount;
			const re1 = /\blocal\s+(\w+)\s*=\s*(\w+)\s*(?:$|--)/;
			const re2 = /\blocal\s+(\w+)\s*=\s*(\w+)\.(\w+)/;

			for (let l = 0; l < lineCount; l++) {
				const lineText = editor.document.lineAt(l).text;
				let m = re1.exec(lineText);
				if (m) {
					const alias = m[1], source = m[2];
					if (BLUE_NAMES.has(source)) aliasMap.set(alias, 'blue');
					else if (PURPLE_NAMES.has(source)) aliasMap.set(alias, 'purple');
					continue;
				}
				m = re2.exec(lineText);
				if (m) {
					const alias = m[1], ns = m[2], method = m[3];
					if (BLUE_NAMES.has(ns)) aliasMap.set(alias, 'blue');
					else if (PURPLE_NAMES.has(ns)) aliasMap.set(alias, 'purple');
					else if (fieldColorMap.has(method)) aliasMap.set(alias, fieldColorMap.get(method));
				}
			}

			const blueRanges = [];
			const purpleRanges = [];
			const keywordRanges = [];
			const data = tokens.data;
			let line = 0, char = 0;

			for (let i = 0; i < data.length; i += 5) {
				const dLine = data[i], dChar = data[i + 1], len = data[i + 2];
				const typeIdx = data[i + 3];
				const mods = data[i + 4];

				if (dLine > 0) { line += dLine; char = dChar; }
				else { char += dChar; }

				if (isInGreyRange(line)) continue;
				if (typeIdx === commentIdx || typeIdx === stringIdx) continue;
				{
				const lt = editor.document.lineAt(line).text;
				const cp = lt.indexOf('--');
				if (cp >= 0 && char >= cp) {
				continue;
			}
				}

				const range = new vscode.Range(line, char, line, char + len);
				const name = editor.document.getText(range);
				const isGlobal = !!(mods & globalMask);

				// P3: and/or/not → bold keyword blue
				if (typeIdx === operatorIdx && LUA_KEYWORD_OPS.has(name)) {
					keywordRanges.push({ range });
					continue;
				}

				if (isGlobal) {
					const lineText = editor.document.lineAt(line).text;
					const prefix = lineText.substring(0, char).trimEnd();
					if (prefix.endsWith('.') || prefix.endsWith(':')) continue;

					// P4: method tokens treated same as property
					if (typeIdx === propertyIdx || typeIdx === methodIdx) {
						if (METAMETHODS.has(name)) blueRanges.push({ range });
						else if (PURPLE_METHODS.has(name)) purpleRanges.push({ range });
						continue;
					}

					if (BLUE_NAMES.has(name)) blueRanges.push({ range });
					else if (PURPLE_NAMES.has(name)) purpleRanges.push({ range });
				} else if (typeIdx !== propertyIdx && typeIdx !== methodIdx) {
					const color = aliasMap.get(name);
					if (color === 'blue') blueRanges.push({ range });
					else if (color === 'purple') purpleRanges.push({ range });
				} else if (METAMETHODS.has(name)) {
					blueRanges.push({ range });
				} else if (PURPLE_METHODS.has(name)) {
					purpleRanges.push({ range });
				}
			}

			editor.setDecorations(blueDecoration, blueRanges);
			editor.setDecorations(purpleDecoration, purpleRanges);
			editor.setDecorations(keywordDecoration, keywordRanges);
			editor.setDecorations(fastBlueDecoration, []);
			editor.setDecorations(fastPurpleDecoration, []);
			editor.setDecorations(fastKeywordDecoration, []);
		} catch (e) {
			// Semantic tokens not yet available
		}
	}

	function scheduleUpdate() {
		if (updateTimer) clearTimeout(updateTimer);
		updateTimer = setTimeout(() => {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				updateGlobalDecorations(editor);
			}
		}, 300);
	}

	// Events
	context.subscriptions.push(
		vscode.window.onDidChangeTextEditorVisibleRanges(e => {
			updateFoldDecorations(e.textEditor);
			if (e.textEditor.document.languageId === 'lua') {
				fastColorPass(e.textEditor);
				scheduleUpdate();
			}
		}),
		vscode.workspace.onDidOpenTextDocument(doc => {
			if (doc.languageId === 'lua') {
				const editor = vscode.window.activeTextEditor;
				if (editor && editor.document === doc) fastColorPass(editor);
			}
		}),
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor) {
				updateFoldDecorations(editor);
				if (editor.document.languageId === 'lua') fastColorPass(editor);
				updateUnusedDecorations(editor);
				scheduleUpdate();
			}
		}),
		vscode.workspace.onDidChangeTextDocument(() => scheduleUpdate()),
		vscode.languages.onDidChangeDiagnostics(() => {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				updateUnusedDecorations(editor);
			}
		}),
		vscode.window.onDidChangeTextEditorSelection(e => {
			if (active && rawGreyRanges.length > 0) {
				applyUnusedDecorations(e.textEditor);
			}
		}),
		foldDecoration,
		blueDecoration,
		purpleDecoration,
		keywordDecoration,
		fastBlueDecoration,
		fastPurpleDecoration,
		fastKeywordDecoration,
		greyDecoration,
		redDecoration,
		watcher
	);

	// ========== Feature 6: Dark terminal toggle ==========
	async function applyTerminalColors(dark) {
		const config = vscode.workspace.getConfiguration('workbench');
		const current = config.get('colorCustomizations') || {};
		if (dark) {
			await config.update('colorCustomizations',
				{ ...current, ...DARK_TERMINAL },
				vscode.ConfigurationTarget.Global);
		} else {
			const cleaned = { ...current };
			for (const key of DARK_ONLY_KEYS) delete cleaned[key];
			for (const [key, val] of Object.entries(DARK_TERMINAL)) {
				if (!DARK_ONLY_KEYS.has(key)) cleaned[key] = val;
			}
			await config.update('colorCustomizations',
				Object.keys(cleaned).length ? cleaned : undefined,
				vscode.ConfigurationTarget.Global);
		}
	}

	if (active) {
		const extCfg = vscode.workspace.getConfiguration('notepadpp-classic-light');
		applyTerminalColors(extCfg.get('darkTerminal', true));
	}

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('workbench.colorTheme')) {
				const wasActive = active;
				active = vscode.workspace.getConfiguration('workbench').get('colorTheme') === 'Notepad++ Classic Light';
				if (active && !wasActive) {
					const editor = vscode.window.activeTextEditor;
					if (editor) {
						updateFoldDecorations(editor);
						if (editor.document.languageId === 'lua') fastColorPass(editor);
						updateUnusedDecorations(editor);
						scheduleUpdate();
					}
					const cfg = vscode.workspace.getConfiguration('notepadpp-classic-light');
					applyTerminalColors(cfg.get('darkTerminal', true));
				} else if (!active && wasActive) {
					clearAllDecorations();
					applyTerminalColors(false);
				}
			}
			if (e.affectsConfiguration('notepadpp-classic-light.darkTerminal')) {
				if (active) {
					const cfg = vscode.workspace.getConfiguration('notepadpp-classic-light');
					applyTerminalColors(cfg.get('darkTerminal', true));
				}
			}
		})
	);

	// Initial update
	if (vscode.window.activeTextEditor) {
		const editor = vscode.window.activeTextEditor;
		updateFoldDecorations(editor);
		if (editor.document.languageId === 'lua') fastColorPass(editor);
		updateUnusedDecorations(editor);
		scheduleUpdate();
	}
}

function deactivate() {
	const config = vscode.workspace.getConfiguration('workbench');
	const current = config.get('colorCustomizations') || {};
	const cleaned = { ...current };
	for (const key of Object.keys(DARK_TERMINAL)) delete cleaned[key];
	config.update('colorCustomizations',
		Object.keys(cleaned).length ? cleaned : undefined,
		vscode.ConfigurationTarget.Global);
}

module.exports = { activate, deactivate };
