# coc-blade-formatter

[blade-formatter](https://github.com/shufo/blade-formatter) (Laravel Blade formatter) extension for [coc.nvim](https://github.com/neoclide/coc.nvim)

## Install

**CocInstall**:

```
:CocInstall coc-blade-formatter
```

**vim-plug**:

```vim
Plug 'yaegassy/coc-blade-formatter', {'do': 'yarn install --frozen-lockfile'}
```

## Note

### Filetype related

The "filetype" must be `blade` for this extension to work.

Set up `autocmd BufNewFile,BufRead *.blade.php set filetype=blade` in `.vimrc/init.vim`, Or install "blade" related plugin (e.g. [jwalton512/vim-blade](https://github.com/jwalton512/vim-blade) or [sheerun/vim-polyglot](https://github.com/sheerun/vim-polyglot)).

## Usage

- `:call CocAction('format')`
- `:CocCommand bladeFormatter.run`

## Configuration options

- `bladeFormatter.enable`: Whether it enables format, default: `true`
- `bladeFormatter.path`: Absolute path to blade-formatter. If there is no setting, the built-in blade-formatter will be used, default: `""`
- `bladeFormatter.format.indentSize`: Indent size, default: `4`
- `bladeFormatter.format.wrapLineLength`: The length of line wrap size, default: `120`
- `bladeFormatter.format.wrapAttributes`: The way to wrap attributes, valid options `["auto", "force", "force-aligned", "force-expand-multiline", "aligned-multiple", "preserve", "preserve-aligned"]`, default: `"auto"`

## Commands

- `bladeFormatter.run`: Run bladeFormatter.run

## Ignoring Files: .bladeignore

To exclude files from formatting, create `.bladeignore` file in the root of your project `.bladeignore` uses [gitignore syntax] (https://git-scm.com/docs/gitignore#_pattern_format)

```gitignore
# Ignore email templates
resources/views/email/**
```

## Thanks

- <https://github.com/shufo/blade-formatter>
- <https://github.com/shufo/vscode-blade-formatter>

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
