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
import DefaultListener from './default-listener';
import BotListener from './bot';
import NotificationsFilter from './notifications-filter';

export default function(robot, client) {
  const enhance = new Enhance(client.host);
  const transform = new ResourceTransforms(robot);
  const filter = new NotificationsFilter(robot);

  const dev = new DeveloperListener(robot, client, transform);
  const sh = new ServerHardwareListener(robot, client, transform);
  const sp = new ServerProfilesListener(robot, client, transform, sh);
  const spt = new ServerProfileTemplateListener(robot, client, transform, sh, sp);
  const deft = new DefaultListener(robot, transform);

  // LAST!!
  new BotListener(robot, client, transform, dev, sh, sp, spt);

  // TODO: Bug This should not be bound here, probably want a NotificationsListener instead
  // connect to the SCMB to emit notifications
  robot.on('__hpe__notification__', function (message) {
    //TODO This is a total hack, we need to pull the transformer out of the client
    client.ClientConnection.__newSession__().then((auth) => {
      return enhance.transformHyperlinks(auth, message);
    }).then((resource) => {
      let checkedMessage = filter.check(message);
      if (typeof checkedMessage !== 'undefined' && checkedMessage.length > 0) {
        transform.messageRoom(client.notificationsRoom, resource.resource);
      }
    }).catch((err) => {
      robot.logger.error(err);
    });
  });
}
