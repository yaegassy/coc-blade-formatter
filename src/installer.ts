import { ExtensionContext } from 'coc.nvim';
import cp from 'child_process';

export async function rebuild(context: ExtensionContext): Promise<string> {
  const cwd = context.extensionPath;

  const cmd = 'npm';
  const args = ['run', 'oniguruma:rebuild'];
  const opts = { cwd, shell: true }; // Use shell

  return new Promise(function (resolve, reject) {
    cp.execFile(cmd, args, opts, function (error) {
      if (error) {
        reject(`blade-formatter | build failure.`);
      }

      resolve('blade-formatter | build of oniguruma is complete!');
    });
  });
}
