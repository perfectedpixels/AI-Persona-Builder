/**
 * Retry wrapper for Bedrock API calls.
 * Retries on throttling and transient errors with exponential backoff + jitter.
 *
 * Throttling gets more aggressive retries since Bedrock TPM/RPM quotas
 * can recover within seconds.
 */

function isThrottling(error) {
  return (
    error.name === 'ThrottlingException' ||
    error.$metadata?.httpStatusCode === 429 ||
    /too many requests|throttl/i.test(error.message || '')
  );
}

function isTransient(error) {
  return (
    error.name === 'ServiceUnavailableException' ||
    error.name === 'ModelTimeoutException' ||
    error.name === 'InternalServerException' ||
    (error.$metadata?.httpStatusCode >= 500 && error.$metadata?.httpStatusCode < 600)
  );
}

async function callBedrockWithRetry(client, command, { maxRetries = 5, baseDelayMs = 1500 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.send(command);
      return response;
    } catch (error) {
      lastError = error;

      const throttled = isThrottling(error);
      const transient = isTransient(error);
      const isRetryable = throttled || transient;

      if (!isRetryable || attempt === maxRetries) {
        if (throttled) {
          // Rewrite the error so callers/users see something actionable
          const friendly = new Error(
            'The AI service is currently rate-limited. Please wait 30-60 seconds and try again. ' +
            'If this keeps happening, try making fewer rapid changes to the agent controls.'
          );
          friendly.name = 'ThrottlingException';
          friendly.cause = error;
          throw friendly;
        }
        throw error;
      }

      // Exponential backoff. Throttling gets a bigger base delay because
      // Bedrock TPM/RPM windows are ~1 minute.
      const base = throttled ? baseDelayMs * 2 : baseDelayMs;
      const delay = base * Math.pow(2, attempt) + Math.random() * 1000;
      console.warn(
        `Bedrock call ${throttled ? 'throttled' : 'failed'} (${error.name}), ` +
        `retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})...`
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

module.exports = { callBedrockWithRetry };
