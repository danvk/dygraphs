Dygraph.DataHandlers = {};
Dygraph.DataHandlers._handlers = {};
Dygraph.DataHandlers.registerHandler = function(name,handler){
  if(!handler instanceof Dygraph.DataHandler)
    throw("the handler must be a prototype of lalala");
  Dygraph.DataHandlers._handlers[name] = handler;
};

Dygraph.DataHandlers.getHandler = function(name){
  return new Dygraph.DataHandlers._handlers[name]();
};

Dygraph.DataHandler = function DataHandler(){
  var handler = function(){return this;};
  handler.prototype.formatSeries = function(){};
  handler.prototype.getExtremeYValues = function(){};
  handler.prototype.getYFloatValue = function(){};
  handler.prototype.rollingAverage = function(){};
  handler.prototype.onPointCreated = function(){};
  return handler;
};