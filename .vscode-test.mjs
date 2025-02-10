import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  label: 'unitTests',
  workspaceFolder: './src/test/TestWorkspace/',
  files: 'out/test/**/*.test.js'
});
