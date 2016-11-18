#!/bin/bash
echo ./docker_build.sh:
./docker_build.sh
if [ $? -lt 1 ];
then
  echo ./docker_push.sh:
  ./docker_push.sh
else
  echo "docker_build.sh failed.  SKIPPING push..."
fi
