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
if(this.options.dateWindow){
this.minxval=this.options.dateWindow[0];
this.maxxval=this.options.dateWindow[1];
}else{
for(var _6 in this.datasets){
if(!this.datasets.hasOwnProperty(_6)){
continue;
}
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
if(!this.datasets.hasOwnProperty(_10)){
continue;
}
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
if(!this.datasets.hasOwnProperty(_19)){
continue;
}
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
if(_41.hasOwnProperty(_45)){
div.style[_45]=_41[_45];
}
}
div.appendChild(document.createTextNode(txt));
return div;
};
_40.save();
_40.strokeStyle=this.options.axisLineColor;
_40.lineWidth=this.options.axisLineWidth;
if(this.options.drawYAxis){
if(this.layout.yticks&&this.layout.yticks.length>0){
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
if(this.layout.datasets.hasOwnProperty(_58)){
_57.push(_58);
}
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
Dygraph.DEFAULT_ATTRS={highlightCircleSize:3,pixelsPerXLabel:60,pixelsPerYLabel:30,labelsDivWidth:250,labelsDivStyles:{},labelsSeparateLines:false,labelsKMB:false,labelsKMG2:false,strokeWidth:1,axisTickSize:3,axisLabelFontSize:14,xAxisLabelWidth:50,yAxisLabelWidth:50,rightGap:5,showRoller:false,xValueFormatter:Dygraph.dateString_,xValueParser:Dygraph.dateParser,xTicker:Dygraph.dateTicker,delimiter:",",sigma:2,errorBars:false,fractions:false,wilsonInterval:true,customBars:false};
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
if(_116.hasOwnProperty(name)){
div.style[name]=_116[name];
}
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
if(_119.hasOwnProperty(name)){
_120.style[name]=_119[name];
}
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
var _127=false;
var _128=null;
var _129=null;
var _130=null;
var _131=null;
var _132=null;
var _133=null;
var _134=null;
var px=0;
var py=0;
var getX=function(e){
return Dygraph.pageX(e)-px;
};
var getY=function(e){
return Dygraph.pageX(e)-py;
};
Dygraph.addEvent(this.hidden_,"mousemove",function(_139){
if(_126){
_130=getX(_139);
_131=getY(_139);
self.drawZoomRect_(_128,_130,_132);
_132=_130;
}else{
if(_127){
_130=getX(_139);
_131=getY(_139);
self.dateWindow_[0]=_133-(_130/self.width_)*_134;
self.dateWindow_[1]=self.dateWindow_[0]+_134;
self.drawGraph_(self.rawData_);
}
}
});
Dygraph.addEvent(this.hidden_,"mousedown",function(_140){
px=Dygraph.findPosX(self.canvas_);
py=Dygraph.findPosY(self.canvas_);
_128=getX(_140);
_129=getY(_140);
if(_140.altKey||_140.shiftKey){
if(!self.dateWindow_){
return;
}
_127=true;
_134=self.dateWindow_[1]-self.dateWindow_[0];
_133=(_128/self.width_)*_134+self.dateWindow_[0];
}else{
_126=true;
}
});
Dygraph.addEvent(document,"mouseup",function(_141){
if(_126||_127){
_126=false;
_128=null;
_129=null;
}
if(_127){
_127=false;
_133=null;
_134=null;
}
});
Dygraph.addEvent(this.hidden_,"mouseout",function(_142){
if(_126){
_130=null;
_131=null;
}
});
Dygraph.addEvent(this.hidden_,"mouseup",function(_143){
if(_126){
_126=false;
_130=getX(_143);
_131=getY(_143);
var _144=Math.abs(_130-_128);
var _145=Math.abs(_131-_129);
if(_144<2&&_145<2&&self.attr_("clickCallback")!=null&&self.lastx_!=undefined){
self.attr_("clickCallback")(_143,self.lastx_,self.selPoints_);
}
if(_144>=10){
self.doZoom_(Math.min(_128,_130),Math.max(_128,_130));
}else{
self.canvas_.getContext("2d").clearRect(0,0,self.canvas_.width,self.canvas_.height);
}
_128=null;
_129=null;
}
if(_127){
_127=false;
_133=null;
_134=null;
}
});
Dygraph.addEvent(this.hidden_,"dblclick",function(_146){
if(self.dateWindow_==null){
return;
}
self.dateWindow_=null;
self.drawGraph_(self.rawData_);
var _147=self.rawData_[0][0];
var _148=self.rawData_[self.rawData_.length-1][0];
if(self.attr_("zoomCallback")){
self.attr_("zoomCallback")(_147,_148);
}
});
};
Dygraph.prototype.drawZoomRect_=function(_149,endX,_151){
var ctx=this.canvas_.getContext("2d");
if(_151){
ctx.clearRect(Math.min(_149,_151),0,Math.abs(_149-_151),this.height_);
}
if(endX&&_149){
ctx.fillStyle="rgba(128,128,128,0.33)";
ctx.fillRect(Math.min(_149,endX),0,Math.abs(endX-_149),this.height_);
}
};
Dygraph.prototype.doZoom_=function(lowX,_153){
var _154=this.layout_.points;
var _155=null;
var _156=null;
for(var i=0;i<_154.length;i++){
var cx=_154[i].canvasx;
var x=_154[i].xval;
if(cx<lowX&&(_155==null||x>_155)){
_155=x;
}
if(cx>_153&&(_156==null||x<_156)){
_156=x;
}
}
if(_155==null){
_155=_154[0].xval;
}
if(_156==null){
_156=_154[_154.length-1].xval;
}
this.dateWindow_=[_155,_156];
this.drawGraph_(this.rawData_);
if(this.attr_("zoomCallback")){
this.attr_("zoomCallback")(_155,_156);
}
};
Dygraph.prototype.mouseMove_=function(_158){
var _159=Dygraph.pageX(_158)-Dygraph.findPosX(this.hidden_);
var _160=this.layout_.points;
var _161=-1;
var _162=-1;
var _163=1e+100;
var idx=-1;
for(var i=0;i<_160.length;i++){
var dist=Math.abs(_160[i].canvasx-_159);
if(dist>_163){
break;
}
_163=dist;
idx=i;
}
if(idx>=0){
_161=_160[idx].xval;
}
if(_159>_160[_160.length-1].canvasx){
_161=_160[_160.length-1].xval;
}
this.selPoints_=[];
for(var i=0;i<_160.length;i++){
if(_160[i].xval==_161){
this.selPoints_.push(_160[i]);
}
}
if(this.attr_("highlightCallback")){
this.attr_("highlightCallback")(_158,_161,this.selPoints_);
}
var _166=this.attr_("highlightCircleSize");
var ctx=this.canvas_.getContext("2d");
if(this.previousVerticalX_>=0){
var px=this.previousVerticalX_;
ctx.clearRect(px-_166-1,0,2*_166+2,this.height_);
}
var isOK=function(x){
return x&&!isNaN(x);
};
if(this.selPoints_.length>0){
var _159=this.selPoints_[0].canvasx;
var _168=this.attr_("xValueFormatter")(_161,this)+":";
var clen=this.colors_.length;
for(var i=0;i<this.selPoints_.length;i++){
if(!isOK(this.selPoints_[i].canvasy)){
continue;
}
if(this.attr_("labelsSeparateLines")){
_168+="<br/>";
}
var _170=this.selPoints_[i];
var c=new RGBColor(this.colors_[i%clen]);
_168+=" <b><font color='"+c.toHex()+"'>"+_170.name+"</font></b>:"+this.round_(_170.yval,2);
}
this.attr_("labelsDiv").innerHTML=_168;
this.lastx_=_161;
ctx.save();
for(var i=0;i<this.selPoints_.length;i++){
if(!isOK(this.selPoints_[i%clen].canvasy)){
continue;
}
ctx.beginPath();
ctx.fillStyle=this.colors_[i%clen];
ctx.arc(_159,this.selPoints_[i%clen].canvasy,_166,0,2*Math.PI,false);
ctx.fill();
}
ctx.restore();
this.previousVerticalX_=_159;
}
};
Dygraph.prototype.mouseOut_=function(_172){
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
var _174=Dygraph.zeropad;
var d=new Date(date);
if(d.getSeconds()){
return _174(d.getHours())+":"+_174(d.getMinutes())+":"+_174(d.getSeconds());
}else{
if(d.getMinutes()){
return _174(d.getHours())+":"+_174(d.getMinutes());
}else{
return _174(d.getHours());
}
}
};
Dygraph.dateString_=function(date,self){
var _176=Dygraph.zeropad;
var d=new Date(date);
var year=""+d.getFullYear();
var _178=_176(d.getMonth()+1);
var day=_176(d.getDate());
var ret="";
var frac=d.getHours()*3600+d.getMinutes()*60+d.getSeconds();
if(frac){
ret=" "+self.hmsString_(date);
}
return year+"/"+_178+"/"+day+ret;
};
Dygraph.prototype.round_=function(num,_182){
var _183=Math.pow(10,_182);
return Math.round(num*_183)/_183;
};
Dygraph.prototype.loadedEvent_=function(data){
this.rawData_=this.parseCSV_(data);
this.drawGraph_(this.rawData_);
};
Dygraph.prototype.months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
Dygraph.prototype.quarters=["Jan","Apr","Jul","Oct"];
Dygraph.prototype.addXTicks_=function(){
var _185,endDate;
if(this.dateWindow_){
_185=this.dateWindow_[0];
endDate=this.dateWindow_[1];
}else{
_185=this.rawData_[0][0];
endDate=this.rawData_[this.rawData_.length-1][0];
}
var _186=this.attr_("xTicker")(_185,endDate,this);
this.layout_.updateOptions({xTicks:_186});
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
Dygraph.SHORT_SPACINGS[Dygraph.SIX_HOURLY]=1000*3600*6;
Dygraph.SHORT_SPACINGS[Dygraph.DAILY]=1000*86400;
Dygraph.SHORT_SPACINGS[Dygraph.WEEKLY]=1000*604800;
Dygraph.prototype.NumXTicks=function(_187,_188,_189){
if(_189<Dygraph.MONTHLY){
var _190=Dygraph.SHORT_SPACINGS[_189];
return Math.floor(0.5+1*(_188-_187)/_190);
}else{
var _191=1;
var _192=12;
if(_189==Dygraph.QUARTERLY){
_192=3;
}
if(_189==Dygraph.BIANNUAL){
_192=2;
}
if(_189==Dygraph.ANNUAL){
_192=1;
}
if(_189==Dygraph.DECADAL){
_192=1;
_191=10;
}
var _193=365.2524*24*3600*1000;
var _194=1*(_188-_187)/_193;
return Math.floor(0.5+1*_194*_192/_191);
}
};
Dygraph.prototype.GetXAxis=function(_195,_196,_197){
var _198=[];
if(_197<Dygraph.MONTHLY){
var _199=Dygraph.SHORT_SPACINGS[_197];
var _200="%d%b";
if(_197<Dygraph.HOURLY){
_195=_199*Math.floor(0.5+_195/_199);
}
for(var t=_195;t<=_196;t+=_199){
var d=new Date(t);
var frac=d.getHours()*3600+d.getMinutes()*60+d.getSeconds();
if(frac==0||_197>=Dygraph.DAILY){
_198.push({v:t,label:new Date(t+3600*1000).strftime(_200)});
}else{
_198.push({v:t,label:this.hmsString_(t)});
}
}
}else{
var _201;
var _202=1;
if(_197==Dygraph.MONTHLY){
_201=[0,1,2,3,4,5,6,7,8,9,10,11,12];
}else{
if(_197==Dygraph.QUARTERLY){
_201=[0,3,6,9];
}else{
if(_197==Dygraph.BIANNUAL){
_201=[0,6];
}else{
if(_197==Dygraph.ANNUAL){
_201=[0];
}else{
if(_197==Dygraph.DECADAL){
_201=[0];
_202=10;
}
}
}
}
}
var _203=new Date(_195).getFullYear();
var _204=new Date(_196).getFullYear();
var _205=Dygraph.zeropad;
for(var i=_203;i<=_204;i++){
if(i%_202!=0){
continue;
}
for(var j=0;j<_201.length;j++){
var _206=i+"/"+_205(1+_201[j])+"/01";
var t=Date.parse(_206);
if(t<_195||t>_196){
continue;
}
_198.push({v:t,label:new Date(t).strftime("%b %y")});
}
}
}
return _198;
};
Dygraph.dateTicker=function(_207,_208,self){
var _209=-1;
for(var i=0;i<Dygraph.NUM_GRANULARITIES;i++){
var _210=self.NumXTicks(_207,_208,i);
if(self.width_/_210>=self.attr_("pixelsPerXLabel")){
_209=i;
break;
}
}
if(_209>=0){
return self.GetXAxis(_207,_208,_209);
}else{
}
};
Dygraph.numericTicks=function(minV,maxV,self){
if(self.attr_("labelsKMG2")){
var _213=[1,2,4,8];
}else{
var _213=[1,2,5];
}
var _214,low_val,high_val,nTicks;
var _215=self.attr_("pixelsPerYLabel");
for(var i=-10;i<50;i++){
if(self.attr_("labelsKMG2")){
var _216=Math.pow(16,i);
}else{
var _216=Math.pow(10,i);
}
for(var j=0;j<_213.length;j++){
_214=_216*_213[j];
low_val=Math.floor(minV/_214)*_214;
high_val=Math.ceil(maxV/_214)*_214;
nTicks=(high_val-low_val)/_214;
var _217=self.height_/nTicks;
if(_217>_215){
break;
}
}
if(_217>_215){
break;
}
}
var _218=[];
var k;
var _220=[];
if(self.attr_("labelsKMB")){
k=1000;
_220=["K","M","B","T"];
}
if(self.attr_("labelsKMG2")){
if(k){
self.warn("Setting both labelsKMB and labelsKMG2. Pick one!");
}
k=1024;
_220=["k","M","G","T"];
}
for(var i=0;i<nTicks;i++){
var _221=low_val+i*_214;
var _222=Math.abs(_221);
var _223=self.round_(_221,2);
if(_220.length){
var n=k*k*k*k;
for(var j=3;j>=0;j--,n/=k){
if(_222>=n){
_223=self.round_(_221/n,1)+_220[j];
break;
}
}
}
_218.push({label:_223,v:_221});
}
return _218;
};
Dygraph.prototype.addYTicks_=function(minY,maxY){
var _227=Dygraph.numericTicks(minY,maxY,this);
this.layout_.updateOptions({yAxis:[minY,maxY],yTicks:_227});
};
Dygraph.prototype.extremeValues_=function(_228){
var minY=null,maxY=null;
var bars=this.attr_("errorBars")||this.attr_("customBars");
if(bars){
for(var j=0;j<_228.length;j++){
var y=_228[j][1][0];
if(!y){
continue;
}
var low=y-_228[j][1][1];
var high=y+_228[j][1][2];
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
for(var j=0;j<_228.length;j++){
var y=_228[j][1];
if(y===null||isNaN(y)){
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
var _232=[];
for(var j=0;j<data.length;j++){
var date=data[j][0];
_232[j]=[date,data[j][i]];
}
_232=this.rollingAverage(_232,this.rollPeriod_);
var bars=this.attr_("errorBars")||this.attr_("customBars");
if(this.dateWindow_){
var low=this.dateWindow_[0];
var high=this.dateWindow_[1];
var _233=[];
for(var k=0;k<_232.length;k++){
if(_232[k][0]>=low&&_232[k][0]<=high){
_233.push(_232[k]);
}
}
_232=_233;
}
var _234=this.extremeValues_(_232);
var _235=_234[0];
var _236=_234[1];
if(!minY||_235<minY){
minY=_235;
}
if(!maxY||_236>maxY){
maxY=_236;
}
if(bars){
var vals=[];
for(var j=0;j<_232.length;j++){
vals[j]=[_232[j][0],_232[j][1][0],_232[j][1][1],_232[j][1][2]];
}
this.layout_.addDataset(this.attr_("labels")[i],vals);
}else{
this.layout_.addDataset(this.attr_("labels")[i],_232);
}
}
if(this.valueRange_!=null){
this.addYTicks_(this.valueRange_[0],this.valueRange_[1]);
}else{
var span=maxY-minY;
var _239=maxY+0.1*span;
var _240=minY-0.1*span;
if(_240<0&&minY>=0){
_240=0;
}
if(_239>0&&maxY<=0){
_239=0;
}
if(this.attr_("includeZero")){
if(maxY<0){
_239=0;
}
if(minY>0){
_240=0;
}
}
this.addYTicks_(_240,_239);
}
this.addXTicks_();
this.layout_.updateOptions({dateWindow:this.dateWindow_});
this.layout_.evaluateWithError();
this.plotter_.clear();
this.plotter_.render();
this.canvas_.getContext("2d").clearRect(0,0,this.canvas_.width,this.canvas_.height);
};
Dygraph.prototype.rollingAverage=function(_241,_242){
if(_241.length<2){
return _241;
}
var _242=Math.min(_242,_241.length-1);
var _243=[];
var _244=this.attr_("sigma");
if(this.fractions_){
var num=0;
var den=0;
var mult=100;
for(var i=0;i<_241.length;i++){
num+=_241[i][1][0];
den+=_241[i][1][1];
if(i-_242>=0){
num-=_241[i-_242][1][0];
den-=_241[i-_242][1][1];
}
var date=_241[i][0];
var _247=den?num/den:0;
if(this.attr_("errorBars")){
if(this.wilsonInterval_){
if(den){
var p=_247<0?0:_247,n=den;
var pm=_244*Math.sqrt(p*(1-p)/n+_244*_244/(4*n*n));
var _249=1+_244*_244/den;
var low=(p+_244*_244/(2*den)-pm)/_249;
var high=(p+_244*_244/(2*den)+pm)/_249;
_243[i]=[date,[p*mult,(p-low)*mult,(high-p)*mult]];
}else{
_243[i]=[date,[0,0,0]];
}
}else{
var _250=den?_244*Math.sqrt(_247*(1-_247)/den):1;
_243[i]=[date,[mult*_247,mult*_250,mult*_250]];
}
}else{
_243[i]=[date,mult*_247];
}
}
}else{
if(this.attr_("customBars")){
var low=0;
var mid=0;
var high=0;
var _252=0;
for(var i=0;i<_241.length;i++){
var data=_241[i][1];
var y=data[1];
_243[i]=[_241[i][0],[y,y-data[0],data[2]-y]];
if(y!=null&&!isNaN(y)){
low+=data[0];
mid+=y;
high+=data[2];
_252+=1;
}
if(i-_242>=0){
var prev=_241[i-_242];
if(prev[1][1]!=null&&!isNaN(prev[1][1])){
low-=prev[1][0];
mid-=prev[1][1];
high-=prev[1][2];
_252-=1;
}
}
_243[i]=[_241[i][0],[1*mid/_252,1*(mid-low)/_252,1*(high-mid)/_252]];
}
}else{
var _254=Math.min(_242-1,_241.length-2);
if(!this.attr_("errorBars")){
if(_242==1){
return _241;
}
for(var i=0;i<_241.length;i++){
var sum=0;
var _256=0;
for(var j=Math.max(0,i-_242+1);j<i+1;j++){
var y=_241[j][1];
if(y==null||isNaN(y)){
continue;
}
_256++;
sum+=_241[j][1];
}
if(_256){
_243[i]=[_241[i][0],sum/_256];
}else{
_243[i]=[_241[i][0],null];
}
}
}else{
for(var i=0;i<_241.length;i++){
var sum=0;
var _257=0;
var _256=0;
for(var j=Math.max(0,i-_242+1);j<i+1;j++){
var y=_241[j][1][0];
if(y==null||isNaN(y)){
continue;
}
_256++;
sum+=_241[j][1][0];
_257+=Math.pow(_241[j][1][1],2);
}
if(_256){
var _250=Math.sqrt(_257)/_256;
_243[i]=[_241[i][0],[sum/_256,_244*_250,_244*_250]];
}else{
_243[i]=[_241[i][0],[null,null,null]];
}
}
}
}
}
return _243;
};
Dygraph.dateParser=function(_258,self){
var _259;
var d;
if(_258.length==10&&_258.search("-")!=-1){
_259=_258.replace("-","/","g");
while(_259.search("-")!=-1){
_259=_259.replace("-","/");
}
d=Date.parse(_259);
}else{
if(_258.length==8){
_259=_258.substr(0,4)+"/"+_258.substr(4,2)+"/"+_258.substr(6,2);
d=Date.parse(_259);
}else{
d=Date.parse(_258);
}
}
if(!d||isNaN(d)){
self.error("Couldn't parse "+_258+" as a date");
}
return d;
};
Dygraph.prototype.detectTypeFromString_=function(str){
var _261=false;
if(str.indexOf("-")>=0||str.indexOf("/")>=0||isNaN(parseFloat(str))){
_261=true;
}else{
if(str.length==8&&str>"19700101"&&str<"20371231"){
_261=true;
}
}
if(_261){
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
var _262=data.split("\n");
var _263=this.attr_("delimiter");
if(_262[0].indexOf(_263)==-1&&_262[0].indexOf("\t")>=0){
_263="\t";
}
var _264=0;
if(this.labelsFromCSV_){
_264=1;
this.attrs_.labels=_262[0].split(_263);
}
var _265;
var _266=false;
var _267=this.attr_("labels").length;
for(var i=_264;i<_262.length;i++){
var line=_262[i];
if(line.length==0){
continue;
}
if(line[0]=="#"){
continue;
}
var _269=line.split(_263);
if(_269.length<2){
continue;
}
var _270=[];
if(!_266){
this.detectTypeFromString_(_269[0]);
_265=this.attr_("xValueParser");
_266=true;
}
_270[0]=_265(_269[0],this);
if(this.fractions_){
for(var j=1;j<_269.length;j++){
var vals=_269[j].split("/");
_270[j]=[parseFloat(vals[0]),parseFloat(vals[1])];
}
}else{
if(this.attr_("errorBars")){
for(var j=1;j<_269.length;j+=2){
_270[(j+1)/2]=[parseFloat(_269[j]),parseFloat(_269[j+1])];
}
}else{
if(this.attr_("customBars")){
for(var j=1;j<_269.length;j++){
var vals=_269[j].split(";");
_270[j]=[parseFloat(vals[0]),parseFloat(vals[1]),parseFloat(vals[2])];
}
}else{
for(var j=1;j<_269.length;j++){
_270[j]=parseFloat(_269[j]);
}
}
}
}
ret.push(_270);
if(_270.length!=_267){
this.error("Number of columns in line "+i+" ("+_270.length+") does not agree with number of labels ("+_267+") "+line);
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
var _271=Dygraph.clone(data);
for(var i=0;i<data.length;i++){
if(_271[i].length==0){
this.error("Row "<<(1+i)<<" of data is empty");
return null;
}
if(_271[i][0]==null||typeof (_271[i][0].getTime)!="function"){
this.error("x value in row "<<(1+i)<<" is not a Date");
return null;
}
_271[i][0]=_271[i][0].getTime();
}
return _271;
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
var _274=[];
for(var i=0;i<cols;i++){
_274.push(data.getColumnLabel(i));
if(i!=0&&this.attr_("errorBars")){
i+=1;
}
}
this.attrs_.labels=_274;
cols=_274.length;
var _275=data.getColumnType(0);
if(_275=="date"){
this.attrs_.xValueFormatter=Dygraph.dateString_;
this.attrs_.xValueParser=Dygraph.dateParser;
this.attrs_.xTicker=Dygraph.dateTicker;
}else{
if(_275=="number"){
this.attrs_.xValueFormatter=function(x){
return x;
};
this.attrs_.xValueParser=function(x){
return parseFloat(x);
};
this.attrs_.xTicker=Dygraph.numericTicks;
}else{
this.error("only 'date' and 'number' types are supported for column 1 "+"of DataTable input (Got '"+_275+"')");
return null;
}
}
var ret=[];
for(var i=0;i<rows;i++){
var row=[];
if(typeof (data.getValue(i,0))==="undefined"||data.getValue(i,0)===null){
this.warning("Ignoring row "+i+" of DataTable because of undefined or null first column.");
continue;
}
if(_275=="date"){
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
if(o.hasOwnProperty(k)){
self[k]=o[k];
}
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
var _281=this;
req.onreadystatechange=function(){
if(req.readyState==4){
if(req.status==200){
_281.loadedEvent_(req.responseText);
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
Dygraph.prototype.updateOptions=function(_282){
if(_282.rollPeriod){
this.rollPeriod_=_282.rollPeriod;
}
if(_282.dateWindow){
this.dateWindow_=_282.dateWindow;
}
if(_282.valueRange){
this.valueRange_=_282.valueRange;
}
Dygraph.update(this.user_attrs_,_282);
this.labelsFromCSV_=(this.attr_("labels")==null);
this.layout_.updateOptions({"errorBars":this.attr_("errorBars")});
if(_282["file"]&&_282["file"]!=this.file_){
this.file_=_282["file"];
this.start_();
}else{
this.drawGraph_(this.rawData_);
}
};
Dygraph.prototype.resize=function(_283,_284){
if((_283===null)!=(_284===null)){
this.warn("Dygraph.resize() should be called with zero parameters or "+"two non-NULL parameters. Pretending it was zero.");
_283=_284=null;
}
this.maindiv_.innerHTML="";
this.attrs_.labelsDiv=null;
if(_283){
this.maindiv_.style.width=_283+"px";
this.maindiv_.style.height=_284+"px";
this.width_=_283;
this.height_=_284;
}else{
this.width_=this.maindiv_.offsetWidth;
this.height_=this.maindiv_.offsetHeight;
}
this.createInterface_();
this.drawGraph_(this.rawData_);
};
Dygraph.prototype.adjustRoll=function(_285){
this.rollPeriod_=_285;
this.drawGraph_(this.rawData_);
};
Dygraph.createCanvas=function(){
var _286=document.createElement("canvas");
isIE=(/MSIE/.test(navigator.userAgent)&&!window.opera);
if(isIE){
_286=G_vmlCanvasManager.initElement(_286);
}
return _286;
};
Dygraph.GVizChart=function(_287){
this.container=_287;
};
Dygraph.GVizChart.prototype.draw=function(data,_288){
this.container.innerHTML="";
this.date_graph=new Dygraph(this.container,data,_288);
};
DateGraph=Dygraph;
function RGBColor(_289){
this.ok=false;
if(_289.charAt(0)=="#"){
_289=_289.substr(1,6);
}
_289=_289.replace(/ /g,"");
_289=_289.toLowerCase();
var _290={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"00ffff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000000",blanchedalmond:"ffebcd",blue:"0000ff",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"00ffff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dodgerblue:"1e90ff",feldspar:"d19275",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"ff00ff",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgrey:"d3d3d3",lightgreen:"90ee90",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslateblue:"8470ff",lightslategray:"778899",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"00ff00",limegreen:"32cd32",linen:"faf0e6",magenta:"ff00ff",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370d8",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"d87093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",red:"ff0000",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",violetred:"d02090",wheat:"f5deb3",white:"ffffff",whitesmoke:"f5f5f5",yellow:"ffff00",yellowgreen:"9acd32"};
for(var key in _290){
if(_289==key){
_289=_290[key];
}
}
var _292=[{re:/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,example:["rgb(123, 234, 45)","rgb(255,234,245)"],process:function(bits){
return [parseInt(bits[1]),parseInt(bits[2]),parseInt(bits[3])];
}},{re:/^(\w{2})(\w{2})(\w{2})$/,example:["#00ff00","336699"],process:function(bits){
return [parseInt(bits[1],16),parseInt(bits[2],16),parseInt(bits[3],16)];
}},{re:/^(\w{1})(\w{1})(\w{1})$/,example:["#fb0","f0f"],process:function(bits){
return [parseInt(bits[1]+bits[1],16),parseInt(bits[2]+bits[2],16),parseInt(bits[3]+bits[3],16)];
}}];
for(var i=0;i<_292.length;i++){
var re=_292[i].re;
var _295=_292[i].process;
var bits=re.exec(_289);
if(bits){
channels=_295(bits);
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

