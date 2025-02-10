import * as vscode from 'vscode';
import { ReviewItem, refactorProvider } from './provider';

let refactorTreeView: vscode.TreeView<ReviewItem>;

export function initiateTreeView(): void {
  refactorTreeView = vscode.window.createTreeView('refactor-reviews', {
    treeDataProvider: refactorProvider,
    showCollapseAll: true
  });
}

export function setBadge(badge: number | undefined): void {
  refactorTreeView.badge = undefined;
  if (badge !== undefined) {
    refactorTreeView.badge = { tooltip: 'Awaiting refactoring', value: badge };
  }
}
