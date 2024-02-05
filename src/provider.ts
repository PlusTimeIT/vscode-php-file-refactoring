import * as vscode from 'vscode';
import { setMode } from './mode';
import { RenameFile } from './utility';
import { setBadge } from './treeview';

export class RefactorDataProvider implements vscode.TreeDataProvider<ReviewItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ReviewItem | undefined> =
    new vscode.EventEmitter<ReviewItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ReviewItem | undefined> =
    this._onDidChangeTreeData.event;

  private data: ReviewItem[] = [];

  updateOldUriToNewUri(oldUri: vscode.Uri, newUri: vscode.Uri) {
    for (const item of this.data) {
      if (item.resourceUri?.fsPath === oldUri.fsPath) {
        item.resourceUri = newUri;
      }
    }
  }

  setData(data: ReviewItem[]) {
    this.data = data;
    this.refresh();
  }

  hasData(): boolean {
    return this.data.length > 0;
  }

  addNode(data: ReviewItem) {
    this.data.push(data);
    setBadge(this.hasData() ? this.data.length : undefined);
  }

  refresh(data?: ReviewItem): void {
    this._onDidChangeTreeData.fire(data);
  }

  async clear(skipChecks: boolean = false): Promise<void> {
    // revert any rename or move changes.
    if (!skipChecks) {
      const revertEdit = new vscode.WorkspaceEdit();
      for (const item of this.data) {
        const children = item?.children?.filter(
          item => item.checkboxState === vscode.TreeItemCheckboxState.Checked
        );
        for (const reviewItem of children ?? []) {
          // only checked children will be processed.
          setMode('clear');
          console.log('CLEARING:', reviewItem.resourceUri, reviewItem.oldUri);
          revertEdit.renameFile(reviewItem.resourceUri, reviewItem.oldUri); // Swap oldUri and newUri to revert the change
        }
      }

      // Use await to wait for the revert edit to complete
      await vscode.workspace.applyEdit(revertEdit);
    }
    this.data = [];
    setMode('refactor');
    setBadge(undefined);
    this.refresh();
  }

  getTreeItem(element: ReviewItem): vscode.TreeItem {
    return element;
  }

  async process(): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    for (const item of this.data) {
      const children = item?.children?.filter(
        item => item.checkboxState === vscode.TreeItemCheckboxState.Checked
      );
      for (const reviewItem of children ?? []) {
        // only checked children will be processed.
        edit.replace(
          reviewItem.resourceUri,
          reviewItem.range as vscode.Range,
          reviewItem.replaceText as string
        );
      }
    }
    await vscode.workspace.applyEdit(edit);
    this.clear(true);
  }
  addChild(file: RenameFile, element: ReviewItem): Thenable<ReviewItem[] | undefined> {
    let index: number = refactorProvider.findIndexById(file.newUri.fsPath);
    if (index === -1) {
      // create parent
      console.log('ADDED PARENT');
      this.addNode(
        new ReviewItem(
          file.newUri.fsPath,
          file.newUri,
          file.oldUri,
          `File`,
          undefined,
          undefined,
          undefined,
          undefined,
          [],
          vscode.TreeItemCollapsibleState.Expanded
        )
      );
      index = refactorProvider.findIndexById(file.newUri.fsPath);
    }

    this.data[index]?.children?.push(element);
    this.refresh();
    return Promise.resolve(this.data);
  }

  findItemByLabel(label: string): ReviewItem | undefined {
    return this.data.find(item => item.label === label);
  }

  findIndexByLabel(label: string): number {
    return this.data.findIndex(item => item.label === label);
  }

  findIndexById(id: string): number {
    return this.data.findIndex(item => item.id === id);
  }

  getChildren(element?: ReviewItem): Thenable<ReviewItem[] | undefined> {
    if (element) {
      // If there are child nodes for the given element, return them.
      return Promise.resolve(element.children);
    }
    return Promise.resolve(this.data);
  }
}

export class ReviewItem extends vscode.TreeItem {
  constructor(
    public readonly id: string,
    public resourceUri: vscode.Uri,
    public oldUri: vscode.Uri,
    public readonly description: string,
    public readonly searchText?: string,
    public readonly replaceText?: string,
    public readonly range?: vscode.Range,
    public readonly label?: string,
    public children: ReviewItem[] | undefined = [],
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode
      .TreeItemCollapsibleState.None,
    public readonly checkboxState: vscode.TreeItemCheckboxState = vscode.TreeItemCheckboxState
      .Checked
  ) {
    const passedLabel = label ?? resourceUri.fsPath;
    super(passedLabel, collapsibleState);
  }

  command = {
    command: 'phpFileRefactoring.openFile',
    title: 'Open File',
    arguments: [this]
  };
}

// To handle the command to open the file:

export const refactorProvider = new RefactorDataProvider();
