
import type { Reporter, Vitest } from 'vitest';

export default class SummaryReporter implements Reporter {
  onRunStart() {
    console.log('🏁 Starting test run...');
  }

  onRunComplete(files, errors) {
    console.log('🏁 Test run complete!');
    if (errors && errors.length > 0) {
      console.log('❌ Some tests failed:');
      for (const error of errors) {
        console.log(`- ${error.name}: ${error.message}`);
      }
    } else {
      console.log('✅ All tests passed!');
    }
  }
}
