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

import BladeFormattingEditProvider, { doFormat, fullDocumentRange } from './format';

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

  // End of project
  const message = `This project is no longer maintained. Please switch to its successor, "coc-blade"`;
  const howTo = 'Open "coc-blade" homepege?';

  const option = await window.showInformationMessage(message, howTo);

  if (option === howTo) {
    commands.executeCommand('vscode.open', ['https://github.com/yaegassy/coc-blade']);
  }
  // /End of project

  const outputChannel = window.createOutputChannel('bladeFormatter');

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
}
