#!/bin/bash

STARTDIR=$(pwd)

cd $home >/dev/null          # /home/name for linux...
cd $USERPROFILE >/dev/null   # C:/users/name for windows, empty for linux...

if [ ! -d ./hubot/ ]; then
  echo ""
  echo "Welcome!  Looks like you're just getting started with hubot..."
  mkdir ./hubot/
  echo " * I just created a hubot/ directory in $(pwd)..."
  cp $STARTDIR/oneview-configuration.json ./hubot/oneview-configuration.json
  echo " * I just copied a config file to that directory..."
  echo "Now go ahead and make any changes to it then save it,"
  echo "then I'll get the hubot started..."
  echo ""
  echo "Press ENTER to continue..."
  read X
  vi ./hubot/oneview-configuration.json
fi
cp ./hubot/oneview-configuration.json $STARTDIR/local-configuration.json
cd $STARTDIR
docker run -it --rm -e "PARMS=$*" -e "HUBOT_NAME=$HUBOT_NAME" -e "HUBOT_SLACK_TOKEN=$HUBOT_SLACK_TOKEN" -v $(pwd):/home/docker/oneview-hubot hub.docker.hpecorp.net/jesse/oneview-hubot:latest
rm ./local-configuration.json

