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

import Enhance from '../oneview-sdk/utils/enhance';
import ResourceTransforms from './utils/resource-transforms';
import DeveloperListener from './developer';
import ServerHardwareListener from './server-hardware';
import ServerProfilesListener from './server-profiles';
import ServerProfileTemplateListener from './server-profile-templates';
import DashboardListener from './dashboard-listener';
import AlertsListener from './alerts-listener';
import DefaultListener from './default-listener';
import BotListener from './bot';
import NotificationsFilter from './notifications-filter';
const url = require('url');

export default function(robot, client) {
  const transform = new ResourceTransforms(robot);
  const filter = new NotificationsFilter(robot);

  const dev = new DeveloperListener(robot, client, transform);
  const sh = new ServerHardwareListener(robot, client, transform);
  const sp = new ServerProfilesListener(robot, client, transform, sh);
  const spt = new ServerProfileTemplateListener(robot, client, transform, sh, sp);
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
      let room = '';

      if (robot.adapterName === 'flowdock') {
        room = client.notificationsRoom;
      } else {
        room = '#' + client.notificationsRoom;
      }

      transform.messageRoom(room, resource.resource);
    }
  });
}
