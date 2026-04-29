/**
 * Retry wrapper for Bedrock API calls with throttling-aware backoff.
 *
 * Tuned to stay under API Gateway's 29s integration timeout:
 *   maxRetries=3, delays ~2s, 4s, 8s => worst case ~14s of waiting + call time.
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

async function callBedrockWithRetry(client, command, { maxRetries = 3, baseDelayMs = 2000 } = {}) {
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
          const friendly = new Error(
            'The AI service is currently rate-limited. Please wait 30-60 seconds before trying again. ' +
            'If this keeps happening, your AWS Bedrock account may need a quota increase.'
          );
          friendly.name = 'ThrottlingException';
          friendly.cause = error;
          throw friendly;
        }
        throw error;
      }

      // Exponential backoff with jitter. Kept short to stay under API Gateway 29s timeout.
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 500;
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
