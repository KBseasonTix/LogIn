// utils/transactions.js - MongoDB Transaction Helpers

const mongoose = require('mongoose');

/**
 * Execute a function within a MongoDB transaction
 * Automatically handles commit/rollback
 *
 * @param {Function} operation - Async function to execute within transaction
 * @returns {Promise<any>} - Result of the operation
 */
const withTransaction = async (operation) => {
  // Skip transactions in test mode or if not using replica set
  if (process.env.NODE_ENV === 'test' || !mongoose.connection.db) {
    // Execute without transaction
    return await operation(null);
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const result = await operation(session);

    await session.commitTransaction();

    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Retry a transaction if it fails due to transient errors
 *
 * @param {Function} operation - Async function to execute
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @returns {Promise<any>} - Result of the operation
 */
const withTransactionRetry = async (operation, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(operation);
    } catch (error) {
      lastError = error;

      // Check if error is transient (worth retrying)
      const isTransient =
        error.errorLabels?.includes('TransientTransactionError') ||
        error.code === 112 || // WriteConflict
        error.code === 251;   // NoSuchTransaction

      if (!isTransient || attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }

  throw lastError;
};

module.exports = {
  withTransaction,
  withTransactionRetry
};
