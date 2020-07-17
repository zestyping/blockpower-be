#!/bin/bash

if [ ! -f /data/dbms/auth ]; then
  if [ -f /run/secrets/neo4j_pass ]; then
    NEO4J_PASSWORD=$(cat /run/secrets/neo4j_pass)
  else
    [ -z "$NEO4J_PASSWORD" ] && export NEO4J_PASSWORD=hellovoter
  fi
  export NEO4J_AUTH=neo4j/$NEO4J_PASSWORD
fi

[ -n "$DISABLE_JMX" ] && unset NEO4J_dbms_jvm_additional

node node_modules/@babel/node/lib/_babel-node app/server.js & disown
exec /docker-entrypoint.sh neo4j
