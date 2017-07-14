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

export function buildDashboard(robot, room, aggregatedAlerts, aggregatedServerProfiles, aggregatedServerHardware, aggregatedHardwareWithProfiles) {

  return new Promise((resolve, reject) => {
    //separate data for server profiles
    let splits1 = aggregatedServerProfiles[0].counts.length;
    let dataset1 = [];
    let totalCount1 = 0;
    if (splits1 === 0) {
      dataset1.push({ label: "No Profiles", count: 0, percent: 100} );
    } else {
      let slices1 = [];
      for (let i = 0; i < splits1; i++) {
        slices1.push(aggregatedServerProfiles[0].counts[i]);
        totalCount1 += aggregatedServerProfiles[0].counts[i].count;
      }
      for (let j = 0; j < splits1; j++) {
        dataset1.push({ label: slices1[j].value, count: (slices1[j].count), percent: (slices1[j].count / totalCount1) });
      };
    }

    //separate data for server hardware
    let splits2 = aggregatedServerHardware[0].counts.length;
    let dataset2 = [];
    let totalCount2 = 0;
    if (splits2 === 0) {
      dataset2.push( { label: "No Hardware", count: 0, percent: 100} );
    } else {
      let slices2 = [];
      for (let i = 0; i < splits2; i++) {
        slices2.push(aggregatedServerHardware[0].counts[i]);
        totalCount2 += aggregatedServerHardware[0].counts[i].count;
      };
      for (let j = 0; j < splits2; j++) {
        dataset2.push({ label: slices2[j].value, count: (slices2[j].count), percent: (slices2[j].count / totalCount2) });
      };
    }

    //separate data for alerts
    let splits3 = aggregatedAlerts[0].counts.length;
    let dataset3 = [];
    let totalCount3 = 0;
    if (splits3 === 0) {
      dataset3.push({ label: "No Alerts", count: 0, percent: 100} );
    }
    else {
      let slices3 = [];
      for (let i = 0; i < splits3; i++) {
        slices3.push(aggregatedAlerts[0].counts[i]);
        totalCount3 += aggregatedAlerts[0].counts[i].count;
      };
      for (let j = 0; j < splits3; j++) {
        dataset3.push({ label: slices3[j].value, count: (slices3[j].count), percent: (slices3[j].count / totalCount3) });
      };
    }

    //separate data for hardware with profiles
    let splits4 = aggregatedHardwareWithProfiles[0].counts.length;
    let dataset4 = [];
    let totalCount4 = 0;
    if (splits4 === 0) {
      dataset4.push({ label: "No Hardware", count: 0, percent: 100} );
    }
    else {
      let slices4 = [];
      for (let i = 0; i < splits4; i++) {
        slices4.push(aggregatedHardwareWithProfiles[0].counts[i]);
        totalCount4 += aggregatedHardwareWithProfiles[0].counts[i].count;
      }
      for (let j = 0; j < splits4; j++) {
        if (slices4[j].value == "ProfileApplied") {
          dataset4.push({ label: "Has Profile", count: (slices4[j].count), percent: (slices4[j].count / totalCount4) });
        }
        else {
          dataset4.push({ label: "No Profile", count: (slices4[j].count), percent: (slices4[j].count / totalCount4) });
        }
      };
    }

    //generate the document to write the svg
    const document = jsdom.jsdom("<html><body></body></html>");
    document.d3 = d3.select(document);

    //set the radius of the donut (the center part)
    let radius = 200;

    //color scheme used for status and default donuts
    let color1 = d3.scaleOrdinal()
        .domain(["Critical", "OK", "Warning", "No Profiles", "No Alerts", "No Hardware"])
        .range(['#FF454F', '#01A982', '#FFD042', '#C6C9CA', '#C6C9CA', '#C6C9CA']);
    //color scheme used for hardware with profiles
    let color2 = d3.scaleOrdinal()
        .domain(["Has Profile", "No Profile"])
        .range(["#425563", "#C6C9CA"])

    //arc for server profiles
    let arc1 = d3.arc()
        .outerRadius(radius * 0.8)
        .innerRadius(radius * 0.6);
    //arc for server hardware
    let arc2 = d3.arc()
        .outerRadius(radius * 0.8)
        .innerRadius(radius * 0.6);
    //arc for alerts
    let arc3 = d3.arc()
        .outerRadius(radius * 0.8)
        .innerRadius(radius * 0.6);
    //arc for hardware with profiles
    let arc4 = d3.arc()
        .outerRadius(radius * 0.8)
        .innerRadius(radius * 0.6);
    //outer arc used for calculating placement of labels for each individual section
    let outerArc = d3.arc()
        .outerRadius(radius * 0.9)
        .innerRadius(radius * 0.9);

    //pie for server profiles
    let pie = d3.pie()
        .sort(null)
        .value(function(d) { return d.percent; });
    //pie for server hardware
    let pie2 = d3.pie()
        .sort(null)
        .value(function(d) { return d.percent; });
    //pie for alerts
    let pie3 = d3.pie()
        .sort(null)
        .value(function(d) { return d.percent; });
    //pie for hardware with profiles
    let pie4 = d3.pie()
        .sort(null)
        .value(function(d) { return d.percent; });
    //dimensions of the svg (and ultimately the png )
    let width = radius * 6;
    let height = radius * 6;

    //generate the svg on the document with the given dimensions
    let svg = document.d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
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

    //generate the profiles donut
    let path = g1.selectAll(".arc")
        .data(pie(dataset1))
        .enter()
        .append("path")
        .attr("fill", function(d, i) { return color1(d.data.label); })
        .attr("d", arc1);

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
            return [arc1.centroid(d), outerArc.centroid(d), pos];
          });

        }
    //adds the label to the center of the donut to tell total number of server profiles
    let middle1 = g1.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "4.0em")
        .style("font-family", "'MetricHPE Semibold'")
        .attr("dy", "-0.4em")
        .text(totalCount1)

        g1.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "3.0em")
        .style("font-family", "'MetricHPE Semibold'")
        .attr("dy", "1em")
        .text("Total");

    path = g2.selectAll(".arc")
        .data(pie2(dataset2))
        .enter()
        .append("path")
        .attr("fill", function(d, i) { return color1(d.data.label); })
        .attr("d", arc2);

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
            return [arc2.centroid(d), outerArc.centroid(d), pos];
          });
    }


    let middle2 = g2.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "4.0em")
        .style("font-family", "'MetricHPE Semibold'")
        .attr("dy", "-0.4em")
        .text(totalCount2)

        g2.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "3.0em")
        .style("font-family", "'MetricHPE Semibold'")
        .attr("dy", "1em")
        .text("Total");

    path = g3.selectAll(".arc")
        .data(pie3(dataset3))
        .enter()
        .append("path")
        .attr("fill", function(d, i) { return color1(d.data.label); })
        .attr("d", arc3);
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
            return [arc3.centroid(d), outerArc.centroid(d), pos];
          });
    }

    let middle3 = g3.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "4.0em")
        .style("font-family", "'MetricHPE Semibold'")
        .attr("dy", "-0.4em")
        .text(totalCount3)

        g3.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "3.0em")
        .style("font-family", "'MetricHPE Semibold'")
        .attr("dy", "1em")
        .text("Total");

    path = g4.selectAll(".arc")
        .data(pie3(dataset4))
        .enter()
        .append("path")
        .attr("fill", function(d, i) { return color2(d.data.label); })
        .attr("d", arc4);
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
            return [arc4.centroid(d), outerArc.centroid(d), pos];
          });
    }


    let middle4 = g4.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "4.0em")
        .style("font-family", "'MetricHPE Semibold'")
        .attr("dy", "-0.4em")
        .text(totalCount4)

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
