#!/bin/bash
echo "NODE_ENV: $NODE_ENV";

if [ "$NODE_ENV" == "prod" ]
    then
        echo "start prod mode...";
        npm run start:prod
else
    echo "start dev mode...";
    npm run start:dev
fi
