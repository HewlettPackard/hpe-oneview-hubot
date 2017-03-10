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

const d3 = require('d3');
const jsdom = require('jsdom');
const fs = require("fs");
const svg2png = require("svg2png");

const margin = {top: 30, right: 20, bottom: 70, left: 50},
    width = 600 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

function buildD3DataArray(metricList) {
  let data = [];
  if (metricList) {
    for (let i=0; i < metricList.length; i++) {
      let name = metricList[i].metricName;
      let samples = metricList[i].metricSamples;
      for (let j=0; j < samples.length; j++) {
        let sampleData = samples[j];
        let d = new Date(0); //uses local time zone
        d.setUTCSeconds(samples[j][0] / 1000);
        data.push({metric: name, date: d.toISOString(), value: samples[j][1]});
      }
    }
    return data;
  }
}

function chooseLabel(metricName) {
  switch (metricName) {
    case 'CPU':
      return 'Ghz';
    case 'Power':
      return 'W';
    case 'Temperature':
      return 'C';
    default:
      break;
    }
}

export default function MetricToPng(robot, metricName, metricList) {

  jsdom.env(
    "<html><body></body></html>",
    ['http://d3js.org/d3.v4.js'],
    function (err, window) {

      let data = buildD3DataArray(metricList);
      let color = d3.scaleOrdinal(d3.schemeCategory10);

      // Parse the date / time
      let parseDate = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ");

      // Set the ranges
      let x = d3.scaleTime().range([0, width]);
      let y = d3.scaleLinear().range([height, 0]);

      // Define the line
      let valueline = d3.line()
      .curve(d3.curveBasis)
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.value); });

      // Adds the svg canvas
      let svg = window.d3.select("body")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      data.forEach(function(d) {
		    d.date = parseDate(d.date);
		    d.value = +d.value;
      });

      // Scale the range of the data
      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain([0, d3.max(data, function(d) { return d.value; })]);

      // Nest the entries by metric
      let dataNest = d3.nest()
      .key(function(d) {return d.metric;})
      .entries(data);

      let legendSpace = width/dataNest.length;

      // Loop through each metric / key
      dataNest.forEach(function(d, i) {
          svg.append("path")
          .attr("stroke", color(i))
          .attr("stroke-width", 2)
          .attr("fill", "none")
          .attr("d", valueline(d.values));

          // Add the Legend
          svg.append("text")
          .attr("x", (legendSpace/2)+i*legendSpace)
          .attr("y", height + (margin.bottom/2)+ 5)
          .style("font-family", "sans-serif")
          .style("font-size", "12px")
          .style("fill", function() {return d.color = color(i); })
          .text(d.key);
      });

      // Add the X Axis
      svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

      // Add a title
      svg.append("text")
      .attr("x", (width / 2))
      .attr("y", 0 - (margin.top / 2))
      .attr("text-anchor", "middle")
      .style("font-family", "sans-serif")
      .style("font-size", "14px")
      .text(metricName);

      // Add axis label
      svg.append("text")
      .attr("x",  0 - 35)
      .attr("y", (height / 2))
      .attr("text-anchor", "middle")
      .style("font-family", "sans-serif")
      .style("font-size", "10px")
      .text(chooseLabel(metricName));

      // Add the Y Axis
      svg.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0s"))); //will need custom tickFormat per chart

      let buf = Buffer.from(window.d3.select("body").html());

      svg2png(buf)
      .then(buffer => fs.writeFile("dest.png", buffer))
      .catch(e => robot.logger.error(e));
    });

    if (robot.adapterName === 'slack') {

      let readStream = fs.createReadStream("dest.png");
      let file = {
          file: readStream,
          channels: 'random',
          name: metricName + '.PNG',
          filetype: 'png'
      };

      robot.adapter.client.web.files.upload(' ', file, (err, res) => {
        if (err) {
          robot.logger.error('Error on Slack web upload', err);
        }
        if (res.ok) {
          robot.logger.info('Completed Slack web upload of chart.');
        }
      });

    } else {
      robot.logger.info('Adapter ' + robot.adapterName + ' does not support web file upload.');
    }

    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve();
      }, 4000);
    });
}
