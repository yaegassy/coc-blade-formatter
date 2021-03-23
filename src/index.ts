import {
  TextEdit,
  workspace,
  commands,
  ExtensionContext,
  languages,
  Disposable,
  DocumentSelector,
  window,
} from 'coc.nvim';

import path from 'path';
import fs from 'fs';

import BladeFormattingEditProvider, { doFormat, fullDocumentRange } from './format';
import { rebuild } from './installer';

let formatterHandler: undefined | Disposable;

function disposeHandlers(): void {
  if (formatterHandler) {
    formatterHandler.dispose();
  }
  formatterHandler = undefined;
}

export async function activate(context: ExtensionContext): Promise<void> {
  const extensionConfig = workspace.getConfiguration('bladeFormatter');
  const isEnable = extensionConfig.get<boolean>('enable', true);
  if (!isEnable) return;

  const outputChannel = window.createOutputChannel('bladeFormatter');

  const isVscodeOnigurumaDir = path.join(
    context.extensionPath,
    'node_modules',
    'blade-formatter',
    'node_modules',
    'vscode-oniguruma'
  );

  if (!fs.existsSync(isVscodeOnigurumaDir)) {
    await rebuildWrapper(context);
  }

  const editProvider = new BladeFormattingEditProvider(context, outputChannel);
  const priority = 1;

  function registerFormatter(): void {
    disposeHandlers();
    const languageSelector: DocumentSelector = [{ language: 'blade', scheme: 'file' }];

    formatterHandler = languages.registerDocumentFormatProvider(languageSelector, editProvider, priority);
  }
  registerFormatter();

  context.subscriptions.push(
    commands.registerCommand('bladeFormatter.run', async () => {
      const doc = await workspace.document;

      const code = await doFormat(context, outputChannel, doc.textDocument, undefined);
      const edits = [TextEdit.replace(fullDocumentRange(doc.textDocument), code)];
      if (edits) {
        await doc.applyEdits(edits);
      }
    })
  );

  context.subscriptions.push(
    commands.registerCommand('bladeFormatter.rebuild', async () => {
      await rebuildWrapper(context);
    })
  );
}

async function rebuildWrapper(context: ExtensionContext) {
  let msg = '[blade-formatter] Run a build/rebuild of oniguruma?';

  let ret = 0;
  ret = await window.showQuickpick(['Yes', 'Cancel'], msg);
  if (ret === 0) {
    try {
      setTimeout(() => {
        window.showWarningMessage('blade-formatter | oniguruma build start...');
      }, 500);

      msg = await rebuild(context);
      window.showWarningMessage(msg);
    } catch (e) {
      console.error(e);
      msg = 'Install blade-formatter failed, you can get it from https://www.npmjs.com/package/blade-formatter';
      window.showMessage(msg, 'error');
      return;
    }
  } else {
    return;
  }
}
