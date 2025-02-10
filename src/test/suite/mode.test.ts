import * as assert from 'assert';
import { getMode, setMode } from '../../mode';

suite('Mode Tests', () => {
  test('Default mode is "refactor"', () => {
    assert.strictEqual(getMode(), 'refactor', 'Default mode should be "refactor"');
  });

  test('Setting mode to "revert"', () => {
    setMode('revert');
    assert.strictEqual(getMode(), 'revert', 'Mode should be "revert"');
  });

  test('Setting mode to "clear"', () => {
    setMode('clear');
    assert.strictEqual(getMode(), 'clear', 'Mode should be "clear"');
  });

  test('Setting mode to "refactor"', () => {
    setMode('refactor');
    assert.strictEqual(getMode(), 'refactor', 'Mode should be "refactor"');
  });

  test('Invalid mode throws an error', () => {
    assert.throws(
      () => setMode('invalidMode' as any),
      /Invalid mode: invalidMode/,
      'Should throw an error for invalid mode'
    );
  });
});
