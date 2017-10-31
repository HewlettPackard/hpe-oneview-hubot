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
const uriSplitter = /^(.*)uri$/i;
const hyperlinkDetector = /^.*hyperlink$/i;

class ResourceEnhancer {
  constructor(host) {
    this.host = host;
  }

  removeHyperlinks(obj) {
    if (obj) {
      const remove = [];
      Object.keys(obj).forEach((key) => {
        const val = obj[key];

        if (!val) {
          return;
        } else if (Array.isArray(val)) {
          val.forEach((v) => { this.removeHyperlinks(v); });
        } else if (typeof val === 'object' && Object.keys(val).length !== 0) {
          this.removeHyperlinks(val);
        } else if (typeof val === 'string') {
          if (hyperlinkDetector.test(key)) {
            remove.push(key);
          }
        }
      });

      for (let i = 0, len = remove.length; i < len; i++) {
        delete obj[remove[i]];
      }
    }

    return obj;
  }

  transformHyperlinks(auth, obj) {
    if (obj) {
      Object.keys(obj).forEach((key) => {
        const val = obj[key];

        if (!val) {
          return;
        } else if (Array.isArray(val)) {
          val.forEach((v) => { this.transformHyperlinks(auth, v); });
        } else if (typeof val === 'object' && Object.keys(val).length !== 0) {
          this.transformHyperlinks(auth, val);
        } else if (typeof val === 'string') {
          const match = key.match(uriSplitter);
          if (match) {
            let newKey = 'hyperlink';
            if (match[1]) {
              newKey = match[1] + 'Hyperlink';
            }

            obj[newKey] = 'https://' + this.host + '/#/' + __guiRoute__(val) + val + (auth ? '?s_sid=' + auth : '');
          }
        }
      });
      if (obj.type && obj.type.toLowerCase().startsWith('server-hardware')) {
        __addSHInterconnectDowlinkHyperlinks__(obj);
      }
    }
    return obj;
  }
}

function __addSHInterconnectDowlinkHyperlinks__(obj){
  if (obj.portMap && obj.portMap.deviceSlots) {
    let serverInterconnectPortLinks = [];
    for (let slot of obj.portMap.deviceSlots) {
      if (slot.physicalPorts && slot.physicalPorts.length > 0) {
        for (let physicalPort of slot.physicalPorts) {
          serverInterconnectPortLinks.push(physicalPort.physicalInterconnectUri + '/statistics/d' + physicalPort.interconnectPort);
        }
      }
    }
    obj.serverInterconnectPortLinks = serverInterconnectPortLinks;
  }
}

function __guiRoute__(uri) {
  if (uri.startsWith('/rest/server-hardware/')) {
    return 'server-hardware/show/overview/r';
  }

  if (uri.startsWith('/rest/server-profiles/')) {
    return 'profiles/show/overview/r';
  }

  if (uri.startsWith('/rest/server-profile-templates/')) {
    return 'profile-templates/show/overview/r';
  }

  if (uri.startsWith('/rest/enclosures/')) {
    return 'enclosure/show/overview/r';
  }

  if (uri.startsWith('/rest/server-hardware-types/')) {
    return 'server-hardware-types/show/general/r';
  }

  if (uri.startsWith('/rest/logical-enclosures/')) {
    return 'logicalenclosures/show/overview/r';
  }

  if (uri.startsWith('/rest/enclosure-groups/')) {
    return 'enclosuregroups/show/interconectbayconfiguration/r';
  }

  if (uri.startsWith('/rest/alerts') || uri.startsWith('/rest/tasks/')) {
    return 'activity/r';
  }

  //TODO Fill in the rest of the OneView resource views
  return '';
}

module.exports = ResourceEnhancer;
