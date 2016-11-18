#!/bin/bash
echo "NOTE: Add -a slack to ./docker_run.sh to run in slack..."

if [ -z "$HUBOT_NAME" ];
then
  echo "export HUBOT_NAME before continuing."
  echo "e.g."
  echo "export HUBOT_NAME=my-bot"
  echo "but use your own name."
  echo ""
  echo "Also, so you don't have to set it next time,"
  echo "you may want to add that to your"
  echo "~/.bashrc or ~/.bash_profile file"
  echo "or for Windows, set it in your environment variables."
  echo "Have a great day!"
  exit
fi

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
docker run -it --rm -e "PARMS=$*" -e "HUBOT_NAME=$HUBOT_NAME" -e "HUBOT_SLACK_TOKEN=$HUBOT_SLACK_TOKEN" -v $(pwd):/home/docker/hpe-oneview-hubot docker.io/jesseolsen/hpe-oneview-hubot:latest
rm ./local-configuration.json

