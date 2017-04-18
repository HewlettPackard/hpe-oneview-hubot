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

'use strict';
import configLoader from '../config-loader';

export default class NotificationsFilter {

  constructor(robot) {
    let oneview_config = configLoader(robot);
    const filters = oneview_config.notificationsFilters;
    this.filters = filters;
    this.robot = robot;
    this.robot.logger.info('Configured with notification filters', this.filters);
  }

  check(message) {
    if (message) {
      return [message.resource].filter(::this.__filter__);
    }
  }

  __filter__(item) {
    if (this.filters) {
      for (var i=0; i < this.filters.length; i++) {
        return this.__checkFilter__(this.filters[i], item);
      }
    }
  }

  __checkFilter__(filter, item) {
    //TODO need to be case insensitive when matching the filter key to the message.resource.severity
    for (let key in filter) {
      if(item[key] === undefined || item[key] != filter[key]) {
        this.robot.logger.info('Message does not pass against filter', filter);
        return false;
      } else {
        this.robot.logger.info('Message passes against filter', filter);
        return true;
      }
    }
  }

}
