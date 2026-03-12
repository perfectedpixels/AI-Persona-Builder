/**
 * Retry wrapper for Bedrock API calls.
 * Retries on throttling and transient errors with exponential backoff.
 */
async function callBedrockWithRetry(client, command, { maxRetries = 2, baseDelayMs = 1000 } = {}) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.send(command);
      return response;
    } catch (error) {
      lastError = error;
      
      const isRetryable = 
        error.name === 'ThrottlingException' ||
        error.name === 'ServiceUnavailableException' ||
        error.name === 'ModelTimeoutException' ||
        error.$metadata?.httpStatusCode === 429 ||
        error.$metadata?.httpStatusCode >= 500;
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 500;
      console.warn(`Bedrock call failed (${error.name}), retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

module.exports = { callBedrockWithRetry };
