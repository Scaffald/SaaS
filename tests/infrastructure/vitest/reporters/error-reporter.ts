
import type { Reporter, Vitest } from 'vitest';

export default class ErrorReporter implements Reporter {
  onRunComplete(files, errors) {
    if (errors && errors.length > 0) {
      console.log('❌ Detailed error report:');
      for (const error of errors) {
        console.log(`- ${error.name}: ${error.message}`);
        console.log(error.stack);
      }
    }
  }
}
