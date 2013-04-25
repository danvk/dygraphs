// Copyright 2011 Google Inc. All Rights Reserved.

/**
 * @fileoverview Regression test based on an optimization w/
 * unforeseen consequences.
 * @author danvk@google.com (Dan Vanderkam)
 */

var BenchmarkTestCase = TestCase("benchmark");

BenchmarkTestCase.prototype.setUp = function() {
  document.body.innerHTML = "<div id='graph'></div>";
};

BenchmarkTestCase.prototype.generateDefaultData = function(num, numSeries){
  var data = [];
  for (var i = 0; i< num; i++){
    var sample = [i];
    for (var j = 0; j< numSeries; j++) {
      sample.push((i+1)*(j+1));
    }
    data.push(sample);
  }
  return data;
};
BenchmarkTestCase.prototype.generateErrorBarData = function(num, numSeries){
  var data = [];
  for (var i = 0; i< num; i++){
    var sample = [i];
    for (var j = 0; j < numSeries; j++) {
      sample.push([(i+1)*(j+1),100]);
    }
    data.push(sample);
  }
  return data;
};
BenchmarkTestCase.prototype.generateCustomBarData = function(num, numSeries){
  var data = [], y;
  for (var i = 0; i< num; i++){
    var sample = [i];
    for (var j = 0; j < numSeries; j++) {
      y = (i+1)*(j+1);
      sample.push([y-200, y, y+200]);
    }
    data.push(sample);
  }
  return data;
};
BenchmarkTestCase.prototype.generateFractionsData = function(num, numSeries){
  var data = [];
  for (var i = 0; i< num; i++){
    var sample = [i];
    for (var j = 0; j < numSeries; j++) {
      sample.push([(i+1)*(j+1) / 100, 100]);
    }
    data.push(sample);
  }
  return data;
};

BenchmarkTestCase.prototype.testBenchmarkInit = function() {
//  this.benchmarkInit(this.generateDefaultData(500000, 2),{"labels": ["X","Y1","Y2"]}, "Default");
//    this.benchmarkInit(this.generateFractionsData(500000, 2),{"labels": ["X","Y1","Y2"],"fractions": true}, "Fractions Default");
//  this.benchmarkInit(this.generateErrorBarData(10000, 1),{"labels": ["X","Y1"],"errorBars": true}, "Error Bar");
//  this.benchmarkInit(this.generateFractionsData(10000, 1),{"labels": ["X","Y1"],"fractions": true, "errorBars": true}, "Fractions Error Bar");
//  this.benchmarkInit(this.generateCustomBarData(10000, 1),{"labels": ["X","Y1"],"rollPeriod": 500, "customBars": true}, "Custom Bar Rolling Avg");
};
BenchmarkTestCase.prototype.testBenchmarkSetData = function() {
//  this.benchmarkSetData(this.generateDefaultData(500000, 2),{"labels": ["X","Y1","Y2"]}, "Default");
//    this.benchmarkSetData(this.generateFractionsData(500000, 2),{"labels": ["X","Y1","Y2"],"fractions": true}, "Fractions Default");
//  this.benchmarkSetData(this.generateErrorBarData(10000, 1),{"labels": ["X","Y1"],"errorBars": true}, "Error Bar");
//  this.benchmarkSetData(this.generateFractionsData(10000, 1),{"labels": ["X","Y1"],"fractions": true, "errorBars": true}, "Fractions Error Bar");
//  this.benchmarkSetData(this.generateCustomBarData(10000, 1),{"labels": ["X","Y1"],"rollPeriod": 500, "customBars": true}, "Custom Bar Rolling Avg");
};
BenchmarkTestCase.prototype.testBenchmarkZoom = function() {
//  this.benchmarkZoom(this.generateDefaultData(500000, 2),{"labels": ["X","Y1","Y2"]}, "Default");
//    this.benchmarkZoom(this.generateFractionsData(500000, 2),{"labels": ["X","Y1","Y2"],"fractions": true}, "Fractions Default");
//  this.benchmarkZoom(this.generateErrorBarData(10000, 1),{"labels": ["X","Y1"],"errorBars": true}, "Error Bar");
//  this.benchmarkZoom(this.generateFractionsData(10000, 1),{"labels": ["X","Y1"],"fractions": true, "errorBars": true}, "Fractions Error Bar");
//  this.benchmarkZoom(this.generateCustomBarData(10000, 1),{"labels": ["X","Y1"],"rollPeriod": 500, "customBars": true}, "Custom Bar Rolling Avg");
};


BenchmarkTestCase.prototype.benchmarkInit = function(data, options, name) {
  var graph = document.getElementById("graph");
  var timeSum = 0;
  var runs = 10;
  for ( var i = 0; i < runs; i++) {
    var startTime = new Date();
    var g = new Dygraph(graph, data, options);
    var endTime = new Date();
    timeSum += endTime - startTime;
    g.destroy();
  }
  console.log(name+" Init Test finished after "+runs+ " runs with an average result of: "+timeSum / runs );
};
BenchmarkTestCase.prototype.benchmarkSetData= function(data, options, name) {
  var graph = document.getElementById("graph");
  var timeSum = 0;
  var runs = 10;
  var g = new Dygraph(graph, [], options);
  for ( var i = 0; i < runs; i++) {
    var startTime = new Date();
    g.updateOptions({file: data});
    var endTime = new Date();
    timeSum += endTime - startTime;
  }
  console.log(name + " Set Data Test finished after "+runs+ " runs with an average result of: "+timeSum / runs );
};
BenchmarkTestCase.prototype.benchmarkZoom = function(data, options, name) {
  var graph = document.getElementById("graph");
  var timeSum = 0;
  var runs = 10;
  var g = new Dygraph(graph, data, options);
  var zoomInFrom = (data.length / 2) - (data.length / 5);
  var zoomInTo = (data.length / 2) + (data.length / 5);
  for ( var i = 0; i < runs; i++) {
    var startTime = new Date();
    if (i % 2 ){
      g.updateOptions({dateWindow: [0,data.length]});
    } else{
      g.updateOptions({dateWindow: [zoomInFrom,zoomInTo]});
    }
    var endTime = new Date();
    timeSum += endTime - startTime;
  }
  console.log(name + " Zoom Test finished after "+runs+ " runs with an average result of: "+timeSum / runs );
};
