type mode = 'refactor' | 'revert' | 'clear';

let currentMode: mode = 'refactor';

export function getMode(): mode {
  return currentMode;
}

export function setMode(value: mode): void {
  if (value !== 'refactor' && value !== 'revert' && value !== 'clear') {
    throw new Error(`Invalid mode: ${value}`);
  }
  currentMode = value as mode;
}
