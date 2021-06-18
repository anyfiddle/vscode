/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ITerminalEditorService, ITerminalInstance } from 'vs/workbench/contrib/terminal/browser/terminal';
import { TerminalEditorInput } from 'vs/workbench/contrib/terminal/browser/terminalEditorInput';
import { TerminalLocation } from 'vs/workbench/contrib/terminal/common/terminal';
import { IEditorService } from 'vs/workbench/services/editor/common/editorService';

export class TerminalEditorService implements ITerminalEditorService {
	declare _serviceBrand: undefined;

	terminalEditorInstances: ITerminalInstance[] = [];

	private _editorInputs: Map</*instanceId*/number, TerminalEditorInput> = new Map();

	constructor(
		@IEditorService private readonly _editorService: IEditorService
	) {
		// TODO: Multiplex instance events
	}

	getOrCreateEditor(instance: ITerminalInstance): TerminalEditorInput {
		const revivedEditor = this._editorInputs.get(instance.instanceId);
		if (revivedEditor) {
			return revivedEditor;
		}
		instance.target = TerminalLocation.Editor;
		const editor = new TerminalEditorInput(instance);
		this._editorService.openEditor(editor, {
			pinned: true,
			forceReload: true
		});
		this.terminalEditorInstances.push(instance);
		this._editorInputs.set(instance.instanceId, editor);
		return editor;
	}

	detachActiveEditorInstance(): ITerminalInstance {
		const activeEditor = this._editorService.activeEditor;
		if (!(activeEditor instanceof TerminalEditorInput)) {
			throw new Error('Active editor is not a terminal');
		}
		const instance = activeEditor.terminalInstance;
		if (!instance) {
			throw new Error('Terminal is already detached');
		}
		this.detachInstance(instance);
		return instance;
	}

	detachInstance(instance: ITerminalInstance) {
		const editor = this._editorInputs.get(instance.instanceId);
		editor?.detachInstance();
		const instanceIndex = this.terminalEditorInstances.findIndex(e => e === instance);
		if (instanceIndex !== -1) {
			this.terminalEditorInstances.splice(instanceIndex, 1);
		}
		editor?.dispose();
	}
}
