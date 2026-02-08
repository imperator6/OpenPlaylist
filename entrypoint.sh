#!/bin/sh
set -e

# Fix permissions on storage directory if it exists
if [ -d "/app/storage" ]; then
  # Check if we can write to storage directory
  if ! touch /app/storage/.write_test 2>/dev/null; then
    echo "Warning: Storage directory is not writable by current user"
    echo "This may cause issues with session and queue persistence"
  else
    rm -f /app/storage/.write_test
  fi
fi

# Execute the main command
exec "$@"
