import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface RenameFile {
  readonly oldUri: vscode.Uri;
  readonly newUri: vscode.Uri;
}

export function fileExists(filePath: string): boolean {
  try {
    fs.statSync(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

export function getFileNameFromUri(uri: vscode.Uri): string {
  const fsPath = uri.fsPath;
  const fileName = vscode.workspace.asRelativePath(fsPath);
  return fileName || uri.fsPath;
}

export function getNamespaceFromFilePath(filePath: string): string {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
  if (!workspaceFolder) {
    return '';
  }

  const relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);
  const namespace = path
    .dirname(relativePath)
    .replace(/[\\\/]/g, '\\') // Convert path separators to namespace separators
    .replace(/^\\/, ''); // Remove leading backslash

  return namespace === '.' ? '' : namespace;
}

export function mapFolderToPsr4(folder: string, filePath: string): string {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
  if (!workspaceFolder) {
    return folder.replace(/[\\\/]/g, '\\'); // Default mapping
  }
  const composerJsonPath = path.join(workspaceFolder.uri.fsPath, 'composer.json');
  if (!fileExists(composerJsonPath)) {
    return folder.replace(/[\\\/]/g, '\\'); // Default mapping
  }

  try {
    const composerJsonContent = fs.readFileSync(composerJsonPath, 'utf-8');
    const composerJson = JSON.parse(composerJsonContent);
    const psr4Config = composerJson.autoload && composerJson.autoload['psr-4'];

    if (psr4Config) {
      for (const expectedNamespace in psr4Config) {
        const mappedFolder = psr4Config[expectedNamespace].slice(0, -1);
        if (folder === mappedFolder || folder.includes(mappedFolder)) {
          return folder.replace(mappedFolder, expectedNamespace.slice(0, -1));
        }
      }
    }
  } catch (error) {
    console.error('Error reading or parsing composer.json:', error);
  }
  return folder.replace(/[\\\/]/g, '\\'); // Default mapping
}

export function traverseAst(node: any, callback: (node: any) => void) {
  if (node && typeof node === 'object') {
    callback(node);
    for (const key in node) {
      if (node.hasOwnProperty(key)) {
        traverseAst(node[key], callback);
      }
    }
  }
}
