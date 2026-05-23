#!/bin/sh

# Replace placeholders with environment variables in the built assets
echo "Replacing placeholders with actual environment variables..."
if [ -n "$COGNITO_CLIENT_ID" ] && [ -n "$COGNITO_DOMAIN" ]; then
  # Find all JS files in nginx html folder and replace placeholders
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|__COGNITO_CLIENT_ID_PLACEHOLDER__|$COGNITO_CLIENT_ID|g" {} +
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|__COGNITO_DOMAIN_PLACEHOLDER__|$COGNITO_DOMAIN|g" {} +
  echo "Placeholders replaced successfully."
else
  echo "COGNITO_CLIENT_ID or COGNITO_DOMAIN is missing. Skipping replacement."
fi

# Run the default Nginx command passed via CMD
exec "$@"
