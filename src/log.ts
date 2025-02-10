import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel;

export function initiateLog() {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('PHP File Name Refactoring');
  }
}

export function output(...messages: string[]) {
  if (!outputChannel) {
    initiateLog(); // Ensure channel is initialized
  }
  for (const message of messages) {
    outputChannel.appendLine(message);
  }
}

// ✅ Export outputChannel to be used in tests
export function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    initiateLog();
  }
  return outputChannel;
}
