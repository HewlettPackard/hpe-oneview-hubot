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

function __uploadPNG__(robot, room, fileName) {
  return new Promise((resolve, reject) => {
    if (robot.adapterName === 'slack') {
      let readStream = fs.createReadStream(fileName);
      let file = {
          file: readStream,
          channels: room,
          name: fileName,
          filetype: 'png'
      };
      robot.adapter.client.web.files.upload(' ', file, (err, res) => {
        if (err) {
          robot.logger.error('Error on Slack web upload', err);
          reject('Error on Slack web upload', err);
        }
        if (res.ok) {
          robot.logger.info('Completed Slack web upload of chart.');
          resolve('Completed Slack web upload of chart.');
        }
      });
    } else {
      resolve('Adapter ' + robot.adapterName + ' does not support web file upload.');
      robot.logger.info('Adapter ' + robot.adapterName + ' does not support web file upload.');
    }
  });
}

function __transformProfileData__(aggregatedServerProfiles) {
  let aggregatedCounts = {'members': []};
  for (let member of aggregatedServerProfiles.members) {
    aggregatedCounts.members.push(...member.counts);
  }

  let profiles = {};
  let newSeries = [];
  let totalCount = 0;
  let dataset = [];

  aggregatedCounts.members.forEach(function(e) {
    if(!profiles[e.value]) {
      let label = e.value;
      profiles[e.value] = 0;
    }
    profiles[e.value] += e.count;
    totalCount += e.count;
  });
  let totalSplits = 0;
  for (let key in profiles) {
    dataset.push({ label: key, count: profiles[key], percent: profiles[key] / totalCount} );
    totalSplits++;
  }

  return { splits: totalSplits, totalCount: totalCount, dataset: dataset };
}

function __transformHardwareData__(aggregatedServerHardware) {
  let aggregatedCounts = {'members': []};
  for (let member of aggregatedServerHardware.members) {
    aggregatedCounts.members.push(...member.counts);
  }

  let hardware = {};
  let newSeries = [];
  let totalCount = 0;
  let dataset = [];

  aggregatedCounts.members.forEach(function(e) {
    if(!hardware[e.value]) {
      let label = e.value;
      hardware[e.value] = 0;
    }
    hardware[e.value] += e.count;
    totalCount += e.count;
  });
  let totalSplits = 0;
  for (let key in hardware) {
    if (key === "") {
      dataset.push({ label: "Disabled", count: hardware[key], percent: hardware[key] / totalCount} );
    } else {
      dataset.push({ label: key, count: hardware[key], percent: hardware[key] / totalCount} );
    }
    totalSplits++;
  }

  return { splits: totalSplits, totalCount: totalCount, dataset: dataset };
}

function __transformAlertsData__(aggregatedAlerts) {
  let aggregatedCounts = {'members': []};
  for (let member of aggregatedAlerts.members) {
    aggregatedCounts.members.push(...member.counts);
  }

  let alerts = {};
  let newSeries = [];
  let totalCount = 0;
  let dataset = [];

  aggregatedCounts.members.forEach(function(e) {
    if(!alerts[e.value]) {
      let label = e.value;
      alerts[e.value] = 0;
    }
    alerts[e.value] += e.count;
    totalCount += e.count;
  });
  let totalSplits = 0;
  for (let key in alerts) {
    dataset.push({ label: key, count: alerts[key], percent: alerts[key] / totalCount} );
    totalSplits++;
  }

  return { splits: totalSplits, totalCount: totalCount, dataset: dataset };
}

function __transformHardwareWithProfilesData__(aggregatedHardwareWithProfiles) {

  let aggregatedCounts = {'members': []};
  for (let member of aggregatedHardwareWithProfiles.members) {
    aggregatedCounts.members.push(...member.counts);
  }

  let hardwareWithProfiles = {};
  let newSeries = [];
  let totalCount = 0;
  let dataset = [];

  aggregatedCounts.members.forEach(function(e) {
    if(!hardwareWithProfiles[e.value]) {
      let label = e.value;
      hardwareWithProfiles[e.value] = 0;
    }
    hardwareWithProfiles[e.value] += e.count;
    totalCount += e.count;
  });
  let totalSplits = 0;
  let temp = "";
  for (let key in hardwareWithProfiles) {
    if (key === "ProfileApplied") {
      temp = "Has Profile";
    }  else if (key === "NoProfileApplied") {
      temp = "No Profile";
    } else  {
      temp = "Unmanaged";
    }
    dataset.push({ label: temp, count: hardwareWithProfiles[key], percent: hardwareWithProfiles[key] / totalCount} );

    totalSplits++;
  }

  return { splits: totalSplits, totalCount: totalCount, dataset: dataset };
}

function __addHeadersAndLines__(svg) {
  //adding headers to each section and lines to separate in the center
  svg.append("text")
    .attr("x", 75)
    .attr("y", 75)
    .style("font-size", "3.0em")
    .style("font-family", "'MetricHPE Black'")
    .text("Server Profiles");

  svg.append("text")
    .attr("x", 680)
    .attr("y", 75)
    .style("font-size", "3.0em")
    .style("font-family", "'MetricHPE Black'")
    .text("Server Hardware");

  svg.append("text")
    .attr("x", 75)
    .attr("y", 700)
    .style("font-size", "3.0em")
    .style("font-family", "'MetricHPE Black'")
    .text("Apppliance Alerts");

  svg.append("text")
    .attr("x", 680)
    .attr("y", 700)
    .style("font-size", "3.0em")
    .style("font-family", "'MetricHPE Black'")
    .text("Servers with profiles");

  svg.append("svg:line")
    .attr("x1", 75)
    .attr("x2", 550)
    .attr("y1", 575)
    .attr("y2", 575)
    .style("stroke", "rgb(189, 189, 189)");

  svg.append("svg:line")
    .attr("x1", 680)
    .attr("x2", 1155)
    .attr("y1", 575)
    .attr("y2", 575)
    .style("stroke", "rgb(189, 189, 189)");
}

function buildDashboard(robot, room, aggregatedAlerts, aggregatedServerProfiles, aggregatedServerHardware, aggregatedHardwareWithProfiles) {

  return new Promise((resolve, reject) => {

    //split the data for pie generation
    let profiles = __transformProfileData__(aggregatedServerProfiles);
    let splits1 = profiles.splits;
    let totalCount1 = profiles.totalCount;
    let dataset1 = profiles.dataset;

    let hardware = __transformHardwareData__(aggregatedServerHardware);
    let splits2 = hardware.splits;
    let totalCount2 = hardware.totalCount;
    let dataset2 = hardware.dataset;

    let alerts = __transformAlertsData__(aggregatedAlerts);
    let splits3 = alerts.splits;
    let totalCount3 = alerts.totalCount;
    let dataset3 = alerts.dataset;

    let hardwareWithProfiles = __transformHardwareWithProfilesData__(aggregatedHardwareWithProfiles);
    let splits4 = hardwareWithProfiles.splits;
    let totalCount4 = hardwareWithProfiles.totalCount;
    let dataset4 = hardwareWithProfiles.dataset;

    //generate the document to write the svg
    const document = jsdom.jsdom("<html><body></body></html>");
    document.d3 = d3.select(document);

    //set the radius of the donut (the center part)
    let radius = 200;

    //color scheme
    let color1 = d3.scaleOrdinal()
        .domain(["Critical", "OK", "Warning", "No Profiles", "No Alerts", "No Hardware", "Has Profile", "No Profile", "UNKNOWN", "Unmanaged", "Disabled"])
        .range(['#FF454F', '#01A982', '#FFD042', '#C6C9CA', '#C6C9CA', '#C6C9CA', '#425563', '#C6C9CA', '#C6C9CA', '#80746E', '#C6C9CA']);

    //arc used in the generation of all the pies
    let arc = d3.arc()
        .outerRadius(radius * 0.8)
        .innerRadius(radius * 0.6);
    //outer arc used for calculating placement of labels for each individual section
    let outerArc = d3.arc()
        .outerRadius(radius * 0.9)
        .innerRadius(radius * 0.9);

    //generates all pie charts in dashboard
    let pie = d3.pie()
        .sort(null)
        .value(function(d) { return d.percent; });
    //dimensions of the svg (and ultimately the png )
    let width = radius * 6;
    let height = radius * 6;

    //generate the svg on the document with the given dimensions
    let svg = document.d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);
    //sets the background to white so the image shows up on mobile
    svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "white");

    //appended section for server profiles
    let g1 = svg
        .append("g")
        .attr("transform", "translate(" + (radius + 100) + "," + (radius + 100) + ")");
    //appended section for server hardware
    let g2 = svg
        .append("g")
        .attr("transform", "translate(" + (radius + 700) + "," + (radius + 100)  + ")");
    //appended section for alerts
    let g3 = svg
        .append("g")
        .attr("transform", "translate(" + (radius + 100) + "," + (radius + 700) + ")");
    //appended section for hardware with profiles
    let g4 = svg
        .append("g")
        .attr("transform", "translate(" + (radius + 700) + "," + (radius + 700) + ")");

    //adds headers for each section and stylistic lines to svg
    __addHeadersAndLines__(svg);

    //generate the profiles donut
    let path = g1.selectAll(".arc")
        .data(pie(dataset1))
        .enter()
        .append("path")
        .attr("fill", function(d, i) { return color1(d.data.label); })
        .attr("d", arc);

    //finds the center of the arc to place the polyline
    function midAngle(d) { return d.startAngle + (d.endAngle - d.startAngle) / 2; }

    //adds the polyline and the label next to the polyline
    if (splits1 != 0) {
      let label = g1.selectAll('text')
            .data(pie(dataset1))
            .enter().append('text')
            .attr('dy', '.35em')
            .style("font-size", "1.2em")
            .style("font-family", "'MetricHPE'")
            .text(function(d) {
                return (d.data.label + ': ' + d.data.count );
            })
            .attr('transform', function(d) {
                //computes the center of the slice.
                let pos = outerArc.centroid(d);
                // changes the point to be on left or right depending on where label is.
                pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
                return 'translate(' + pos + ')';
            })
            .style('text-anchor', function(d) {
                // if slice center is on the left, anchor text to start, otherwise anchor to end
                return (midAngle(d)) < Math.PI ? 'start' : 'end';
            });

      let polyline1 = g1.selectAll('polyline')
          .data(pie(dataset1))
          .enter()
          .append('polyline')
          .style("fill", "none")
          .style("stroke-width", "2px")
          .style("stroke", "black")
          .style("opacity", "0.4")
          .attr('points', function(d) {
            let pos = outerArc.centroid(d);
            pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
            return [arc.centroid(d), outerArc.centroid(d), pos];
          });

        }
    //adds the label to the center of the donut to tell total number of server profiles
    let middle1 = g1.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "4.0em")
        .style("font-family", "'MetricHPE Semibold'")
        .attr("dy", "-0.4em")
        .text(totalCount1);

        g1.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "3.0em")
        .style("font-family", "'MetricHPE Semibold'")
        .attr("dy", "1em")
        .text("Total");

    path = g2.selectAll(".arc")
        .data(pie(dataset2))
        .enter()
        .append("path")
        .attr("fill", function(d, i) { return color1(d.data.label); })
        .attr("d", arc);

    if (splits2 != 0) {
      let label2 = g2.selectAll('text')
            .data(pie(dataset2))
            .enter().append('text')
            .attr('dy', '.35em')
            .style("font-size", "1.2em")
            .style("font-family", "'MetricHPE'")
            .text(function(d) {
                return (d.data.label + ': ' + d.data.count );
            })
            .attr('transform', function(d) {
                let pos = outerArc.centroid(d);
                // changes the point to be on left or right depending on where label is.
                pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
                return 'translate(' + pos + ')';
            })
            .style('text-anchor', function(d) {
                // if slice center is on the left, anchor text to start, otherwise anchor to end
                return (midAngle(d)) < Math.PI ? 'start' : 'end';
            });

      let polyline2 = g2.selectAll('polyline')
          .data(pie(dataset2))
          .enter()
          .append('polyline')
          .style("fill", "none")
          .style("stroke-width", "2px")
          .style("stroke", "black")
          .style("opacity", "0.4")
          .attr('points', function(d) {
            let pos = outerArc.centroid(d);
            pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
            return [arc.centroid(d), outerArc.centroid(d), pos];
          });
    }


    let middle2 = g2.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "4.0em")
        .style("font-family", "'MetricHPE Semibold'")
        .attr("dy", "-0.4em")
        .text(totalCount2);

        g2.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "3.0em")
        .style("font-family", "'MetricHPE Semibold'")
        .attr("dy", "1em")
        .text("Total");

    path = g3.selectAll(".arc")
        .data(pie(dataset3))
        .enter()
        .append("path")
        .attr("fill", function(d, i) { return color1(d.data.label); })
        .attr("d", arc);
    if (splits3 != 0) {
      let label3 = g3.selectAll('text')
            .data(pie(dataset3))
            .enter().append('text')
            .attr('dy', '.35em')
            .style("font-size", "1.2em")
            .style("font-family", "'MetricHPE'")
            .text(function(d) {
                return (d.data.label + ': ' + d.data.count );
            })
            .attr('transform', function(d) {
                //computes the center of the slice.
                let pos = outerArc.centroid(d);
                // changes the point to be on left or right depending on where label is.
                pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
                return 'translate(' + pos + ')';
            })
            .style('text-anchor', function(d) {
                // if slice center is on the left, anchor text to start, otherwise anchor to end
                return (midAngle(d)) < Math.PI ? 'start' : 'end';
            });

      let polyline3 = g3.selectAll('polyline')
          .data(pie(dataset3))
          .enter()
          .append('polyline')
          .style("fill", "none")
          .style("stroke-width", "2px")
          .style("stroke", "black")
          .style("opacity", "0.4")
          .attr('points', function(d) {
            let pos = outerArc.centroid(d);
            pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
            return [arc.centroid(d), outerArc.centroid(d), pos];
          });
    }

    let middle3 = g3.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "4.0em")
        .style("font-family", "'MetricHPE Semibold'")
        .attr("dy", "-0.4em")
        .text(totalCount3);

        g3.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "3.0em")
        .style("font-family", "'MetricHPE Semibold'")
        .attr("dy", "1em")
        .text("Total");

    path = g4.selectAll(".arc")
        .data(pie(dataset4))
        .enter()
        .append("path")
        .attr("fill", function(d, i) { return color1(d.data.label); })
        .attr("d", arc);
    if (splits4 != 0) {
      let label4 = g4.selectAll('text')
            .data(pie(dataset4))
            .enter().append('text')
            .attr('dy', '.35em')
            .style("font-size", "1.2em")
            .style("font-family", "'MetricHPE'")
            .text(function(d) {
                return (d.data.label + ': ' + d.data.count );
            })
            .attr('transform', function(d) {
                //computes the center of the slice.
                let pos = outerArc.centroid(d);
                // changes the point to be on left or right depending on where label is.
                pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
                return 'translate(' + pos + ')';
            })
            .style('text-anchor', function(d) {
                // if slice center is on the left, anchor text to start, otherwise anchor to end
                return (midAngle(d)) < Math.PI ? 'start' : 'end';
            });

      let polyline4 = g4.selectAll('polyline')
          .data(pie(dataset4))
          .enter()
          .append('polyline')
          .style("fill", "none")
          .style("stroke-width", "2px")
          .style("stroke", "black")
          .style("opacity", "0.4")
          .attr('points', function(d) {
            let pos = outerArc.centroid(d);
            pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
            return [arc.centroid(d), outerArc.centroid(d), pos];
          });
    }


    let middle4 = g4.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "4.0em")
        .style("font-family", "'MetricHPE Semibold'")
        .attr("dy", "-0.4em")
        .text(totalCount4);

        g4.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "3.0em")
        .style("font-family", "'MetricHPE Semibold'")
        .attr("dy", "1em")
        .text("Total");


    //convert the final svg to png
    let buf = Buffer.from(document.d3.select("body").html());

      return svg2png(buf).then((buffer) => {
        try {
          fs.writeFileSync('dashboard.png', buffer);
          resolve();
        } catch (err) {
          robot.logger.error('Error creating Dashboard on the filesytem', err);
          reject(err);
        }
      });
    }).then((res) => {
      return __uploadPNG__(robot, room, 'dashboard.png');
  });

}

module.exports = buildDashboard;
