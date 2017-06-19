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

const uri = '/rest/server-hardware/';

export default class ServerHardware {
  constructor (ov_client) {
    this.ov_client = ov_client;
  }

  getAllServerHardware(filter) {
    return this.ov_client.connection.get(uri, filter);
  }

  getServerHardware(id) {
    return this.ov_client.connection.get(id.startsWith(uri) ? id : uri + id);
  }

  setPowerState(id, state, control) {
    let body = {powerState:state};
    if (control) {
      body.powerControl = control;
    }
    return this.ov_client.connection.put((id.startsWith(uri) ? id : uri + id) + '/powerState', body);
  }

  getHardwareByPowerState(state) {
    return this.ov_client.connection.get("/rest/server-hardware?filter=\"powerState=" + state + "\"");
  }

  getServerUtilization(id, filter) {
    return this.ov_client.connection.get((id.startsWith(uri) ? id : uri + id) + '/utilization', filter);
  }

  getHardwareByStatus(status) {
      return this.ov_client.connection.get("/rest/server-hardware?filter=\"status=" + status + "\"");
  }



  /*
  This function returns a response that contains both the server's interconnect port
  statistics and the telemetry configurations for the port.
  @param server hardware interconnect port statistics uri
  @param server hardware logical interconnect uri
  */
  getServerNetworkUtilization(shInterconnectPortStatisticsUri, shLogicalInterconnectUri) {
    return this.ov_client.connection.get(shInterconnectPortStatisticsUri).then((res) => {
      return Promise.all([res, this.ov_client.LogicalInterconnects.getLogicalInterconnectTelemetryConfiguration(shLogicalInterconnectUri)]);
    });
  }
}
