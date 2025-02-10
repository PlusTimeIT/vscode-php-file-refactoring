import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
  fileExists,
  getFileNameFromUri,
  getNamespaceFromFilePath,
  mapFolderToPsr4,
  traverseAst
} from '../../utility';

const TEST_WORKSPACE = vscode.Uri.file(path.resolve(__dirname, '../../../src/test/TestWorkspace'));

suite('Utility Tests', () => {
  test('fileExists() returns true for existing files', () => {
    assert.strictEqual(
      fileExists(path.join(TEST_WORKSPACE.fsPath, 'src/App/Controllers/TestController.php')),
      true,
      'fileExists should return true for existing file'
    );
  });

  test('fileExists() returns false for non-existing files', () => {
    const testFile = path.join(TEST_WORKSPACE.fsPath, 'src/App/Controllers/NonExistent.php');
    assert.strictEqual(
      fileExists(testFile),
      false,
      'fileExists should return false for missing file'
    );
  });

  test('getFileNameFromUri() extracts correct filename', () => {
    const testUri = vscode.Uri.file(
      path.join(TEST_WORKSPACE.fsPath, 'src/App/Controllers/TestController.php')
    );
    assert.strictEqual(
      getFileNameFromUri(testUri),
      'src/App/Controllers/TestController.php',
      'Filename extraction failed'
    );
  });

  test('getNamespaceFromFilePath() generates correct namespace', () => {
    const testFile = path.join(TEST_WORKSPACE.fsPath, 'src/App/Controllers/TestController.php');
    const namespace = getNamespaceFromFilePath(testFile);
    assert.strictEqual(namespace, 'src\\App\\Controllers', 'Namespace generation failed');
  });

  test('mapFolderToPsr4() maps correctly based on composer.json', () => {
    const mappedNamespace = mapFolderToPsr4(
      'src/App/Controllers',
      path.join(TEST_WORKSPACE.fsPath, 'src/App/Controllers/TestController.php')
    );
    assert.strictEqual(mappedNamespace, 'App\\Controllers', 'PSR-4 namespace mapping failed');
  });

  test('traverseAst() visits all nodes', () => {
    const ast = {
      kind: 'class',
      name: 'TestClass',
      properties: [
        { kind: 'property', name: 'prop1' },
        { kind: 'property', name: 'prop2' }
      ]
    };

    const visitedNodes: string[] = [];
    traverseAst(ast, node => {
      if (node.kind) {
        visitedNodes.push(node.kind);
      }
    });

    assert.deepStrictEqual(
      visitedNodes,
      ['class', 'property', 'property'],
      'AST traversal did not visit all nodes'
    );
  });
});
