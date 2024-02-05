import * as vscode from 'vscode';
let outputChannel: vscode.OutputChannel;

export function initiateLog() {
  outputChannel = vscode.window.createOutputChannel('PHP File Name Refactoring');
}

export function output(...messages: string[]) {
  for (const message of messages) {
    outputChannel.appendLine(message);
  }
}
