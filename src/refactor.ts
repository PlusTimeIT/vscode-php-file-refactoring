import * as vscode from 'vscode';
import { output } from './log';
import { RenameFile, getFileNameFromUri, traverseAst } from './utility';
import { ReviewItem, refactorProvider } from './provider';

export async function applyEdits(
  file: RenameFile,
  searchNamespace: string,
  searchClassName: string,
  replaceNamespace: string,
  replaceClassName: string
): Promise<boolean> {
  const uri = file.newUri;
  output('CHECKING FILE - LABEL - ', getFileNameFromUri(file.newUri), file.newUri.fsPath);
  const isSafeRefactoring = await vscode.workspace
    .getConfiguration('phpFileRefactoring')
    .get('safeRefactoring');

  try {
    const content = await vscode.workspace.fs.readFile(uri);
    const code = new TextDecoder().decode(content);
    var phpParser = require('php-parser');
    let parser = new phpParser({
      parser: { debug: false, suppressErrors: false, ast: { withPositions: true } }
    });
    const ast = parser.parseCode(code);
    let requiresAlias = false;
    let shouldReplaceUQN = false;
    let isParentNamespace = false;
    let namespaceRequiresUpdate = false;
    let namespacePosition: null | vscode.Range = null;
    const replaceFQN = replaceNamespace + '\\' + replaceClassName;
    const searchFQN = searchNamespace + '\\' + searchClassName;
    const edit = new vscode.WorkspaceEdit();
    let iterationID = 0;
    traverseAst(ast, async (node: any) => {
      console.log('KIND: ', node.kind);
      if (node.kind === 'namespace' && node.name === searchNamespace) {
        output(file.newUri.fsPath, `Own class detected - ${node.name}`);
        // is the namespace fpr the parent file (the one being renamed)
        // set shouldReplaceUQN so class name is updated.
        isParentNamespace = true;
        if (searchNamespace !== replaceNamespace) {
          // namespace requires update
          namespaceRequiresUpdate = true;
          namespacePosition = new vscode.Range(
            new vscode.Position(node.loc.start.line - 1, node.loc.start.column + 10),
            new vscode.Position(node.loc.start.line - 1, searchNamespace.length + 10)
          );
        }
      } else if (
        node.kind === 'class' ||
        node.kind === 'interface' ||
        node.kind === 'trait' ||
        node.kind === 'enum'
      ) {
        if (node.name.name === searchClassName && isParentNamespace) {
          if (namespaceRequiresUpdate) {
            // update namespace
            // +10 on column to account for the word namespace (including space)
            // end position on namespace goes to bottom of namespace so use the start position line, then the length of the older namespace.
            if (isSafeRefactoring) {
              refactorProvider.addChild(
                file,
                new ReviewItem(
                  `${getFileNameFromUri(uri)}-namespace`,
                  uri,
                  file.oldUri,
                  'namespace',
                  searchNamespace,
                  replaceNamespace,
                  namespacePosition as vscode.Range,
                  `${searchNamespace} => ${replaceNamespace}`
                )
              );
            } else {
              output(
                file.newUri.fsPath,
                'Replacing Namespace',
                searchNamespace,
                'with',
                replaceNamespace
              );
              edit.replace(uri, namespacePosition as vscode.Range, replaceNamespace);
            }
          }

          const classRange = new vscode.Range(
            new vscode.Position(node.name.loc.start.line - 1, node.name.loc.start.column),
            new vscode.Position(node.name.loc.end.line - 1, node.name.loc.end.column)
          );

          if (searchClassName !== replaceClassName) {
            if (isSafeRefactoring) {
              // check if file has review tree item to add to children, if not add it.
              refactorProvider.addChild(
                file,
                new ReviewItem(
                  `${getFileNameFromUri(uri)}-${node.kind}`,
                  uri,
                  file.oldUri,
                  node.kind,
                  searchClassName,
                  replaceClassName,
                  classRange,
                  `${searchClassName} => ${replaceClassName}`
                )
              );
            } else {
              output(
                file.newUri.fsPath,
                'Replacing Class',
                node.name.name,
                'with',
                replaceClassName
              );
              edit.replace(uri, classRange, replaceClassName);
            }
          }
        }
      } else if (node.kind === 'useitem') {
        const nodeName = node.name?.name ?? node.name ?? '';
        if (nodeName.includes(replaceClassName) && nodeName !== searchFQN) {
          // name is already taken in file.
          requiresAlias = true;
        } else if (nodeName === searchFQN) {
          const useItemRange = new vscode.Range(
            new vscode.Position(node.loc.start.line - 1, node.loc.start.column),
            new vscode.Position(node.loc.end.line - 1, node.loc.end.column)
          );
          if (isSafeRefactoring) {
            // check if file has review tree item to add to children, if not add it.
            refactorProvider.addChild(
              file,
              new ReviewItem(
                `${getFileNameFromUri(uri)}-${node.kind}`,
                uri,
                file.oldUri,
                node.kind,
                searchFQN,
                replaceFQN,
                useItemRange,
                `${searchFQN} => ${replaceFQN}`
              )
            );
          } else {
            output(file.newUri.fsPath, 'Replacing USE Item', nodeName, 'with', replaceFQN);
            edit.replace(uri, useItemRange, replaceFQN);
          }
          shouldReplaceUQN = true;
        }
      } else {
        if (node.kind) {
          const otherRange = new vscode.Range(
            new vscode.Position(node.loc.start.line - 1, node.loc.start.column),
            new vscode.Position(node.loc.end.line - 1, node.loc.end.column)
          );
          if (node.name === searchClassName && shouldReplaceUQN) {
            // if UQN and safe to replace UQN (it's being used above in a use statement)
            if (searchClassName !== replaceClassName) {
              if (isSafeRefactoring) {
                // check if file has review tree item to add to children, if not add it.
                refactorProvider.addChild(
                  file,
                  new ReviewItem(
                    `${getFileNameFromUri(uri)}-${node.kind}-${iterationID}`,
                    uri,
                    file.oldUri,
                    node.kind,
                    searchClassName,
                    replaceClassName,
                    otherRange,
                    `${searchClassName} => ${replaceClassName}`
                  )
                );
              } else {
                output(file.newUri.fsPath, 'Replacing UQN', node.name, 'with', replaceFQN);
                edit.replace(uri, otherRange, replaceClassName);
              }
            }
          } else if (node.name === searchFQN || node.name === '\\' + searchFQN) {
            if (searchClassName !== replaceClassName) {
              if (isSafeRefactoring) {
                // check if file has review tree item to add to children, if not add it.
                refactorProvider.addChild(
                  file,
                  new ReviewItem(
                    `${getFileNameFromUri(uri)}-${node.kind}-${iterationID}`,
                    uri,
                    file.oldUri,
                    node.kind,
                    node.name.startsWith('\\') ? '\\' + searchFQN : searchFQN,
                    node.name.startsWith('\\') ? '\\' + replaceFQN : replaceFQN,
                    otherRange,
                    `${node.name.startsWith('\\') ? '\\' + searchFQN : searchFQN} => ${node.name.startsWith('\\') ? '\\' + replaceFQN : replaceFQN}`
                  )
                );
              } else {
                // if FQN always replace.
                output(
                  file.newUri.fsPath,
                  'Replacing FQN',
                  node.name,
                  'with',
                  node.name.startsWith('\\') ? '\\' + replaceFQN : replaceFQN
                );
                edit.replace(
                  uri,
                  otherRange,
                  node.name.startsWith('\\') ? '\\' + replaceFQN : replaceFQN
                );
              }
            }
          }
          iterationID++;
        }
      }
    });

    if (isSafeRefactoring) {
      refactorProvider.refresh();
    } else {
      await vscode.workspace.applyEdit(edit);
    }

    return true;
  } catch (error) {
    console.error('Error reading or processing file:', error);
    return false;
  }
}

export async function applyEditsToFile(
  file: RenameFile,
  fullOldNamespace: string,
  oldFileName: string,
  fullNewNamespace: string,
  newFileName: string
) {
  await applyEdits(file, fullOldNamespace, oldFileName, fullNewNamespace, newFileName);
}

export async function applyEditsToWorkspace(
  parentFile: string,
  fullOldNamespace: string,
  oldFileName: string,
  fullNewNamespace: string,
  newFileName: string
) {
  output(`Searching occurrence of ${fullOldNamespace} in workspace`);
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showWarningMessage('No workspace opened.');
    return;
  }

  let exclude = [
    ...((await vscode.workspace
      .getConfiguration('phpFileRefactoring')
      .get('excludeFolders')) as string[])
  ];

  if (await vscode.workspace.getConfiguration('phpFileRefactoring').get('excludedFiles')) {
    exclude.push(
      ...Object.keys((await vscode.workspace.getConfiguration('files', null).get('exclude')) || {})
    );
  }
  if (await vscode.workspace.getConfiguration('phpFileRefactoring').get('excludedSearch')) {
    exclude.push(
      ...Object.keys((await vscode.workspace.getConfiguration('search', null).get('exclude')) || {})
    );
  }

  const files = await vscode.workspace.findFiles('**/*.php', `{${exclude.join(',')}}`);
  output(`PHP Files found: ${files.length}`);
  await Promise.all(
    files.map(async file => {
      if (parentFile !== file.fsPath) {
        applyEditsToFile(
          { newUri: vscode.Uri.file(file.fsPath), oldUri: vscode.Uri.file(file.fsPath) },
          fullOldNamespace,
          oldFileName,
          fullNewNamespace,
          newFileName
        );
      } else {
        output('Skipping parent file');
      }
    })
  );

  output(`Search completed for: ${fullNewNamespace}`);
}
