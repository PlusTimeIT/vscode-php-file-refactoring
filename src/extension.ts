import * as vscode from 'vscode';
import * as path from 'path';
import { output, initiateLog } from './log';
import { applyEditsToFile, applyEditsToWorkspace } from './refactor';
import { getNamespaceFromFilePath, mapFolderToPsr4 } from './utility';
import { ReviewItem, refactorProvider } from './provider';
import { getMode, setMode } from './mode';
import { initiateTreeView } from './treeview';

let renamePromiseResolver: ((value?: any) => void) | null = null;

export function waitForRenameEvent(): Promise<void> {
  return new Promise(resolve => {
    renamePromiseResolver = resolve;
  });
}

//context: vscode.ExtensionContext
export async function activate(context: vscode.ExtensionContext) {
  initiateLog();

  context.subscriptions.push(
    vscode.commands.registerCommand('phpFileRefactoring.openFile', (node: ReviewItem) => {
      if (node.resourceUri && node.range) {
        vscode.workspace.openTextDocument(node.resourceUri).then(document => {
          vscode.window.showTextDocument(document, { selection: node.range });
        });
      }
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('phpFileRefactoring.clearAll', () => {
      refactorProvider.clear();
      vscode.window.showInformationMessage('Reviews have been cleared.');
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('phpFileRefactoring.processRefactoring', () => {
      refactorProvider.process();
    })
  );

  initiateTreeView();

  const isSafeRefactoring = await vscode.workspace
    .getConfiguration('phpFileRefactoring')
    .get<boolean>('safeRefactoring');

  vscode.workspace.onDidRenameFiles(async e => {
    output(`Rename or file move detected.`);
    // check if data provider has awaiting items:
    let shouldRun = true;
    if (isSafeRefactoring && getMode() === 'refactor') {
      output(`Safe refactoring is enabled.`);
      if (refactorProvider.hasData()) {
        output(`DataProvider has items.`);
        await vscode.window
          .showInformationMessage(
            'You currently have items already queued for refactoring, are you sure you want to proceed?',
            'Yes',
            'No'
          )
          .then(answer => {
            if (answer === 'No') {
              shouldRun = false;
            } else {
              shouldRun = true;
            }
          });
      }
    }

    if (shouldRun && getMode() === 'refactor') {
      for (const file of e.files) {
        if (file.newUri.fsPath.endsWith('.php')) {
          try {
            const oldFileName = path.basename(file.oldUri.fsPath, '.php');
            const newFileName = path.basename(file.newUri.fsPath, '.php');

            // Determine the old and new namespaces
            const oldNamespace = getNamespaceFromFilePath(file.oldUri.fsPath);
            const newNamespace = getNamespaceFromFilePath(file.newUri.fsPath);

            const mappedNamespace = mapFolderToPsr4(newNamespace, file.newUri.fsPath);
            const oldMappedNamespace = mapFolderToPsr4(oldNamespace, file.newUri.fsPath);

            let currentNamespace = oldMappedNamespace;

            output(`Namespaces check: old ${oldMappedNamespace} | new: ${mappedNamespace}`);

            // Read the file content
            if (oldNamespace !== newNamespace) {
              output(
                `Namespace requires update... current namespace updated to ${mappedNamespace}`
              );
              currentNamespace = mappedNamespace;
            }

            output(`Searching occurrence of ${oldMappedNamespace} in ${file.newUri.fsPath}`);

            await applyEditsToFile(
              file,
              oldMappedNamespace,
              oldFileName,
              currentNamespace,
              newFileName
            );

            output(`Updates completed for: ${currentNamespace}`);

            // check if file is in current dataProvider
            refactorProvider.updateOldUriToNewUri(file.oldUri, file.newUri);

            await applyEditsToWorkspace(
              file.newUri.fsPath,
              oldMappedNamespace,
              oldFileName,
              currentNamespace,
              newFileName
            );

            output(`Updates completed for workspace.`);
            vscode.window.showInformationMessage('Rename or move successful.');
          } catch (error) {
            console.error('Error updating:', error);
          }
        }
      }
    } else {
      if (getMode() === 'refactor') {
        vscode.window.showInformationMessage(
          'No refactoring was done. Reverting moved or renamed file.'
        );
        // Revert the file renaming or moving
        const revertEdit = new vscode.WorkspaceEdit();
        setMode('revert');
        e.files.forEach(file => {
          revertEdit.renameFile(file.newUri, file.oldUri); // Swap oldUri and newUri to revert the change
        });

        // Use await to wait for the revert edit to complete
        await vscode.workspace.applyEdit(revertEdit);
      }
    }
    setMode('refactor');

    if (renamePromiseResolver) {
      renamePromiseResolver(); // Resolve the promise
      renamePromiseResolver = null; // Reset for future renames
    }
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
