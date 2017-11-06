/*
(c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
const Enhance = require('../oneview-sdk/utils/enhance');
const ResourceTransforms = require('./utils/resource-transforms');
const DeveloperListener = require('./developer');
const ServerHardwareListener = require('./server-hardware');
const ServerProfilesListener = require('./server-profiles');
const ServerProfileTemplateListener = require('./server-profile-templates');
const DashboardListener = require('./dashboard-listener');
const AlertsListener = require('./alerts-listener');
const DefaultListener = require('./default-listener');
const BotListener = require('./bot');
const NotificationsFilter = require('./notifications-filter');
const url = require('url');

const listener = (robot, client, brain) => {
  const transform = new ResourceTransforms(robot, brain);
  const filter = new NotificationsFilter(robot);

  const dev = new DeveloperListener(robot, client, transform);
  const sh = new ServerHardwareListener(robot, client, transform, brain);
  const sp = new ServerProfilesListener(robot, client, transform, sh, brain);
  const spt = new ServerProfileTemplateListener(robot, client, transform, sh, sp, brain);
  const dash = new DashboardListener(robot, client, transform);
  const al = new AlertsListener(robot, client, transform);
  const deft = new DefaultListener(robot, transform);

  // LAST!!
  new BotListener(robot, client, transform, dev, sh, sp, spt);

  // TODO: Bug This should not be bound here, probably want a NotificationsListener instead
  // TODO This is a total hack, we need to pull the transformer out of the client
  robot.on('__hpe__notification__', function (message) {
    let uri = url.parse('https://' + message.resourceUri);
    let auth = client.getAuthToken(uri.hostname);

    const enhance = new Enhance(uri.hostname);

    //remove host before transform
    message.resourceUri = uri.path;
    let resource = enhance.transformHyperlinks(auth, message);
    let checkedMessage = filter.check(resource);
    if (typeof checkedMessage !== 'undefined' && checkedMessage.length > 0) {
      let room = '#' + client.chatRoom;

      if (robot.adapterName === 'flowdock') {
        room = client.chatRoom;
      }

      transform.messageRoom(room, resource.resource);
    }
  });
};

module.exports = listener;
