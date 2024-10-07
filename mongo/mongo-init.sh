#!/bin/bash
# Script to create multiple MongoDB users, each for a different database.

# auth db
mongosh <<EOF
use $MONGO_AUTH_DB_DATABASE
db.createUser({
  user: '$MONGO_AUTH_DB_USERNAME',
  pwd: '$MONGO_AUTH_DB_PASSWORD',
  roles: [{ role: 'readWrite', db: '$MONGO_AUTH_DB_DATABASE' }]
});
EOF

# users db
mongosh <<EOF
use $MONGO_USERS_DB_DATABASE
db.createUser({
  user: '$MONGO_USERS_DB_USERNAME',
  pwd: '$MONGO_USERS_DB_PASSWORD',
  roles: [{ role: 'readWrite', db: '$MONGO_USERS_DB_DATABASE' }]
});
EOF
