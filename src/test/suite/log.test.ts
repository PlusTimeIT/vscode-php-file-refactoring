import * as assert from 'assert';
import { initiateLog, output, getOutputChannel } from '../../log';

suite('Log Tests', () => {
  suiteSetup(() => {
    initiateLog(); // Ensure logging system is initialized
  });

  test('Log channel is created', () => {
    const logChannel = getOutputChannel();
    assert.ok(logChannel, 'Log channel was not created');
    assert.strictEqual(
      logChannel.name,
      'PHP File Name Refactoring',
      'Log channel name is incorrect'
    );
  });
});
