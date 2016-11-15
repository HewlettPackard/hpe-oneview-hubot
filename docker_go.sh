#!/bin/bash
if [ ! -d /home/docker/hpe-oneview-hubot/node_modules ]; then
  cp -rf /home/docker/hpe-oneview-hubot-org/node_modules/ /home/docker/hpe-oneview-hubot/
fi

cd /home/docker/hpe-oneview-hubot
gulp watch &

sleep 5

cd /home/docker/hubot

unset HTTP_PROXY
unset HTTPS_PROXY
unset http_proxy
unset https_proxy

jq -s add /home/docker/hpe-oneview-hubot/oneview-configuration.json /home/docker/hpe-oneview-hubot/local-configuration.json > /home/docker/hubot/oneview-configuration.json

echo "## LOCAL (~/hubot/hpe-oneview-configuration.json) ##---------------------"
cat /home/docker/hpe-oneview-hubot/local-configuration.json
echo "-------------------------------------------------------------------------"
echo ""
echo "## GIT_REPO (/home/docker/hpe-oneview-hubot/oneview-configuration.json) #"
cat /home/docker/hpe-oneview-hubot/oneview-configuration.json
echo "-------------------------------------------------------------------------"
echo ""
echo "## MERGED (js -s add LOCAL GIT_REPO) ##----------------------------------"
cat /home/docker/hubot/oneview-configuration.json
echo "-------------------------------------------------------------------------"
echo ""
echo "##################################################################"
echo " HUBOT_NAME: ${HUBOT_NAME}"
echo " If HUBOT_NAME is empty, be sure to export HUBOT_NAME"
echo " in your environment."
echo " "
echo " Once you see: Connected to SCMB, waiting for messages..."
echo " Test hubot with:"
echo " [ENTER] (to see prompt...)"
echo " ${HUBOT_NAME}> @${HUBOT_NAME} list all server hardware"
echo " To exit:"
echo " exit (or ^C)"
echo " [ENTER] (or ^C)"
echo " exit"
echo "##################################################################"

bin/hubot --name $HUBOT_NAME $PARMS
