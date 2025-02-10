import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { waitForRenameEvent } from '../../extension';

const testWorkspace = vscode.Uri.file(path.resolve(__dirname, '../../../src/test/TestWorkspace'));
const testBase = 'src/App/TestBase.php';
const testBaseUpdate = 'src/App/TestBaseUpdate.php';
const testBaseMove = 'src/App/Controllers/TestBase.php';
const testController = 'src/App/Controllers/TestController.php';
const testModel = 'src/App/Models/TestModel.php';

suite('PHP File Refactoring Tests', () => {
  setup(async () => {
    await vscode.workspace
      .getConfiguration('phpFileRefactoring')
      .update('excludeOwnFileTypeName', false, vscode.ConfigurationTarget.Workspace);

    await vscode.workspace
      .getConfiguration('phpFileRefactoring')
      .update('safeRefactoring', true, vscode.ConfigurationTarget.Workspace);

    await vscode.workspace
      .getConfiguration('phpFileRefactoring')
      .update('autoSaveFiles', true, vscode.ConfigurationTarget.Workspace);
  });

  test('Renaming a PHP file updates class name with safe refactoring', async () => {
    const oldFilePath = path.join(testWorkspace.path, testBase);
    const newFilePath = path.join(testWorkspace.path, testBaseUpdate);
    const controllerFilePath = path.join(testWorkspace.path, testController);
    const modelFilePath = path.join(testWorkspace.path, testModel);

    // Ensure file exists before renaming
    assert.ok(fs.existsSync(oldFilePath), 'Old file does not exist');

    const oldUri = vscode.Uri.file(oldFilePath);
    const newUri = vscode.Uri.file(newFilePath);

    // Rename file
    const edit = new vscode.WorkspaceEdit();
    edit.renameFile(oldUri, newUri);

    await vscode.workspace.applyEdit(edit);

    await waitForRenameEvent();

    // Ensure the new file exists and old one is gone
    assert.ok(fs.existsSync(newFilePath), 'File rename failed');
    assert.ok(!fs.existsSync(oldFilePath), 'Old file still exists');

    await new Promise(resolve => setTimeout(resolve, 200));

    // Process queued changes
    await vscode.commands.executeCommand('phpFileRefactoring.processRefactoring');

    await new Promise(resolve => setTimeout(resolve, 100));

    // Read the file content and check class name update
    const content = fs.readFileSync(newFilePath, 'utf8');
    assert.ok(content.includes('class TestBaseUpdate'), 'Class name was not updated');

    // Read the file content and check class name update
    const controllerContent = fs.readFileSync(controllerFilePath, 'utf8');
    assert.ok(
      controllerContent.includes('use App\\TestBaseUpdate;'),
      'Use item name was not updated in TestController'
    );
    assert.ok(
      controllerContent.includes('public TestBaseUpdate'),
      'Public declaration not updated in TestController'
    );
    assert.ok(
      controllerContent.includes('test(): TestBaseUpdate'),
      'Function reference not updated in TestController'
    );

    // Read the file content and check class name update
    const modelContent = fs.readFileSync(modelFilePath, 'utf8');
    assert.ok(
      modelContent.includes('use App\\TestBaseUpdate as Base;'),
      'Alias not updated correctly in TestModel'
    );
    assert.ok(
      modelContent.includes('public Base '),
      'Public declaration incorrectly changed TestModel'
    );
    assert.ok(
      modelContent.includes('test(): Base'),
      'Function reference incorrectly changed in TestModel'
    );
  });

  test('Moving a PHP file updates namespace', async () => {
    const oldFilePath = path.join(testWorkspace.path, testBase);
    const newFilePath = path.join(testWorkspace.path, testBaseMove);

    // Ensure file exists before moving
    assert.ok(fs.existsSync(oldFilePath), 'Old file does not exist');

    const oldUri = vscode.Uri.file(oldFilePath);
    const newUri = vscode.Uri.file(newFilePath);

    // Move file
    const edit = new vscode.WorkspaceEdit();
    edit.renameFile(oldUri, newUri);

    await vscode.workspace.applyEdit(edit);

    await waitForRenameEvent();

    // Ensure the new file exists and old one is gone
    assert.ok(fs.existsSync(newFilePath), 'File move failed');
    assert.ok(!fs.existsSync(oldFilePath), 'Old file still exists');

    await new Promise(resolve => setTimeout(resolve, 150));

    // Process queued changes
    await vscode.commands.executeCommand('phpFileRefactoring.processRefactoring');

    await new Promise(resolve => setTimeout(resolve, 100));

    // Read the file content and check namespace update
    const content = fs.readFileSync(newFilePath, 'utf8');
    assert.ok(content.includes('namespace App\\Controllers;'), 'Namespace was not updated');
  });

  teardown(async () => {
    const oldFilePath = path.join(testWorkspace.path, testBase);
    const newFilePath = path.join(testWorkspace.path, testBaseUpdate);
    const movedFilePath = path.join(testWorkspace.path, testBaseMove);
    const controllerFilePath = path.join(testWorkspace.path, testController);
    const modelFilePath = path.join(testWorkspace.path, testModel);

    const oldUri = vscode.Uri.file(oldFilePath);
    const newUri = vscode.Uri.file(newFilePath);
    const movedUri = vscode.Uri.file(movedFilePath);

    if (fs.existsSync(newFilePath)) {
      // rename back and change file contents back.
      await vscode.workspace.fs.rename(newUri, oldUri);
      if (fs.existsSync(oldFilePath)) {
        const content = fs.readFileSync(oldFilePath, 'utf8');
        if (content.includes('class TestBaseUpdate')) {
          const updatedContent = content.replace(/class TestBaseUpdate/, 'class TestBase');
          fs.writeFileSync(oldFilePath, updatedContent, 'utf8');

          // Read the file content and check class name update
          const controllerContent = fs.readFileSync(controllerFilePath, 'utf8');
          let updatedControllerContent = controllerContent.replaceAll('TestBaseUpdate', 'TestBase');

          fs.writeFileSync(controllerFilePath, updatedControllerContent, 'utf8');

          // Read the file content and check class name update
          const modelContent = fs.readFileSync(modelFilePath, 'utf8');
          let updatedModelContent = modelContent.replace(
            /use App\\TestBaseUpdate as Base;/,
            'use App\\TestBase as Base;'
          );
          fs.writeFileSync(modelFilePath, updatedModelContent, 'utf8');
        }
      }
    }

    // Ensure move back and namespace is updated
    if (fs.existsSync(movedFilePath)) {
      await vscode.workspace.fs.rename(movedUri, oldUri);
      if (fs.existsSync(oldFilePath)) {
        const content = fs.readFileSync(oldFilePath, 'utf8');
        if (content.includes('namespace App\\Models;')) {
          const updatedContent = content.replace(/namespace App\\Models;/, 'namespace App;');
          fs.writeFileSync(oldFilePath, updatedContent, 'utf8');
        }
        if (content.includes('namespace App\\Controllers;')) {
          const updatedContent = content.replace(/namespace App\\Controllers;/, 'namespace App;');
          fs.writeFileSync(oldFilePath, updatedContent, 'utf8');
        }

        // Read the file content and check class name update
        const controllerContent = fs.readFileSync(controllerFilePath, 'utf8');
        let updatedControllerContent = controllerContent.replace(
          /use App\\Controllers\\TestBase;/,
          'use App\\TestBase;'
        );

        fs.writeFileSync(controllerFilePath, updatedControllerContent, 'utf8');

        // Read the file content and check class name update
        const modelContent = fs.readFileSync(modelFilePath, 'utf8');
        let updatedModelContent = modelContent.replace(
          /use App\\Controllers\\TestBase/,
          'use App\\TestBase'
        );
        fs.writeFileSync(modelFilePath, updatedModelContent, 'utf8');
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  });
});
