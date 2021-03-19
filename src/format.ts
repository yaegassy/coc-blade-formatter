import {
  DocumentFormattingEditProvider,
  Range,
  TextDocument,
  TextEdit,
  Uri,
  window,
  workspace,
  ExtensionContext,
  OutputChannel,
} from 'coc.nvim';

import cp from 'child_process';
import fs from 'fs';
import path from 'path';
import tmp from 'tmp';
import ignore from 'ignore';

export async function doFormat(
  context: ExtensionContext,
  outputChannel: OutputChannel,
  document: TextDocument,
  range?: Range
): Promise<string> {
  outputChannel.appendLine(`${'#'.repeat(10)} blade-formatter\n`);

  const fileName = Uri.parse(document.uri).fsPath;
  const text = document.getText(range);

  if (document.languageId !== 'blade') {
    window.showErrorMessage('bladeFormatter.run cannot run, not a blade file');
    return text;
  }

  const extensionConfig = workspace.getConfiguration('bladeFormatter');

  const formatIndentSize = extensionConfig.get('format.indentSize', 4);
  const formatWrapLineLength = extensionConfig.get('format.wrapLineLength', 120);
  const formatWrapAttributes = extensionConfig.get('format.wrapAttributes', 'auto');

  let binPath = extensionConfig.get('path', '');
  if (!binPath) {
    if (fs.existsSync(context.asAbsolutePath('node_modules/blade-formatter/bin/blade-formatter'))) {
      binPath = context.asAbsolutePath('node_modules/blade-formatter/bin/blade-formatter');
    } else {
      window.showErrorMessage('Unable to find the blade-formatter.');
      return text;
    }
  } else {
    if (!fs.existsSync(binPath)) {
      window.showErrorMessage('Unable to find the blade-formatter (user setting).');
      return text;
    }
  }

  const isIgnoreFile = shouldIgnore(fileName, outputChannel);
  if (isIgnoreFile) {
    window.showWarningMessage('.bladeignore matched file.');
    return text;
  }

  const args: string[] = [];
  const cwd = Uri.file(workspace.root).fsPath;

  // Use shell
  const opts = { cwd, shell: true };

  args.push(`--indent-size ${formatIndentSize}`);
  args.push(`--wrap-line-length ${formatWrapLineLength}`);
  args.push(`--wrap-attributes ${formatWrapAttributes}`);

  const tmpFile = tmp.fileSync();
  fs.writeFileSync(tmpFile.name, text);

  outputChannel.appendLine(`Run: node ${binPath} ${args.join(' ')} ${tmpFile.name}\n`);
  outputChannel.appendLine(`Cwd: ${opts.cwd}\n`);

  return new Promise(function (resolve) {
    cp.execFile('node', [binPath, ...args, tmpFile.name], opts, function (error, stdout, stderr) {
      if (error) {
        tmpFile.removeCallback();

        if (error.code === 'ENOENT') {
          window.showErrorMessage('Unable to find the blade-formatter tool.');
          outputChannel.appendLine('Error: Unable to find the blade-formatter tool.\n');
          return;
        }

        window.showErrorMessage('There was an error while running blade-formatter.');
        outputChannel.appendLine(`Error: ${error.message}\n`);
        return;
      }

      if (stderr) {
        outputChannel.appendLine('STDERR: Restore the original text.\n');
        const tmpText = fs.readFileSync(tmpFile.name, 'utf-8');
        tmpFile.removeCallback();
        return resolve(tmpText);
      }

      outputChannel.appendLine('STDOUT: Success.\n');
      const newText = stdout;
      tmpFile.removeCallback();
      resolve(newText);
    });
  });
}

export function fullDocumentRange(document: TextDocument): Range {
  const lastLineId = document.lineCount - 1;
  const doc = workspace.getDocument(document.uri);

  return Range.create({ character: 0, line: 0 }, { character: doc.getline(lastLineId).length, line: lastLineId });
}

class BladeFormattingEditProvider implements DocumentFormattingEditProvider {
  public _context: ExtensionContext;
  public _outputChannel: OutputChannel;

  constructor(context: ExtensionContext, outputChannel: OutputChannel) {
    this._context = context;
    this._outputChannel = outputChannel;
  }

  public provideDocumentFormattingEdits(document: TextDocument): Promise<TextEdit[]> {
    return this._provideEdits(document, undefined);
  }

  private async _provideEdits(document: TextDocument, range?: Range): Promise<TextEdit[]> {
    const code = await doFormat(this._context, this._outputChannel, document, range);
    if (!range) {
      range = fullDocumentRange(document);
    }
    return [TextEdit.replace(range, code)];
  }
}

function shouldIgnore(filepath: string, outputChannel: OutputChannel): boolean {
  const workspaceRootDir = Uri.file(workspace.root).fsPath;

  const ignoreFilename = '.bladeignore';
  const ignoreFilePath = path.join(workspaceRootDir, ignoreFilename);

  if (fs.existsSync(ignoreFilePath)) {
    const ignoreFileContent = fs.readFileSync(ignoreFilePath, 'utf-8');
    const ig = ignore().add(ignoreFileContent);

    try {
      outputChannel.appendLine(`IGNORE: matched ${filepath}`);
      return ig.ignores(path.relative(workspaceRootDir, filepath));
    } catch (err) {
      return false;
    }
  }

  return false;
}

export default BladeFormattingEditProvider;
