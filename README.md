# PHP File Refactoring

> Note: This is a new extension, if you encounter any bugs or issues please make sure you report them. [Report Issues](https://github.com/PlusTimeIT/vscode-php-file-refactoring/issues)

An extension for helping refactor PHP files when renaming or moving a file between namespaces. It's meant to follow a similar process to PHPStorms File Refactoring. Whilst it might not be as powerful, it does have a safe refactoring option.

## Features

- Safe Refactoring - When turned on (active by default), all refactoring changes will appear in the activity bar (refactoring icon). This is triggered by either moving a PHP file or renaming a PHP file.
- Utilizes a PHP parser to create an AST array for better identification of potential changes.
- Attempts to replace both fully qualified names and unqualified.
- If your project has a `composer.json` file it will attempt to make your autoload PSR-4 namespaces to

![Safe Refactoring](images/SafeRefactoring.gif 'Safe Refactoring')

## Requirements

This extension doesn't have any dependencies or requirements but you should turn on `autosave` for ease of life.

## Extension Settings

This extension contributes the following settings:

- `phpFileRefactoring.excludeFolders`: Folders to exclude when refactoring a workspace for changes. Default: `**/vendor/**`
- `phpFileRefactoring.excludedFiles`: If you already have excluded files set up with VS codes default settings, this will also exclude these files when refactoring.
- `phpFileRefactoring.excludedSearch`: If you already have excluded search options set up with VS codes default settings, this will also exclude these options when refactoring.
- `phpFileRefactoring.safeRefactoring`: All changes (except original file rename or move) need to be reviewed or confirmed.

## Known Issues

- PHP files that are moved with no namespace won't add additional namespace.

## Release Notes

### 0.0.1

Initial release of php file refactoring

---

## Following extension guidelines

**Enjoy!**
