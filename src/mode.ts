type mode = 'refactor' | 'revert' | 'clear';

let currentMode: mode = 'refactor';

export function getMode(): mode {
  return currentMode;
}

export function setMode(value: mode): void {
  currentMode = value;
}
