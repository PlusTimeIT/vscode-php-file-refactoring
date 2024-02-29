# PHP File Refactoring

> Note: This is a new extension, if you encounter any bugs or issues please make sure you report them. [Report Issues](https://github.com/PlusTimeIT/vscode-php-file-refactoring/issues)

An extension for helping refactor PHP files when renaming or moving a file between namespaces. It's meant to follow a similar process to PHPStorms File Refactoring. Whilst it might not be as powerful, it does have a safe refactoring option.

## Features

- Safe Refactoring - When turned on (active by default), all refactoring changes will appear in the activity bar (refactoring icon). This is triggered by either moving a PHP file or renaming a PHP file.
- Utilizes a PHP parser to create an AST array for better identification of potential changes.
- Replaces both fully qualified names and unqualified names where possible.
- If your project has a `composer.json` file it will attempt to map your autoload PSR-4 namespaces to any changes that have occurred.
- When files are moved, it will update that files namespace, along with any occurrences throughout our project.
- Clicking on the reviews will take you to the file, line and column of the proposed change.

![Safe Refactoring](images/SafeRefactoring.gif 'Safe Refactoring')

## Requirements

This extension doesn't have any dependencies or requirements but you should turn on `autosave` for ease of life.

## Extension Settings

This extension contributes the following settings:

- `phpFileRefactoring.excludeFolders`: Folders to exclude when refactoring a workspace for changes. Default: `**/vendor/**`
- `phpFileRefactoring.excludedFiles`: If you already have excluded files set up with VS codes default settings, this will also exclude these files when refactoring.
- `phpFileRefactoring.excludedSearch`: If you already have excluded search options set up with VS codes default settings, this will also exclude these options when refactoring.
- `phpFileRefactoring.safeRefactoring`: All changes (except original file rename or move) need to be reviewed or confirmed.
- `phpFileRefactoring.excludeOwnFileTypeName`: Exclude own file, name type (class, trait, enum etc.) when refactoring it's own file

## Known Issues

- PHP files that are moved with no namespace won't add additional namespace.

## Release Notes

### 0.1.3

Added option to disable name type update in settings, if you have another plugin that updates the files type name (within it's self) this setting will stop this extension from updating it.

### 0.1.2

Fix bug with interfaces, traits and enums. Added MIT license file

---

### 0.1.1

- Initial release of php file refactoring, added Badge to activity icon for review count

---

## Following extension guidelines

**Enjoy!**
