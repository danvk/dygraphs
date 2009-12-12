Date.ext={};Date.ext.util={};Date.ext.util.xPad=function(x,pad,r){if(typeof (r)=="undefined"){r=10}for(;parseInt(x,10)<r&&r>1;r/=10){x=pad.toString()+x}return x.toString()};Date.prototype.locale="en-GB";if(document.getElementsByTagName("html")&&document.getElementsByTagName("html")[0].lang){Date.prototype.locale=document.getElementsByTagName("html")[0].lang}Date.ext.locales={};Date.ext.locales.en={a:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],A:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],b:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],B:["January","February","March","April","May","June","July","August","September","October","November","December"],c:"%a %d %b %Y %T %Z",p:["AM","PM"],P:["am","pm"],x:"%d/%m/%y",X:"%T"};Date.ext.locales["en-US"]=Date.ext.locales.en;Date.ext.locales["en-US"].c="%a %d %b %Y %r %Z";Date.ext.locales["en-US"].x="%D";Date.ext.locales["en-US"].X="%r";Date.ext.locales["en-GB"]=Date.ext.locales.en;Date.ext.locales["en-AU"]=Date.ext.locales["en-GB"];Date.ext.formats={a:function(d){return Date.ext.locales[d.locale].a[d.getDay()]},A:function(d){return Date.ext.locales[d.locale].A[d.getDay()]},b:function(d){return Date.ext.locales[d.locale].b[d.getMonth()]},B:function(d){return Date.ext.locales[d.locale].B[d.getMonth()]},c:"toLocaleString",C:function(d){return Date.ext.util.xPad(parseInt(d.getFullYear()/100,10),0)},d:["getDate","0"],e:["getDate"," "],g:function(d){return Date.ext.util.xPad(parseInt(Date.ext.util.G(d)/100,10),0)},G:function(d){var y=d.getFullYear();var V=parseInt(Date.ext.formats.V(d),10);var W=parseInt(Date.ext.formats.W(d),10);if(W>V){y++}else{if(W===0&&V>=52){y--}}return y},H:["getHours","0"],I:function(d){var I=d.getHours()%12;return Date.ext.util.xPad(I===0?12:I,0)},j:function(d){var ms=d-new Date(""+d.getFullYear()+"/1/1 GMT");ms+=d.getTimezoneOffset()*60000;var doy=parseInt(ms/60000/60/24,10)+1;return Date.ext.util.xPad(doy,0,100)},m:function(d){return Date.ext.util.xPad(d.getMonth()+1,0)},M:["getMinutes","0"],p:function(d){return Date.ext.locales[d.locale].p[d.getHours()>=12?1:0]},P:function(d){return Date.ext.locales[d.locale].P[d.getHours()>=12?1:0]},S:["getSeconds","0"],u:function(d){var dow=d.getDay();return dow===0?7:dow},U:function(d){var doy=parseInt(Date.ext.formats.j(d),10);var rdow=6-d.getDay();var woy=parseInt((doy+rdow)/7,10);return Date.ext.util.xPad(woy,0)},V:function(d){var woy=parseInt(Date.ext.formats.W(d),10);var dow1_1=(new Date(""+d.getFullYear()+"/1/1")).getDay();var idow=woy+(dow1_1>4||dow1_1<=1?0:1);if(idow==53&&(new Date(""+d.getFullYear()+"/12/31")).getDay()<4){idow=1}else{if(idow===0){idow=Date.ext.formats.V(new Date(""+(d.getFullYear()-1)+"/12/31"))}}return Date.ext.util.xPad(idow,0)},w:"getDay",W:function(d){var doy=parseInt(Date.ext.formats.j(d),10);var rdow=7-Date.ext.formats.u(d);var woy=parseInt((doy+rdow)/7,10);return Date.ext.util.xPad(woy,0,10)},y:function(d){return Date.ext.util.xPad(d.getFullYear()%100,0)},Y:"getFullYear",z:function(d){var o=d.getTimezoneOffset();var H=Date.ext.util.xPad(parseInt(Math.abs(o/60),10),0);var M=Date.ext.util.xPad(o%60,0);return(o>0?"-":"+")+H+M},Z:function(d){return d.toString().replace(/^.*\(([^)]+)\)$/,"$1")},"%":function(d){return"%"}};Date.ext.aggregates={c:"locale",D:"%m/%d/%y",h:"%b",n:"\n",r:"%I:%M:%S %p",R:"%H:%M",t:"\t",T:"%H:%M:%S",x:"locale",X:"locale"};Date.ext.aggregates.z=Date.ext.formats.z(new Date());Date.ext.aggregates.Z=Date.ext.formats.Z(new Date());Date.ext.unsupported={};Date.prototype.strftime=function(fmt){if(!(this.locale in Date.ext.locales)){if(this.locale.replace(/-[a-zA-Z]+$/,"") in Date.ext.locales){this.locale=this.locale.replace(/-[a-zA-Z]+$/,"")}else{this.locale="en-GB"}}var d=this;while(fmt.match(/%[cDhnrRtTxXzZ]/)){fmt=fmt.replace(/%([cDhnrRtTxXzZ])/g,function(m0,m1){var f=Date.ext.aggregates[m1];return(f=="locale"?Date.ext.locales[d.locale][m1]:f)})}var str=fmt.replace(/%([aAbBCdegGHIjmMpPSuUVwWyY%])/g,function(m0,m1){var f=Date.ext.formats[m1];if(typeof (f)=="string"){return d[f]()}else{if(typeof (f)=="function"){return f.call(d,d)}else{if(typeof (f)=="object"&&typeof (f[0])=="string"){return Date.ext.util.xPad(d[f[0]](),f[1])}else{return m1}}}});d=null;return str};
DygraphLayout=function(_1,_2){
this.dygraph_=_1;
this.options={};
Dygraph.update(this.options,_2?_2:{});
this.datasets=new Array();
};
DygraphLayout.prototype.attr_=function(_3){
return this.dygraph_.attr_(_3);
};
DygraphLayout.prototype.addDataset=function(_4,_5){
this.datasets[_4]=_5;
};
DygraphLayout.prototype.evaluate=function(){
this._evaluateLimits();
this._evaluateLineCharts();
this._evaluateLineTicks();
};
DygraphLayout.prototype._evaluateLimits=function(){
this.minxval=this.maxxval=null;
for(var _6 in this.datasets){
var _7=this.datasets[_6];
var x1=_7[0][0];
if(!this.minxval||x1<this.minxval){
this.minxval=x1;
}
var x2=_7[_7.length-1][0];
if(!this.maxxval||x2>this.maxxval){
this.maxxval=x2;
}
}
this.xrange=this.maxxval-this.minxval;
this.xscale=(this.xrange!=0?1/this.xrange:1);
this.minyval=this.options.yAxis[0];
this.maxyval=this.options.yAxis[1];
this.yrange=this.maxyval-this.minyval;
this.yscale=(this.yrange!=0?1/this.yrange:1);
};
DygraphLayout.prototype._evaluateLineCharts=function(){
this.points=new Array();
for(var _10 in this.datasets){
var _11=this.datasets[_10];
for(var j=0;j<_11.length;j++){
var _13=_11[j];
var _14={x:((parseFloat(_13[0])-this.minxval)*this.xscale),y:1-((parseFloat(_13[1])-this.minyval)*this.yscale),xval:parseFloat(_13[0]),yval:parseFloat(_13[1]),name:_10};
if(_14.y<=0){
_14.y=0;
}
if(_14.y>=1){
_14.y=1;
}
if((_14.x>=0)&&(_14.x<=1)){
this.points.push(_14);
}
}
}
};
DygraphLayout.prototype._evaluateLineTicks=function(){
this.xticks=new Array();
for(var i=0;i<this.options.xTicks.length;i++){
var _16=this.options.xTicks[i];
var _17=_16.label;
var pos=this.xscale*(_16.v-this.minxval);
if((pos>=0)&&(pos<=1)){
this.xticks.push([pos,_17]);
}
}
this.yticks=new Array();
for(var i=0;i<this.options.yTicks.length;i++){
var _16=this.options.yTicks[i];
var _17=_16.label;
var pos=1-(this.yscale*(_16.v-this.minyval));
if((pos>=0)&&(pos<=1)){
this.yticks.push([pos,_17]);
}
}
};
DygraphLayout.prototype.evaluateWithError=function(){
this.evaluate();
if(!this.options.errorBars){
return;
}
var i=0;
for(var _19 in this.datasets){
var j=0;
var _20=this.datasets[_19];
for(var j=0;j<_20.length;j++,i++){
var _21=_20[j];
var xv=parseFloat(_21[0]);
var yv=parseFloat(_21[1]);
if(xv==this.points[i].xval&&yv==this.points[i].yval){
this.points[i].errorMinus=parseFloat(_21[2]);
this.points[i].errorPlus=parseFloat(_21[3]);
}
}
}
};
DygraphLayout.prototype.removeAllDatasets=function(){
delete this.datasets;
this.datasets=new Array();
};
DygraphLayout.prototype.updateOptions=function(_24){
Dygraph.update(this.options,_24?_24:{});
};
DygraphCanvasRenderer=function(_25,_26,_27,_28){
this.dygraph_=_25;
this.options={"strokeWidth":0.5,"drawXAxis":true,"drawYAxis":true,"axisLineColor":"black","axisLineWidth":0.5,"axisTickSize":3,"axisLabelColor":"black","axisLabelFont":"Arial","axisLabelFontSize":9,"axisLabelWidth":50,"drawYGrid":true,"drawXGrid":true,"gridLineColor":"rgb(128,128,128)"};
Dygraph.update(this.options,_28);
this.layout=_27;
this.element=_26;
this.container=this.element.parentNode;
this.height=this.element.height;
this.width=this.element.width;
if(!this.isIE&&!(DygraphCanvasRenderer.isSupported(this.element))){
throw "Canvas is not supported.";
}
this.xlabels=new Array();
this.ylabels=new Array();
this.area={x:this.options.yAxisLabelWidth+2*this.options.axisTickSize,y:0};
this.area.w=this.width-this.area.x-this.options.rightGap;
this.area.h=this.height-this.options.axisLabelFontSize-2*this.options.axisTickSize;
this.container.style.position="relative";
this.container.style.width=this.width+"px";
};
DygraphCanvasRenderer.prototype.clear=function(){
if(this.isIE){
try{
if(this.clearDelay){
this.clearDelay.cancel();
this.clearDelay=null;
}
var _29=this.element.getContext("2d");
}
catch(e){
this.clearDelay=MochiKit.Async.wait(this.IEDelay);
this.clearDelay.addCallback(bind(this.clear,this));
return;
}
}
var _29=this.element.getContext("2d");
_29.clearRect(0,0,this.width,this.height);
for(var i=0;i<this.xlabels.length;i++){
var el=this.xlabels[i];
el.parentNode.removeChild(el);
}
for(var i=0;i<this.ylabels.length;i++){
var el=this.ylabels[i];
el.parentNode.removeChild(el);
}
this.xlabels=new Array();
this.ylabels=new Array();
};
DygraphCanvasRenderer.isSupported=function(_31){
var _32=null;
try{
if(typeof (_31)=="undefined"||_31==null){
_32=document.createElement("canvas");
}else{
_32=_31;
}
var _33=_32.getContext("2d");
}
catch(e){
var ie=navigator.appVersion.match(/MSIE (\d\.\d)/);
var _35=(navigator.userAgent.toLowerCase().indexOf("opera")!=-1);
if((!ie)||(ie[1]<6)||(_35)){
return false;
}
return true;
}
return true;
};
DygraphCanvasRenderer.prototype.render=function(){
var ctx=this.element.getContext("2d");
if(this.options.drawYGrid){
var _37=this.layout.yticks;
ctx.save();
ctx.strokeStyle=this.options.gridLineColor;
ctx.lineWidth=this.options.axisLineWidth;
for(var i=0;i<_37.length;i++){
var x=this.area.x;
var y=this.area.y+_37[i][0]*this.area.h;
ctx.beginPath();
ctx.moveTo(x,y);
ctx.lineTo(x+this.area.w,y);
ctx.closePath();
ctx.stroke();
}
}
if(this.options.drawXGrid){
var _37=this.layout.xticks;
ctx.save();
ctx.strokeStyle=this.options.gridLineColor;
ctx.lineWidth=this.options.axisLineWidth;
for(var i=0;i<_37.length;i++){
var x=this.area.x+_37[i][0]*this.area.w;
var y=this.area.y+this.area.h;
ctx.beginPath();
ctx.moveTo(x,y);
ctx.lineTo(x,this.area.y);
ctx.closePath();
ctx.stroke();
}
}
this._renderLineChart();
this._renderAxis();
};
DygraphCanvasRenderer.prototype._renderAxis=function(){
if(!this.options.drawXAxis&&!this.options.drawYAxis){
return;
}
var _40=this.element.getContext("2d");
var _41={"position":"absolute","fontSize":this.options.axisLabelFontSize+"px","zIndex":10,"color":this.options.axisLabelColor,"width":this.options.axisLabelWidth+"px","overflow":"hidden"};
var _42=function(txt){
var div=document.createElement("div");
for(var _45 in _41){
div.style[_45]=_41[_45];
}
div.appendChild(document.createTextNode(txt));
return div;
};
_40.save();
_40.strokeStyle=this.options.axisLineColor;
_40.lineWidth=this.options.axisLineWidth;
if(this.options.drawYAxis){
if(this.layout.yticks){
for(var i=0;i<this.layout.yticks.length;i++){
var _46=this.layout.yticks[i];
if(typeof (_46)=="function"){
return;
}
var x=this.area.x;
var y=this.area.y+_46[0]*this.area.h;
_40.beginPath();
_40.moveTo(x,y);
_40.lineTo(x-this.options.axisTickSize,y);
_40.closePath();
_40.stroke();
var _47=_42(_46[1]);
var top=(y-this.options.axisLabelFontSize/2);
if(top<0){
top=0;
}
if(top+this.options.axisLabelFontSize+3>this.height){
_47.style.bottom="0px";
}else{
_47.style.top=top+"px";
}
_47.style.left="0px";
_47.style.textAlign="right";
_47.style.width=this.options.yAxisLabelWidth+"px";
this.container.appendChild(_47);
this.ylabels.push(_47);
}
var _49=this.ylabels[0];
var _50=this.options.axisLabelFontSize;
var _51=parseInt(_49.style.top)+_50;
if(_51>this.height-_50){
_49.style.top=(parseInt(_49.style.top)-_50/2)+"px";
}
}
_40.beginPath();
_40.moveTo(this.area.x,this.area.y);
_40.lineTo(this.area.x,this.area.y+this.area.h);
_40.closePath();
_40.stroke();
}
if(this.options.drawXAxis){
if(this.layout.xticks){
for(var i=0;i<this.layout.xticks.length;i++){
var _46=this.layout.xticks[i];
if(typeof (dataset)=="function"){
return;
}
var x=this.area.x+_46[0]*this.area.w;
var y=this.area.y+this.area.h;
_40.beginPath();
_40.moveTo(x,y);
_40.lineTo(x,y+this.options.axisTickSize);
_40.closePath();
_40.stroke();
var _47=_42(_46[1]);
_47.style.textAlign="center";
_47.style.bottom="0px";
var _52=(x-this.options.axisLabelWidth/2);
if(_52+this.options.axisLabelWidth>this.width){
_52=this.width-this.options.xAxisLabelWidth;
_47.style.textAlign="right";
}
if(_52<0){
_52=0;
_47.style.textAlign="left";
}
_47.style.left=_52+"px";
_47.style.width=this.options.xAxisLabelWidth+"px";
this.container.appendChild(_47);
this.xlabels.push(_47);
}
}
_40.beginPath();
_40.moveTo(this.area.x,this.area.y+this.area.h);
_40.lineTo(this.area.x+this.area.w,this.area.y+this.area.h);
_40.closePath();
_40.stroke();
}
_40.restore();
};
DygraphCanvasRenderer.prototype._renderLineChart=function(){
var _53=this.element.getContext("2d");
var _54=this.options.colorScheme.length;
var _55=this.options.colorScheme;
var _56=this.layout.options.errorBars;
var _57=[];
for(var _58 in this.layout.datasets){
_57.push(_58);
}
var _59=_57.length;
for(var i=0;i<this.layout.points.length;i++){
var _60=this.layout.points[i];
_60.canvasx=this.area.w*_60.x+this.area.x;
_60.canvasy=this.area.h*_60.y+this.area.y;
}
var _61=function(x){
return x&&!isNaN(x);
};
var ctx=_53;
if(_56){
for(var i=0;i<_59;i++){
var _62=_57[i];
var _63=_55[i%_54];
ctx.save();
ctx.strokeStyle=_63;
ctx.lineWidth=this.options.strokeWidth;
var _64=-1;
var _65=[-1,-1];
var _66=0;
var _67=this.layout.yscale;
var rgb=new RGBColor(_63);
var _69="rgba("+rgb.r+","+rgb.g+","+rgb.b+",0.15)";
ctx.fillStyle=_69;
ctx.beginPath();
for(var j=0;j<this.layout.points.length;j++){
var _60=this.layout.points[j];
_66++;
if(_60.name==_62){
if(!_60.y||isNaN(_60.y)){
_64=-1;
continue;
}
var _70=[_60.y-_60.errorPlus*_67,_60.y+_60.errorMinus*_67];
_70[0]=this.area.h*_70[0]+this.area.y;
_70[1]=this.area.h*_70[1]+this.area.y;
if(_64>=0){
ctx.moveTo(_64,_65[0]);
ctx.lineTo(_60.canvasx,_70[0]);
ctx.lineTo(_60.canvasx,_70[1]);
ctx.lineTo(_64,_65[1]);
ctx.closePath();
}
_65[0]=_70[0];
_65[1]=_70[1];
_64=_60.canvasx;
}
}
ctx.fill();
}
}
for(var i=0;i<_59;i++){
var _62=_57[i];
var _63=_55[i%_54];
_53.save();
var _60=this.layout.points[0];
var _71=this.dygraph_.attr_("pointSize");
var _64=null,prevY=null;
var _72=this.dygraph_.attr_("drawPoints");
var _73=this.layout.points;
for(var j=0;j<_73.length;j++){
var _60=_73[j];
if(_60.name==_62){
if(!_61(_60.canvasy)){
_64=prevY=null;
}else{
var _74=(!_64&&(j==_73.length-1||!_61(_73[j+1].canvasy)));
if(!_64){
_64=_60.canvasx;
prevY=_60.canvasy;
}else{
ctx.beginPath();
ctx.strokeStyle=_63;
ctx.lineWidth=this.options.strokeWidth;
ctx.moveTo(_64,prevY);
_64=_60.canvasx;
prevY=_60.canvasy;
ctx.lineTo(_64,prevY);
ctx.stroke();
}
if(_72||_74){
ctx.beginPath();
ctx.fillStyle=_63;
ctx.arc(_60.canvasx,_60.canvasy,_71,0,2*Math.PI,false);
ctx.fill();
}
}
}
}
}
_53.restore();
};
Dygraph=function(div,_75,_76){
if(arguments.length>0){
if(arguments.length==4){
this.warn("Using deprecated four-argument dygraph constructor");
this.__old_init__(div,_75,arguments[2],arguments[3]);
}else{
this.__init__(div,_75,_76);
}
}
};
Dygraph.NAME="Dygraph";
Dygraph.VERSION="1.2";
Dygraph.__repr__=function(){
return "["+this.NAME+" "+this.VERSION+"]";
};
Dygraph.toString=function(){
return this.__repr__();
};
Dygraph.DEFAULT_ROLL_PERIOD=1;
Dygraph.DEFAULT_WIDTH=480;
Dygraph.DEFAULT_HEIGHT=320;
Dygraph.AXIS_LINE_WIDTH=0.3;
Dygraph.DEFAULT_ATTRS={highlightCircleSize:3,pixelsPerXLabel:60,pixelsPerYLabel:30,labelsDivWidth:250,labelsDivStyles:{},labelsSeparateLines:false,labelsKMB:false,strokeWidth:1,axisTickSize:3,axisLabelFontSize:14,xAxisLabelWidth:50,yAxisLabelWidth:50,rightGap:5,showRoller:false,xValueFormatter:Dygraph.dateString_,xValueParser:Dygraph.dateParser,xTicker:Dygraph.dateTicker,delimiter:",",sigma:2,errorBars:false,fractions:false,wilsonInterval:true,customBars:false};
Dygraph.DEBUG=1;
Dygraph.INFO=2;
Dygraph.WARNING=3;
Dygraph.ERROR=3;
Dygraph.prototype.__old_init__=function(div,_77,_78,_79){
if(_78!=null){
var _80=["Date"];
for(var i=0;i<_78.length;i++){
_80.push(_78[i]);
}
Dygraph.update(_79,{"labels":_80});
}
this.__init__(div,_77,_79);
};
Dygraph.prototype.__init__=function(div,_81,_82){
if(_82==null){
_82={};
}
this.maindiv_=div;
this.file_=_81;
this.rollPeriod_=_82.rollPeriod||Dygraph.DEFAULT_ROLL_PERIOD;
this.previousVerticalX_=-1;
this.fractions_=_82.fractions||false;
this.dateWindow_=_82.dateWindow||null;
this.valueRange_=_82.valueRange||null;
this.wilsonInterval_=_82.wilsonInterval||true;
div.innerHTML="";
if(div.style.width==""){
div.style.width=Dygraph.DEFAULT_WIDTH+"px";
}
if(div.style.height==""){
div.style.height=Dygraph.DEFAULT_HEIGHT+"px";
}
this.width_=parseInt(div.style.width,10);
this.height_=parseInt(div.style.height,10);
this.user_attrs_={};
Dygraph.update(this.user_attrs_,_82);
this.attrs_={};
Dygraph.update(this.attrs_,Dygraph.DEFAULT_ATTRS);
this.labelsFromCSV_=(this.attr_("labels")==null);
this.createInterface_();
this.layoutOptions_={"xOriginIsZero":false};
Dygraph.update(this.layoutOptions_,this.attrs_);
Dygraph.update(this.layoutOptions_,this.user_attrs_);
Dygraph.update(this.layoutOptions_,{"errorBars":(this.attr_("errorBars")||this.attr_("customBars"))});
this.layout_=new DygraphLayout(this,this.layoutOptions_);
this.renderOptions_={colorScheme:this.colors_,strokeColor:null,axisLineWidth:Dygraph.AXIS_LINE_WIDTH};
Dygraph.update(this.renderOptions_,this.attrs_);
Dygraph.update(this.renderOptions_,this.user_attrs_);
this.plotter_=new DygraphCanvasRenderer(this,this.hidden_,this.layout_,this.renderOptions_);
this.createStatusMessage_();
this.createRollInterface_();
this.createDragInterface_();
this.start_();
};
Dygraph.prototype.attr_=function(_83){
if(typeof (this.user_attrs_[_83])!="undefined"){
return this.user_attrs_[_83];
}else{
if(typeof (this.attrs_[_83])!="undefined"){
return this.attrs_[_83];
}else{
return null;
}
}
};
Dygraph.prototype.log=function(_84,_85){
if(typeof (console)!="undefined"){
switch(_84){
case Dygraph.DEBUG:
console.debug("dygraphs: "+_85);
break;
case Dygraph.INFO:
console.info("dygraphs: "+_85);
break;
case Dygraph.WARNING:
console.warn("dygraphs: "+_85);
break;
case Dygraph.ERROR:
console.error("dygraphs: "+_85);
break;
}
}
};
Dygraph.prototype.info=function(_86){
this.log(Dygraph.INFO,_86);
};
Dygraph.prototype.warn=function(_87){
this.log(Dygraph.WARNING,_87);
};
Dygraph.prototype.error=function(_88){
this.log(Dygraph.ERROR,_88);
};
Dygraph.prototype.rollPeriod=function(){
return this.rollPeriod_;
};
Dygraph.addEvent=function(el,evt,fn){
var _91=function(e){
if(!e){
var e=window.event;
}
fn(e);
};
if(window.addEventListener){
el.addEventListener(evt,_91,false);
}else{
el.attachEvent("on"+evt,_91);
}
};
Dygraph.prototype.createInterface_=function(){
var _93=this.maindiv_;
this.graphDiv=document.createElement("div");
this.graphDiv.style.width=this.width_+"px";
this.graphDiv.style.height=this.height_+"px";
_93.appendChild(this.graphDiv);
this.canvas_=Dygraph.createCanvas();
this.canvas_.style.position="absolute";
this.canvas_.width=this.width_;
this.canvas_.height=this.height_;
this.canvas_.style.width=this.width_+"px";
this.canvas_.style.height=this.height_+"px";
this.graphDiv.appendChild(this.canvas_);
this.hidden_=this.createPlotKitCanvas_(this.canvas_);
var _94=this;
Dygraph.addEvent(this.hidden_,"mousemove",function(e){
_94.mouseMove_(e);
});
Dygraph.addEvent(this.hidden_,"mouseout",function(e){
_94.mouseOut_(e);
});
};
Dygraph.prototype.createPlotKitCanvas_=function(_95){
var h=Dygraph.createCanvas();
h.style.position="absolute";
h.style.top=_95.style.top;
h.style.left=_95.style.left;
h.width=this.width_;
h.height=this.height_;
h.style.width=this.width_+"px";
h.style.height=this.height_+"px";
this.graphDiv.appendChild(h);
return h;
};
Dygraph.hsvToRGB=function(hue,_98,_99){
var red;
var _101;
var blue;
if(_98===0){
red=_99;
_101=_99;
blue=_99;
}else{
var i=Math.floor(hue*6);
var f=(hue*6)-i;
var p=_99*(1-_98);
var q=_99*(1-(_98*f));
var t=_99*(1-(_98*(1-f)));
switch(i){
case 1:
red=q;
_101=_99;
blue=p;
break;
case 2:
red=p;
_101=_99;
blue=t;
break;
case 3:
red=p;
_101=q;
blue=_99;
break;
case 4:
red=t;
_101=p;
blue=_99;
break;
case 5:
red=_99;
_101=p;
blue=q;
break;
case 6:
case 0:
red=_99;
_101=t;
blue=p;
break;
}
}
red=Math.floor(255*red+0.5);
_101=Math.floor(255*_101+0.5);
blue=Math.floor(255*blue+0.5);
return "rgb("+red+","+_101+","+blue+")";
};
Dygraph.prototype.setColors_=function(){
var num=this.attr_("labels").length-1;
this.colors_=[];
var _108=this.attr_("colors");
if(!_108){
var sat=this.attr_("colorSaturation")||1;
var val=this.attr_("colorValue")||0.5;
for(var i=1;i<=num;i++){
var hue=(1*i/(1+num));
this.colors_.push(Dygraph.hsvToRGB(hue,sat,val));
}
}else{
for(var i=0;i<num;i++){
var _111=_108[i%_108.length];
this.colors_.push(_111);
}
}
this.renderOptions_.colorScheme=this.colors_;
Dygraph.update(this.plotter_.options,this.renderOptions_);
Dygraph.update(this.layoutOptions_,this.user_attrs_);
Dygraph.update(this.layoutOptions_,this.attrs_);
};
Dygraph.findPosX=function(obj){
var _113=0;
if(obj.offsetParent){
while(obj.offsetParent){
_113+=obj.offsetLeft;
obj=obj.offsetParent;
}
}else{
if(obj.x){
_113+=obj.x;
}
}
return _113;
};
Dygraph.findPosY=function(obj){
var _114=0;
if(obj.offsetParent){
while(obj.offsetParent){
_114+=obj.offsetTop;
obj=obj.offsetParent;
}
}else{
if(obj.y){
_114+=obj.y;
}
}
return _114;
};
Dygraph.prototype.createStatusMessage_=function(){
if(!this.attr_("labelsDiv")){
var _115=this.attr_("labelsDivWidth");
var _116={"position":"absolute","fontSize":"14px","zIndex":10,"width":_115+"px","top":"0px","left":(this.width_-_115-2)+"px","background":"white","textAlign":"left","overflow":"hidden"};
Dygraph.update(_116,this.attr_("labelsDivStyles"));
var div=document.createElement("div");
for(var name in _116){
div.style[name]=_116[name];
}
this.graphDiv.appendChild(div);
this.attrs_.labelsDiv=div;
}
};
Dygraph.prototype.createRollInterface_=function(){
var _118=this.attr_("showRoller")?"block":"none";
var _119={"position":"absolute","zIndex":10,"top":(this.plotter_.area.h-25)+"px","left":(this.plotter_.area.x+1)+"px","display":_118};
var _120=document.createElement("input");
_120.type="text";
_120.size="2";
_120.value=this.rollPeriod_;
for(var name in _119){
_120.style[name]=_119[name];
}
var pa=this.graphDiv;
pa.appendChild(_120);
var _122=this;
_120.onchange=function(){
_122.adjustRoll(_120.value);
};
return _120;
};
Dygraph.pageX=function(e){
if(e.pageX){
return (!e.pageX||e.pageX<0)?0:e.pageX;
}else{
var de=document;
var b=document.body;
return e.clientX+(de.scrollLeft||b.scrollLeft)-(de.clientLeft||0);
}
};
Dygraph.pageY=function(e){
if(e.pageY){
return (!e.pageY||e.pageY<0)?0:e.pageY;
}else{
var de=document;
var b=document.body;
return e.clientY+(de.scrollTop||b.scrollTop)-(de.clientTop||0);
}
};
Dygraph.prototype.createDragInterface_=function(){
var self=this;
var _126=false;
var _127=null;
var _128=null;
var _129=null;
var _130=null;
var _131=null;
var px=0;
var py=0;
var getX=function(e){
return Dygraph.pageX(e)-px;
};
var getY=function(e){
return Dygraph.pageX(e)-py;
};
Dygraph.addEvent(this.hidden_,"mousemove",function(_136){
if(_126){
_129=getX(_136);
_130=getY(_136);
self.drawZoomRect_(_127,_129,_131);
_131=_129;
}
});
Dygraph.addEvent(this.hidden_,"mousedown",function(_137){
_126=true;
px=Dygraph.findPosX(self.canvas_);
py=Dygraph.findPosY(self.canvas_);
_127=getX(_137);
_128=getY(_137);
});
Dygraph.addEvent(document,"mouseup",function(_138){
if(_126){
_126=false;
_127=null;
_128=null;
}
});
Dygraph.addEvent(this.hidden_,"mouseout",function(_139){
if(_126){
_129=null;
_130=null;
}
});
Dygraph.addEvent(this.hidden_,"mouseup",function(_140){
if(_126){
_126=false;
_129=getX(_140);
_130=getY(_140);
var _141=Math.abs(_129-_127);
var _142=Math.abs(_130-_128);
if(_141<2&&_142<2&&self.attr_("clickCallback")!=null&&self.lastx_!=undefined){
self.attr_("clickCallback")(_140,self.lastx_,self.selPoints_);
}
if(_141>=10){
self.doZoom_(Math.min(_127,_129),Math.max(_127,_129));
}else{
self.canvas_.getContext("2d").clearRect(0,0,self.canvas_.width,self.canvas_.height);
}
_127=null;
_128=null;
}
});
Dygraph.addEvent(this.hidden_,"dblclick",function(_143){
if(self.dateWindow_==null){
return;
}
self.dateWindow_=null;
self.drawGraph_(self.rawData_);
var _144=self.rawData_[0][0];
var _145=self.rawData_[self.rawData_.length-1][0];
if(self.attr_("zoomCallback")){
self.attr_("zoomCallback")(_144,_145);
}
});
};
Dygraph.prototype.drawZoomRect_=function(_146,endX,_148){
var ctx=this.canvas_.getContext("2d");
if(_148){
ctx.clearRect(Math.min(_146,_148),0,Math.abs(_146-_148),this.height_);
}
if(endX&&_146){
ctx.fillStyle="rgba(128,128,128,0.33)";
ctx.fillRect(Math.min(_146,endX),0,Math.abs(endX-_146),this.height_);
}
};
Dygraph.prototype.doZoom_=function(lowX,_150){
var _151=this.layout_.points;
var _152=null;
var _153=null;
for(var i=0;i<_151.length;i++){
var cx=_151[i].canvasx;
var x=_151[i].xval;
if(cx<lowX&&(_152==null||x>_152)){
_152=x;
}
if(cx>_150&&(_153==null||x<_153)){
_153=x;
}
}
if(_152==null){
_152=_151[0].xval;
}
if(_153==null){
_153=_151[_151.length-1].xval;
}
this.dateWindow_=[_152,_153];
this.drawGraph_(this.rawData_);
if(this.attr_("zoomCallback")){
this.attr_("zoomCallback")(_152,_153);
}
};
Dygraph.prototype.mouseMove_=function(_155){
var _156=Dygraph.pageX(_155)-Dygraph.findPosX(this.hidden_);
var _157=this.layout_.points;
var _158=-1;
var _159=-1;
var _160=1e+100;
var idx=-1;
for(var i=0;i<_157.length;i++){
var dist=Math.abs(_157[i].canvasx-_156);
if(dist>_160){
break;
}
_160=dist;
idx=i;
}
if(idx>=0){
_158=_157[idx].xval;
}
if(_156>_157[_157.length-1].canvasx){
_158=_157[_157.length-1].xval;
}
this.selPoints_=[];
for(var i=0;i<_157.length;i++){
if(_157[i].xval==_158){
this.selPoints_.push(_157[i]);
}
}
if(this.attr_("highlightCallback")){
this.attr_("highlightCallback")(_155,_158,this.selPoints_);
}
var _163=this.attr_("highlightCircleSize");
var ctx=this.canvas_.getContext("2d");
if(this.previousVerticalX_>=0){
var px=this.previousVerticalX_;
ctx.clearRect(px-_163-1,0,2*_163+2,this.height_);
}
var isOK=function(x){
return x&&!isNaN(x);
};
if(this.selPoints_.length>0){
var _156=this.selPoints_[0].canvasx;
var _165=this.attr_("xValueFormatter")(_158,this)+":";
var clen=this.colors_.length;
for(var i=0;i<this.selPoints_.length;i++){
if(!isOK(this.selPoints_[i].canvasy)){
continue;
}
if(this.attr_("labelsSeparateLines")){
_165+="<br/>";
}
var _167=this.selPoints_[i];
var c=new RGBColor(this.colors_[i%clen]);
_165+=" <b><font color='"+c.toHex()+"'>"+_167.name+"</font></b>:"+this.round_(_167.yval,2);
}
this.attr_("labelsDiv").innerHTML=_165;
this.lastx_=_158;
ctx.save();
for(var i=0;i<this.selPoints_.length;i++){
if(!isOK(this.selPoints_[i%clen].canvasy)){
continue;
}
ctx.beginPath();
ctx.fillStyle=this.colors_[i%clen];
ctx.arc(_156,this.selPoints_[i%clen].canvasy,_163,0,2*Math.PI,false);
ctx.fill();
}
ctx.restore();
this.previousVerticalX_=_156;
}
};
Dygraph.prototype.mouseOut_=function(_169){
var ctx=this.canvas_.getContext("2d");
ctx.clearRect(0,0,this.width_,this.height_);
this.attr_("labelsDiv").innerHTML="";
};
Dygraph.zeropad=function(x){
if(x<10){
return "0"+x;
}else{
return ""+x;
}
};
Dygraph.prototype.hmsString_=function(date){
var _171=Dygraph.zeropad;
var d=new Date(date);
if(d.getSeconds()){
return _171(d.getHours())+":"+_171(d.getMinutes())+":"+_171(d.getSeconds());
}else{
if(d.getMinutes()){
return _171(d.getHours())+":"+_171(d.getMinutes());
}else{
return _171(d.getHours());
}
}
};
Dygraph.dateString_=function(date,self){
var _173=Dygraph.zeropad;
var d=new Date(date);
var year=""+d.getFullYear();
var _175=_173(d.getMonth()+1);
var day=_173(d.getDate());
var ret="";
var frac=d.getHours()*3600+d.getMinutes()*60+d.getSeconds();
if(frac){
ret=" "+self.hmsString_(date);
}
return year+"/"+_175+"/"+day+ret;
};
Dygraph.prototype.round_=function(num,_179){
var _180=Math.pow(10,_179);
return Math.round(num*_180)/_180;
};
Dygraph.prototype.loadedEvent_=function(data){
this.rawData_=this.parseCSV_(data);
this.drawGraph_(this.rawData_);
};
Dygraph.prototype.months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
Dygraph.prototype.quarters=["Jan","Apr","Jul","Oct"];
Dygraph.prototype.addXTicks_=function(){
var _182,endDate;
if(this.dateWindow_){
_182=this.dateWindow_[0];
endDate=this.dateWindow_[1];
}else{
_182=this.rawData_[0][0];
endDate=this.rawData_[this.rawData_.length-1][0];
}
var _183=this.attr_("xTicker")(_182,endDate,this);
this.layout_.updateOptions({xTicks:_183});
};
Dygraph.SECONDLY=0;
Dygraph.TEN_SECONDLY=1;
Dygraph.THIRTY_SECONDLY=2;
Dygraph.MINUTELY=3;
Dygraph.TEN_MINUTELY=4;
Dygraph.THIRTY_MINUTELY=5;
Dygraph.HOURLY=6;
Dygraph.SIX_HOURLY=7;
Dygraph.DAILY=8;
Dygraph.WEEKLY=9;
Dygraph.MONTHLY=10;
Dygraph.QUARTERLY=11;
Dygraph.BIANNUAL=12;
Dygraph.ANNUAL=13;
Dygraph.DECADAL=14;
Dygraph.NUM_GRANULARITIES=15;
Dygraph.SHORT_SPACINGS=[];
Dygraph.SHORT_SPACINGS[Dygraph.SECONDLY]=1000*1;
Dygraph.SHORT_SPACINGS[Dygraph.TEN_SECONDLY]=1000*10;
Dygraph.SHORT_SPACINGS[Dygraph.THIRTY_SECONDLY]=1000*30;
Dygraph.SHORT_SPACINGS[Dygraph.MINUTELY]=1000*60;
Dygraph.SHORT_SPACINGS[Dygraph.TEN_MINUTELY]=1000*60*10;
Dygraph.SHORT_SPACINGS[Dygraph.THIRTY_MINUTELY]=1000*60*30;
Dygraph.SHORT_SPACINGS[Dygraph.HOURLY]=1000*3600;
Dygraph.SHORT_SPACINGS[Dygraph.HOURLY]=1000*3600*6;
Dygraph.SHORT_SPACINGS[Dygraph.DAILY]=1000*86400;
Dygraph.SHORT_SPACINGS[Dygraph.WEEKLY]=1000*604800;
Dygraph.prototype.NumXTicks=function(_184,_185,_186){
if(_186<Dygraph.MONTHLY){
var _187=Dygraph.SHORT_SPACINGS[_186];
return Math.floor(0.5+1*(_185-_184)/_187);
}else{
var _188=1;
var _189=12;
if(_186==Dygraph.QUARTERLY){
_189=3;
}
if(_186==Dygraph.BIANNUAL){
_189=2;
}
if(_186==Dygraph.ANNUAL){
_189=1;
}
if(_186==Dygraph.DECADAL){
_189=1;
_188=10;
}
var _190=365.2524*24*3600*1000;
var _191=1*(_185-_184)/_190;
return Math.floor(0.5+1*_191*_189/_188);
}
};
Dygraph.prototype.GetXAxis=function(_192,_193,_194){
var _195=[];
if(_194<Dygraph.MONTHLY){
var _196=Dygraph.SHORT_SPACINGS[_194];
var _197="%d%b";
if(_194<Dygraph.HOURLY){
_192=_196*Math.floor(0.5+_192/_196);
}
for(var t=_192;t<=_193;t+=_196){
var d=new Date(t);
var frac=d.getHours()*3600+d.getMinutes()*60+d.getSeconds();
if(frac==0||_194>=Dygraph.DAILY){
_195.push({v:t,label:new Date(t+3600*1000).strftime(_197)});
}else{
_195.push({v:t,label:this.hmsString_(t)});
}
}
}else{
var _198;
var _199=1;
if(_194==Dygraph.MONTHLY){
_198=[0,1,2,3,4,5,6,7,8,9,10,11,12];
}else{
if(_194==Dygraph.QUARTERLY){
_198=[0,3,6,9];
}else{
if(_194==Dygraph.BIANNUAL){
_198=[0,6];
}else{
if(_194==Dygraph.ANNUAL){
_198=[0];
}else{
if(_194==Dygraph.DECADAL){
_198=[0];
_199=10;
}
}
}
}
}
var _200=new Date(_192).getFullYear();
var _201=new Date(_193).getFullYear();
var _202=Dygraph.zeropad;
for(var i=_200;i<=_201;i++){
if(i%_199!=0){
continue;
}
for(var j=0;j<_198.length;j++){
var _203=i+"/"+_202(1+_198[j])+"/01";
var t=Date.parse(_203);
if(t<_192||t>_193){
continue;
}
_195.push({v:t,label:new Date(t).strftime("%b %y")});
}
}
}
return _195;
};
Dygraph.dateTicker=function(_204,_205,self){
var _206=-1;
for(var i=0;i<Dygraph.NUM_GRANULARITIES;i++){
var _207=self.NumXTicks(_204,_205,i);
if(self.width_/_207>=self.attr_("pixelsPerXLabel")){
_206=i;
break;
}
}
if(_206>=0){
return self.GetXAxis(_204,_205,_206);
}else{
}
};
Dygraph.numericTicks=function(minV,maxV,self){
var _210=[1,2,5];
var _211,low_val,high_val,nTicks;
var _212=self.attr_("pixelsPerYLabel");
for(var i=-10;i<50;i++){
var _213=Math.pow(10,i);
for(var j=0;j<_210.length;j++){
_211=_213*_210[j];
low_val=Math.floor(minV/_211)*_211;
high_val=Math.ceil(maxV/_211)*_211;
nTicks=(high_val-low_val)/_211;
var _214=self.height_/nTicks;
if(_214>_212){
break;
}
}
if(_214>_212){
break;
}
}
var _215=[];
for(var i=0;i<nTicks;i++){
var _216=low_val+i*_211;
var _217=self.round_(_216,2);
if(self.attr_("labelsKMB")){
var k=1000;
if(_216>=k*k*k){
_217=self.round_(_216/(k*k*k),1)+"B";
}else{
if(_216>=k*k){
_217=self.round_(_216/(k*k),1)+"M";
}else{
if(_216>=k){
_217=self.round_(_216/k,1)+"K";
}
}
}
}
_215.push({label:_217,v:_216});
}
return _215;
};
Dygraph.prototype.addYTicks_=function(minY,maxY){
var _221=Dygraph.numericTicks(minY,maxY,this);
this.layout_.updateOptions({yAxis:[minY,maxY],yTicks:_221});
};
Dygraph.prototype.extremeValues_=function(_222){
var minY=null,maxY=null;
var bars=this.attr_("errorBars")||this.attr_("customBars");
if(bars){
for(var j=0;j<_222.length;j++){
var y=_222[j][1][0];
if(!y){
continue;
}
var low=y-_222[j][1][1];
var high=y+_222[j][1][2];
if(low>y){
low=y;
}
if(high<y){
high=y;
}
if(maxY==null||high>maxY){
maxY=high;
}
if(minY==null||low<minY){
minY=low;
}
}
}else{
for(var j=0;j<_222.length;j++){
var y=_222[j][1];
if(!y){
continue;
}
if(maxY==null||y>maxY){
maxY=y;
}
if(minY==null||y<minY){
minY=y;
}
}
}
return [minY,maxY];
};
Dygraph.prototype.drawGraph_=function(data){
var minY=null,maxY=null;
this.layout_.removeAllDatasets();
this.setColors_();
this.attrs_["pointSize"]=0.5*this.attr_("highlightCircleSize");
for(var i=1;i<data[0].length;i++){
var _226=[];
for(var j=0;j<data.length;j++){
var date=data[j][0];
_226[j]=[date,data[j][i]];
}
_226=this.rollingAverage(_226,this.rollPeriod_);
var bars=this.attr_("errorBars")||this.attr_("customBars");
if(this.dateWindow_){
var low=this.dateWindow_[0];
var high=this.dateWindow_[1];
var _227=[];
for(var k=0;k<_226.length;k++){
if(_226[k][0]>=low&&_226[k][0]<=high){
_227.push(_226[k]);
}
}
_226=_227;
}
var _228=this.extremeValues_(_226);
var _229=_228[0];
var _230=_228[1];
if(!minY||_229<minY){
minY=_229;
}
if(!maxY||_230>maxY){
maxY=_230;
}
if(bars){
var vals=[];
for(var j=0;j<_226.length;j++){
vals[j]=[_226[j][0],_226[j][1][0],_226[j][1][1],_226[j][1][2]];
}
this.layout_.addDataset(this.attr_("labels")[i],vals);
}else{
this.layout_.addDataset(this.attr_("labels")[i],_226);
}
}
if(this.valueRange_!=null){
this.addYTicks_(this.valueRange_[0],this.valueRange_[1]);
}else{
var span=maxY-minY;
var _233=maxY+0.1*span;
var _234=minY-0.1*span;
if(_234<0&&minY>=0){
_234=0;
}
if(_233>0&&maxY<=0){
_233=0;
}
if(this.attr_("includeZero")){
if(maxY<0){
_233=0;
}
if(minY>0){
_234=0;
}
}
this.addYTicks_(_234,_233);
}
this.addXTicks_();
this.layout_.evaluateWithError();
this.plotter_.clear();
this.plotter_.render();
this.canvas_.getContext("2d").clearRect(0,0,this.canvas_.width,this.canvas_.height);
};
Dygraph.prototype.rollingAverage=function(_235,_236){
if(_235.length<2){
return _235;
}
var _236=Math.min(_236,_235.length-1);
var _237=[];
var _238=this.attr_("sigma");
if(this.fractions_){
var num=0;
var den=0;
var mult=100;
for(var i=0;i<_235.length;i++){
num+=_235[i][1][0];
den+=_235[i][1][1];
if(i-_236>=0){
num-=_235[i-_236][1][0];
den-=_235[i-_236][1][1];
}
var date=_235[i][0];
var _241=den?num/den:0;
if(this.attr_("errorBars")){
if(this.wilsonInterval_){
if(den){
var p=_241<0?0:_241,n=den;
var pm=_238*Math.sqrt(p*(1-p)/n+_238*_238/(4*n*n));
var _243=1+_238*_238/den;
var low=(p+_238*_238/(2*den)-pm)/_243;
var high=(p+_238*_238/(2*den)+pm)/_243;
_237[i]=[date,[p*mult,(p-low)*mult,(high-p)*mult]];
}else{
_237[i]=[date,[0,0,0]];
}
}else{
var _244=den?_238*Math.sqrt(_241*(1-_241)/den):1;
_237[i]=[date,[mult*_241,mult*_244,mult*_244]];
}
}else{
_237[i]=[date,mult*_241];
}
}
}else{
if(this.attr_("customBars")){
var low=0;
var mid=0;
var high=0;
var _246=0;
for(var i=0;i<_235.length;i++){
var data=_235[i][1];
var y=data[1];
_237[i]=[_235[i][0],[y,y-data[0],data[2]-y]];
if(y!=null&&!isNaN(y)){
low+=data[0];
mid+=y;
high+=data[2];
_246+=1;
}
if(i-_236>=0){
var prev=_235[i-_236];
if(prev[1][1]!=null&&!isNaN(prev[1][1])){
low-=prev[1][0];
mid-=prev[1][1];
high-=prev[1][2];
_246-=1;
}
}
_237[i]=[_235[i][0],[1*mid/_246,1*(mid-low)/_246,1*(high-mid)/_246]];
}
}else{
var _248=Math.min(_236-1,_235.length-2);
if(!this.attr_("errorBars")){
if(_236==1){
return _235;
}
for(var i=0;i<_235.length;i++){
var sum=0;
var _250=0;
for(var j=Math.max(0,i-_236+1);j<i+1;j++){
var y=_235[j][1];
if(y==null||isNaN(y)){
continue;
}
_250++;
sum+=_235[j][1];
}
if(_250){
_237[i]=[_235[i][0],sum/_250];
}else{
_237[i]=[_235[i][0],null];
}
}
}else{
for(var i=0;i<_235.length;i++){
var sum=0;
var _251=0;
var _250=0;
for(var j=Math.max(0,i-_236+1);j<i+1;j++){
var y=_235[j][1][0];
if(y==null||isNaN(y)){
continue;
}
_250++;
sum+=_235[j][1][0];
_251+=Math.pow(_235[j][1][1],2);
}
if(_250){
var _244=Math.sqrt(_251)/_250;
_237[i]=[_235[i][0],[sum/_250,_238*_244,_238*_244]];
}else{
_237[i]=[_235[i][0],[null,null,null]];
}
}
}
}
}
return _237;
};
Dygraph.dateParser=function(_252,self){
var _253;
var d;
if(_252.length==10&&_252.search("-")!=-1){
_253=_252.replace("-","/","g");
while(_253.search("-")!=-1){
_253=_253.replace("-","/");
}
d=Date.parse(_253);
}else{
if(_252.length==8){
_253=_252.substr(0,4)+"/"+_252.substr(4,2)+"/"+_252.substr(6,2);
d=Date.parse(_253);
}else{
d=Date.parse(_252);
}
}
if(!d||isNaN(d)){
self.error("Couldn't parse "+_252+" as a date");
}
return d;
};
Dygraph.prototype.detectTypeFromString_=function(str){
var _255=false;
if(str.indexOf("-")>=0||str.indexOf("/")>=0||isNaN(parseFloat(str))){
_255=true;
}else{
if(str.length==8&&str>"19700101"&&str<"20371231"){
_255=true;
}
}
if(_255){
this.attrs_.xValueFormatter=Dygraph.dateString_;
this.attrs_.xValueParser=Dygraph.dateParser;
this.attrs_.xTicker=Dygraph.dateTicker;
}else{
this.attrs_.xValueFormatter=function(x){
return x;
};
this.attrs_.xValueParser=function(x){
return parseFloat(x);
};
this.attrs_.xTicker=Dygraph.numericTicks;
}
};
Dygraph.prototype.parseCSV_=function(data){
var ret=[];
var _256=data.split("\n");
var _257=this.attr_("delimiter");
if(_256[0].indexOf(_257)==-1&&_256[0].indexOf("\t")>=0){
_257="\t";
}
var _258=0;
if(this.labelsFromCSV_){
_258=1;
this.attrs_.labels=_256[0].split(_257);
}
var _259;
var _260=false;
var _261=this.attr_("labels").length;
for(var i=_258;i<_256.length;i++){
var line=_256[i];
if(line.length==0){
continue;
}
if(line[0]=="#"){
continue;
}
var _263=line.split(_257);
if(_263.length<2){
continue;
}
var _264=[];
if(!_260){
this.detectTypeFromString_(_263[0]);
_259=this.attr_("xValueParser");
_260=true;
}
_264[0]=_259(_263[0],this);
if(this.fractions_){
for(var j=1;j<_263.length;j++){
var vals=_263[j].split("/");
_264[j]=[parseFloat(vals[0]),parseFloat(vals[1])];
}
}else{
if(this.attr_("errorBars")){
for(var j=1;j<_263.length;j+=2){
_264[(j+1)/2]=[parseFloat(_263[j]),parseFloat(_263[j+1])];
}
}else{
if(this.attr_("customBars")){
for(var j=1;j<_263.length;j++){
var vals=_263[j].split(";");
_264[j]=[parseFloat(vals[0]),parseFloat(vals[1]),parseFloat(vals[2])];
}
}else{
for(var j=1;j<_263.length;j++){
_264[j]=parseFloat(_263[j]);
}
}
}
}
ret.push(_264);
if(_264.length!=_261){
this.error("Number of columns in line "+i+" ("+_264.length+") does not agree with number of labels ("+_261+") "+line);
}
}
return ret;
};
Dygraph.prototype.parseArray_=function(data){
if(data.length==0){
this.error("Can't plot empty data set");
return null;
}
if(data[0].length==0){
this.error("Data set cannot contain an empty row");
return null;
}
if(this.attr_("labels")==null){
this.warn("Using default labels. Set labels explicitly via 'labels' "+"in the options parameter");
this.attrs_.labels=["X"];
for(var i=1;i<data[0].length;i++){
this.attrs_.labels.push("Y"+i);
}
}
if(Dygraph.isDateLike(data[0][0])){
this.attrs_.xValueFormatter=Dygraph.dateString_;
this.attrs_.xTicker=Dygraph.dateTicker;
var _265=Dygraph.clone(data);
for(var i=0;i<data.length;i++){
if(_265[i].length==0){
this.error("Row "<<(1+i)<<" of data is empty");
return null;
}
if(_265[i][0]==null||typeof (_265[i][0].getTime)!="function"){
this.error("x value in row "<<(1+i)<<" is not a Date");
return null;
}
_265[i][0]=_265[i][0].getTime();
}
return _265;
}else{
this.attrs_.xValueFormatter=function(x){
return x;
};
this.attrs_.xTicker=Dygraph.numericTicks;
return data;
}
};
Dygraph.prototype.parseDataTable_=function(data){
var cols=data.getNumberOfColumns();
var rows=data.getNumberOfRows();
var _268=[];
for(var i=0;i<cols;i++){
_268.push(data.getColumnLabel(i));
if(i!=0&&this.attr_("errorBars")){
i+=1;
}
}
this.attrs_.labels=_268;
cols=_268.length;
var _269=data.getColumnType(0);
if(_269=="date"){
this.attrs_.xValueFormatter=Dygraph.dateString_;
this.attrs_.xValueParser=Dygraph.dateParser;
this.attrs_.xTicker=Dygraph.dateTicker;
}else{
if(_269=="number"){
this.attrs_.xValueFormatter=function(x){
return x;
};
this.attrs_.xValueParser=function(x){
return parseFloat(x);
};
this.attrs_.xTicker=Dygraph.numericTicks;
}else{
this.error("only 'date' and 'number' types are supported for column 1 "+"of DataTable input (Got '"+_269+"')");
return null;
}
}
var ret=[];
for(var i=0;i<rows;i++){
var row=[];
if(!data.getValue(i,0)){
continue;
}
if(_269=="date"){
row.push(data.getValue(i,0).getTime());
}else{
row.push(data.getValue(i,0));
}
if(!this.attr_("errorBars")){
for(var j=1;j<cols;j++){
row.push(data.getValue(i,j));
}
}else{
for(var j=0;j<cols-1;j++){
row.push([data.getValue(i,1+2*j),data.getValue(i,2+2*j)]);
}
}
ret.push(row);
}
return ret;
};
Dygraph.update=function(self,o){
if(typeof (o)!="undefined"&&o!==null){
for(var k in o){
self[k]=o[k];
}
}
return self;
};
Dygraph.isArrayLike=function(o){
var typ=typeof (o);
if((typ!="object"&&!(typ=="function"&&typeof (o.item)=="function"))||o===null||typeof (o.length)!="number"||o.nodeType===3){
return false;
}
return true;
};
Dygraph.isDateLike=function(o){
if(typeof (o)!="object"||o===null||typeof (o.getTime)!="function"){
return false;
}
return true;
};
Dygraph.clone=function(o){
var r=[];
for(var i=0;i<o.length;i++){
if(Dygraph.isArrayLike(o[i])){
r.push(Dygraph.clone(o[i]));
}else{
r.push(o[i]);
}
}
return r;
};
Dygraph.prototype.start_=function(){
if(typeof this.file_=="function"){
this.loadedEvent_(this.file_());
}else{
if(Dygraph.isArrayLike(this.file_)){
this.rawData_=this.parseArray_(this.file_);
this.drawGraph_(this.rawData_);
}else{
if(typeof this.file_=="object"&&typeof this.file_.getColumnRange=="function"){
this.rawData_=this.parseDataTable_(this.file_);
this.drawGraph_(this.rawData_);
}else{
if(typeof this.file_=="string"){
if(this.file_.indexOf("\n")>=0){
this.loadedEvent_(this.file_);
}else{
var req=new XMLHttpRequest();
var _275=this;
req.onreadystatechange=function(){
if(req.readyState==4){
if(req.status==200){
_275.loadedEvent_(req.responseText);
}
}
};
req.open("GET",this.file_,true);
req.send(null);
}
}else{
this.error("Unknown data format: "+(typeof this.file_));
}
}
}
}
};
Dygraph.prototype.updateOptions=function(_276){
if(_276.rollPeriod){
this.rollPeriod_=_276.rollPeriod;
}
if(_276.dateWindow){
this.dateWindow_=_276.dateWindow;
}
if(_276.valueRange){
this.valueRange_=_276.valueRange;
}
Dygraph.update(this.user_attrs_,_276);
this.labelsFromCSV_=(this.attr_("labels")==null);
this.layout_.updateOptions({"errorBars":this.attr_("errorBars")});
if(_276["file"]&&_276["file"]!=this.file_){
this.file_=_276["file"];
this.start_();
}else{
this.drawGraph_(this.rawData_);
}
};
Dygraph.prototype.adjustRoll=function(_277){
this.rollPeriod_=_277;
this.drawGraph_(this.rawData_);
};
Dygraph.createCanvas=function(){
var _278=document.createElement("canvas");
isIE=(/MSIE/.test(navigator.userAgent)&&!window.opera);
if(isIE){
_278=G_vmlCanvasManager.initElement(_278);
}
return _278;
};
Dygraph.GVizChart=function(_279){
this.container=_279;
};
Dygraph.GVizChart.prototype.draw=function(data,_280){
this.container.innerHTML="";
this.date_graph=new Dygraph(this.container,data,_280);
};
DateGraph=Dygraph;
function RGBColor(_281){
this.ok=false;
if(_281.charAt(0)=="#"){
_281=_281.substr(1,6);
}
_281=_281.replace(/ /g,"");
_281=_281.toLowerCase();
var _282={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"00ffff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000000",blanchedalmond:"ffebcd",blue:"0000ff",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"00ffff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dodgerblue:"1e90ff",feldspar:"d19275",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"ff00ff",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgrey:"d3d3d3",lightgreen:"90ee90",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslateblue:"8470ff",lightslategray:"778899",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"00ff00",limegreen:"32cd32",linen:"faf0e6",magenta:"ff00ff",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370d8",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"d87093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",red:"ff0000",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",violetred:"d02090",wheat:"f5deb3",white:"ffffff",whitesmoke:"f5f5f5",yellow:"ffff00",yellowgreen:"9acd32"};
for(var key in _282){
if(_281==key){
_281=_282[key];
}
}
var _284=[{re:/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,example:["rgb(123, 234, 45)","rgb(255,234,245)"],process:function(bits){
return [parseInt(bits[1]),parseInt(bits[2]),parseInt(bits[3])];
}},{re:/^(\w{2})(\w{2})(\w{2})$/,example:["#00ff00","336699"],process:function(bits){
return [parseInt(bits[1],16),parseInt(bits[2],16),parseInt(bits[3],16)];
}},{re:/^(\w{1})(\w{1})(\w{1})$/,example:["#fb0","f0f"],process:function(bits){
return [parseInt(bits[1]+bits[1],16),parseInt(bits[2]+bits[2],16),parseInt(bits[3]+bits[3],16)];
}}];
for(var i=0;i<_284.length;i++){
var re=_284[i].re;
var _287=_284[i].process;
var bits=re.exec(_281);
if(bits){
channels=_287(bits);
this.r=channels[0];
this.g=channels[1];
this.b=channels[2];
this.ok=true;
}
}
this.r=(this.r<0||isNaN(this.r))?0:((this.r>255)?255:this.r);
this.g=(this.g<0||isNaN(this.g))?0:((this.g>255)?255:this.g);
this.b=(this.b<0||isNaN(this.b))?0:((this.b>255)?255:this.b);
this.toRGB=function(){
return "rgb("+this.r+", "+this.g+", "+this.b+")";
};
this.toHex=function(){
var r=this.r.toString(16);
var g=this.g.toString(16);
var b=this.b.toString(16);
if(r.length==1){
r="0"+r;
}
if(g.length==1){
g="0"+g;
}
if(b.length==1){
b="0"+b;
}
return "#"+r+g+b;
};
}

