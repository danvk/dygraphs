Date.ext={};Date.ext.util={};Date.ext.util.xPad=function(x,pad,r){if(typeof (r)=="undefined"){r=10}for(;parseInt(x,10)<r&&r>1;r/=10){x=pad.toString()+x}return x.toString()};Date.prototype.locale="en-GB";if(document.getElementsByTagName("html")&&document.getElementsByTagName("html")[0].lang){Date.prototype.locale=document.getElementsByTagName("html")[0].lang}Date.ext.locales={};Date.ext.locales.en={a:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],A:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],b:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],B:["January","February","March","April","May","June","July","August","September","October","November","December"],c:"%a %d %b %Y %T %Z",p:["AM","PM"],P:["am","pm"],x:"%d/%m/%y",X:"%T"};Date.ext.locales["en-US"]=Date.ext.locales.en;Date.ext.locales["en-US"].c="%a %d %b %Y %r %Z";Date.ext.locales["en-US"].x="%D";Date.ext.locales["en-US"].X="%r";Date.ext.locales["en-GB"]=Date.ext.locales.en;Date.ext.locales["en-AU"]=Date.ext.locales["en-GB"];Date.ext.formats={a:function(d){return Date.ext.locales[d.locale].a[d.getDay()]},A:function(d){return Date.ext.locales[d.locale].A[d.getDay()]},b:function(d){return Date.ext.locales[d.locale].b[d.getMonth()]},B:function(d){return Date.ext.locales[d.locale].B[d.getMonth()]},c:"toLocaleString",C:function(d){return Date.ext.util.xPad(parseInt(d.getFullYear()/100,10),0)},d:["getDate","0"],e:["getDate"," "],g:function(d){return Date.ext.util.xPad(parseInt(Date.ext.util.G(d)/100,10),0)},G:function(d){var y=d.getFullYear();var V=parseInt(Date.ext.formats.V(d),10);var W=parseInt(Date.ext.formats.W(d),10);if(W>V){y++}else{if(W===0&&V>=52){y--}}return y},H:["getHours","0"],I:function(d){var I=d.getHours()%12;return Date.ext.util.xPad(I===0?12:I,0)},j:function(d){var ms=d-new Date(""+d.getFullYear()+"/1/1 GMT");ms+=d.getTimezoneOffset()*60000;var doy=parseInt(ms/60000/60/24,10)+1;return Date.ext.util.xPad(doy,0,100)},m:function(d){return Date.ext.util.xPad(d.getMonth()+1,0)},M:["getMinutes","0"],p:function(d){return Date.ext.locales[d.locale].p[d.getHours()>=12?1:0]},P:function(d){return Date.ext.locales[d.locale].P[d.getHours()>=12?1:0]},S:["getSeconds","0"],u:function(d){var dow=d.getDay();return dow===0?7:dow},U:function(d){var doy=parseInt(Date.ext.formats.j(d),10);var rdow=6-d.getDay();var woy=parseInt((doy+rdow)/7,10);return Date.ext.util.xPad(woy,0)},V:function(d){var woy=parseInt(Date.ext.formats.W(d),10);var dow1_1=(new Date(""+d.getFullYear()+"/1/1")).getDay();var idow=woy+(dow1_1>4||dow1_1<=1?0:1);if(idow==53&&(new Date(""+d.getFullYear()+"/12/31")).getDay()<4){idow=1}else{if(idow===0){idow=Date.ext.formats.V(new Date(""+(d.getFullYear()-1)+"/12/31"))}}return Date.ext.util.xPad(idow,0)},w:"getDay",W:function(d){var doy=parseInt(Date.ext.formats.j(d),10);var rdow=7-Date.ext.formats.u(d);var woy=parseInt((doy+rdow)/7,10);return Date.ext.util.xPad(woy,0,10)},y:function(d){return Date.ext.util.xPad(d.getFullYear()%100,0)},Y:"getFullYear",z:function(d){var o=d.getTimezoneOffset();var H=Date.ext.util.xPad(parseInt(Math.abs(o/60),10),0);var M=Date.ext.util.xPad(o%60,0);return(o>0?"-":"+")+H+M},Z:function(d){return d.toString().replace(/^.*\(([^)]+)\)$/,"$1")},"%":function(d){return"%"}};Date.ext.aggregates={c:"locale",D:"%m/%d/%y",h:"%b",n:"\n",r:"%I:%M:%S %p",R:"%H:%M",t:"\t",T:"%H:%M:%S",x:"locale",X:"locale"};Date.ext.aggregates.z=Date.ext.formats.z(new Date());Date.ext.aggregates.Z=Date.ext.formats.Z(new Date());Date.ext.unsupported={};Date.prototype.strftime=function(fmt){if(!(this.locale in Date.ext.locales)){if(this.locale.replace(/-[a-zA-Z]+$/,"") in Date.ext.locales){this.locale=this.locale.replace(/-[a-zA-Z]+$/,"")}else{this.locale="en-GB"}}var d=this;while(fmt.match(/%[cDhnrRtTxXzZ]/)){fmt=fmt.replace(/%([cDhnrRtTxXzZ])/g,function(m0,m1){var f=Date.ext.aggregates[m1];return(f=="locale"?Date.ext.locales[d.locale][m1]:f)})}var str=fmt.replace(/%([aAbBCdegGHIjmMpPSuUVwWyY%])/g,function(m0,m1){var f=Date.ext.formats[m1];if(typeof (f)=="string"){return d[f]()}else{if(typeof (f)=="function"){return f.call(d,d)}else{if(typeof (f)=="object"&&typeof (f[0])=="string"){return Date.ext.util.xPad(d[f[0]](),f[1])}else{return m1}}}});d=null;return str};
DygraphLayout=function(_1,_2){
this.dygraph_=_1;
this.options={};
MochiKit.Base.update(this.options,_2?_2:{});
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
MochiKit.Base.update(this.options,_24?_24:{});
};
DygraphCanvasRenderer=function(_25,_26,_27,_28){
this.dygraph_=_25;
this.options={"strokeWidth":0.5,"drawXAxis":true,"drawYAxis":true,"axisLineColor":"black","axisLineWidth":0.5,"axisTickSize":3,"axisLabelColor":"black","axisLabelFont":"Arial","axisLabelFontSize":9,"axisLabelWidth":50,"drawYGrid":true,"drawXGrid":true,"gridLineColor":"rgb(128,128,128)"};
MochiKit.Base.update(this.options,_28);
this.layout=_27;
this.element=_26;
this.container=this.element.parentNode;
this.isIE=(/MSIE/.test(navigator.userAgent)&&!window.opera);
if(this.isIE&&!isNil(G_vmlCanvasManager)){
this.IEDelay=0.5;
this.maxTries=5;
this.renderDelay=null;
this.clearDelay=null;
this.element=G_vmlCanvasManager.initElement(this.element);
}
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
if(MochiKit.Base.isUndefinedOrNull(_31)){
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
var _56=MochiKit.Base.keys(this.layout.datasets);
var _57=this.layout.options.errorBars;
var _58=_56.length;
var _59=MochiKit.Base.bind;
var _60=MochiKit.Base.partial;
for(var i=0;i<this.layout.points.length;i++){
var _61=this.layout.points[i];
_61.canvasx=this.area.w*_61.x+this.area.x;
_61.canvasy=this.area.h*_61.y+this.area.y;
}
var _62=function(x){
return x&&!isNaN(x);
};
var _63=function(ctx){
for(var i=0;i<_58;i++){
var _64=_56[i];
var _65=_55[i%_54];
_53.save();
var _61=this.layout.points[0];
var _66=this.dygraph_.attr_("pointSize");
var _67=null,prevY=null;
var _68=this.dygraph_.attr_("drawPoints");
var _69=this.layout.points;
for(var j=0;j<_69.length;j++){
var _61=_69[j];
if(_61.name==_64){
if(!_62(_61.canvasy)){
_67=prevY=null;
}else{
var _70=(!_67&&(j==_69.length-1||!_62(_69[j+1].canvasy)));
if(!_67){
_67=_61.canvasx;
prevY=_61.canvasy;
}else{
ctx.beginPath();
ctx.strokeStyle=_65;
ctx.lineWidth=this.options.strokeWidth;
ctx.moveTo(_67,prevY);
_67=_61.canvasx;
prevY=_61.canvasy;
ctx.lineTo(_67,prevY);
ctx.stroke();
}
if(_68||_70){
ctx.beginPath();
ctx.fillStyle=_65;
ctx.arc(_61.canvasx,_61.canvasy,_66,0,360,false);
ctx.fill();
}
}
}
}
}
};
var _71=function(ctx){
for(var i=0;i<_58;i++){
var _72=_56[i];
var _73=_55[i%_54];
_53.save();
_53.strokeStyle=_73;
_53.lineWidth=this.options.strokeWidth;
var _74=-1;
var _75=[-1,-1];
var _76=0;
var _77=this.layout.yscale;
var rgb=new RGBColor(_73);
var _79="rgba("+rgb.r+","+rgb.g+","+rgb.b+",0.15)";
ctx.fillStyle=_79;
ctx.beginPath();
for(var j=0;j<this.layout.points.length;j++){
var _80=this.layout.points[j];
_76++;
if(_80.name==_72){
if(!_80.y||isNaN(_80.y)){
_74=-1;
return;
}
var _81=[_80.y-_80.errorPlus*_77,_80.y+_80.errorMinus*_77];
_81[0]=this.area.h*_81[0]+this.area.y;
_81[1]=this.area.h*_81[1]+this.area.y;
if(_74>=0){
ctx.moveTo(_74,_75[0]);
ctx.lineTo(_80.canvasx,_81[0]);
ctx.lineTo(_80.canvasx,_81[1]);
ctx.lineTo(_74,_75[1]);
ctx.closePath();
}
_75[0]=_81[0];
_75[1]=_81[1];
_74=_80.canvasx;
}
}
ctx.fill();
}
};
if(_57){
_59(_71,this)(_53);
}
_59(_63,this)(_53);
_53.restore();
};
Dygraph=function(div,_82,_83){
if(arguments.length>0){
if(arguments.length==4){
this.warn("Using deprecated four-argument dygraph constructor");
this.__old_init__(div,_82,arguments[2],arguments[3]);
}else{
this.__init__(div,_82,_83);
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
Dygraph.DEFAULT_ATTRS={highlightCircleSize:3,pixelsPerXLabel:60,pixelsPerYLabel:30,labelsDivWidth:250,labelsDivStyles:{},labelsSeparateLines:false,labelsKMB:false,strokeWidth:1,axisTickSize:3,axisLabelFontSize:14,xAxisLabelWidth:50,yAxisLabelWidth:50,rightGap:5,showRoller:false,xValueFormatter:Dygraph.dateString_,xValueParser:Dygraph.dateParser,xTicker:Dygraph.dateTicker,sigma:2,errorBars:false,fractions:false,wilsonInterval:true,customBars:false};
Dygraph.DEBUG=1;
Dygraph.INFO=2;
Dygraph.WARNING=3;
Dygraph.ERROR=3;
Dygraph.prototype.__old_init__=function(div,_84,_85,_86){
if(_85!=null){
var _87=["Date"];
for(var i=0;i<_85.length;i++){
_87.push(_85[i]);
}
MochiKit.Base.update(_86,{"labels":_87});
}
this.__init__(div,_84,_86);
};
Dygraph.prototype.__init__=function(div,_88,_89){
if(_89==null){
_89={};
}
this.maindiv_=div;
this.file_=_88;
this.rollPeriod_=_89.rollPeriod||Dygraph.DEFAULT_ROLL_PERIOD;
this.previousVerticalX_=-1;
this.fractions_=_89.fractions||false;
this.dateWindow_=_89.dateWindow||null;
this.valueRange_=_89.valueRange||null;
this.wilsonInterval_=_89.wilsonInterval||true;
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
MochiKit.Base.update(this.user_attrs_,_89);
this.attrs_={};
MochiKit.Base.update(this.attrs_,Dygraph.DEFAULT_ATTRS);
this.labelsFromCSV_=(this.attr_("labels")==null);
this.createInterface_();
this.layoutOptions_={"errorBars":(this.attr_("errorBars")||this.attr_("customBars")),"xOriginIsZero":false};
MochiKit.Base.update(this.layoutOptions_,this.attrs_);
MochiKit.Base.update(this.layoutOptions_,this.user_attrs_);
this.layout_=new DygraphLayout(this,this.layoutOptions_);
this.renderOptions_={colorScheme:this.colors_,strokeColor:null,axisLineWidth:Dygraph.AXIS_LINE_WIDTH};
MochiKit.Base.update(this.renderOptions_,this.attrs_);
MochiKit.Base.update(this.renderOptions_,this.user_attrs_);
this.plotter_=new DygraphCanvasRenderer(this,this.hidden_,this.layout_,this.renderOptions_);
this.createStatusMessage_();
this.createRollInterface_();
this.createDragInterface_();
this.start_();
};
Dygraph.prototype.attr_=function(_90){
if(typeof (this.user_attrs_[_90])!="undefined"){
return this.user_attrs_[_90];
}else{
if(typeof (this.attrs_[_90])!="undefined"){
return this.attrs_[_90];
}else{
return null;
}
}
};
Dygraph.prototype.log=function(_91,_92){
if(typeof (console)!="undefined"){
switch(_91){
case Dygraph.DEBUG:
console.debug("dygraphs: "+_92);
break;
case Dygraph.INFO:
console.info("dygraphs: "+_92);
break;
case Dygraph.WARNING:
console.warn("dygraphs: "+_92);
break;
case Dygraph.ERROR:
console.error("dygraphs: "+_92);
break;
}
}
};
Dygraph.prototype.info=function(_93){
this.log(Dygraph.INFO,_93);
};
Dygraph.prototype.warn=function(_94){
this.log(Dygraph.WARNING,_94);
};
Dygraph.prototype.error=function(_95){
this.log(Dygraph.ERROR,_95);
};
Dygraph.prototype.rollPeriod=function(){
return this.rollPeriod_;
};
Dygraph.addEvent=function(el,evt,fn){
var _98=function(e){
if(!e){
var e=window.event;
}
fn(e);
};
if(window.addEventListener){
el.addEventListener(evt,_98,false);
}else{
el.attachEvent("on"+evt,_98);
}
};
Dygraph.prototype.createInterface_=function(){
var _100=this.maindiv_;
this.graphDiv=document.createElement("div");
this.graphDiv.style.width=this.width_+"px";
this.graphDiv.style.height=this.height_+"px";
_100.appendChild(this.graphDiv);
this.canvas_=document.createElement("canvas");
this.canvas_.style.position="absolute";
this.canvas_.width=this.width_;
this.canvas_.height=this.height_;
this.graphDiv.appendChild(this.canvas_);
this.hidden_=this.createPlotKitCanvas_(this.canvas_);
var _101=this;
Dygraph.addEvent(this.hidden_,"mousemove",function(e){
_101.mouseMove_(e);
});
Dygraph.addEvent(this.hidden_,"mouseout",function(e){
_101.mouseOut_(e);
});
};
Dygraph.prototype.createPlotKitCanvas_=function(_102){
var h=document.createElement("canvas");
h.style.position="absolute";
h.style.top=_102.style.top;
h.style.left=_102.style.left;
h.width=this.width_;
h.height=this.height_;
this.graphDiv.appendChild(h);
return h;
};
Dygraph.hsvToRGB=function(hue,_105,_106){
var red;
var _108;
var blue;
if(_105===0){
red=_106;
_108=_106;
blue=_106;
}else{
var i=Math.floor(hue*6);
var f=(hue*6)-i;
var p=_106*(1-_105);
var q=_106*(1-(_105*f));
var t=_106*(1-(_105*(1-f)));
switch(i){
case 1:
red=q;
_108=_106;
blue=p;
break;
case 2:
red=p;
_108=_106;
blue=t;
break;
case 3:
red=p;
_108=q;
blue=_106;
break;
case 4:
red=t;
_108=p;
blue=_106;
break;
case 5:
red=_106;
_108=p;
blue=q;
break;
case 6:
case 0:
red=_106;
_108=t;
blue=p;
break;
}
}
red=Math.floor(255*red+0.5);
_108=Math.floor(255*_108+0.5);
blue=Math.floor(255*blue+0.5);
return "rgb("+red+","+_108+","+blue+")";
};
Dygraph.prototype.setColors_=function(){
var num=this.attr_("labels").length-1;
this.colors_=[];
var _115=this.attr_("colors");
if(!_115){
var sat=this.attr_("colorSaturation")||1;
var val=this.attr_("colorValue")||0.5;
for(var i=1;i<=num;i++){
var hue=(1*i/(1+num));
this.colors_.push(Dygraph.hsvToRGB(hue,sat,val));
}
}else{
for(var i=0;i<num;i++){
var _118=_115[i%_115.length];
this.colors_.push(_118);
}
}
this.renderOptions_.colorScheme=this.colors_;
MochiKit.Base.update(this.plotter_.options,this.renderOptions_);
MochiKit.Base.update(this.layoutOptions_,this.user_attrs_);
MochiKit.Base.update(this.layoutOptions_,this.attrs_);
};
Dygraph.findPosX=function(obj){
var _120=0;
if(obj.offsetParent){
while(obj.offsetParent){
_120+=obj.offsetLeft;
obj=obj.offsetParent;
}
}else{
if(obj.x){
_120+=obj.x;
}
}
return _120;
};
Dygraph.findPosY=function(obj){
var _121=0;
if(obj.offsetParent){
while(obj.offsetParent){
_121+=obj.offsetTop;
obj=obj.offsetParent;
}
}else{
if(obj.y){
_121+=obj.y;
}
}
return _121;
};
Dygraph.prototype.createStatusMessage_=function(){
if(!this.attr_("labelsDiv")){
var _122=this.attr_("labelsDivWidth");
var _123={"position":"absolute","fontSize":"14px","zIndex":10,"width":_122+"px","top":"0px","left":(this.width_-_122-2)+"px","background":"white","textAlign":"left","overflow":"hidden"};
MochiKit.Base.update(_123,this.attr_("labelsDivStyles"));
var div=document.createElement("div");
for(var name in _123){
div.style[name]=_123[name];
}
this.graphDiv.appendChild(div);
this.attrs_.labelsDiv=div;
}
};
Dygraph.prototype.createRollInterface_=function(){
var _125=this.attr_("showRoller")?"block":"none";
var _126={"position":"absolute","zIndex":10,"top":(this.plotter_.area.h-25)+"px","left":(this.plotter_.area.x+1)+"px","display":_125};
var _127=document.createElement("input");
_127.type="text";
_127.size="2";
_127.value=this.rollPeriod_;
for(var name in _126){
_127.style[name]=_126[name];
}
var pa=this.graphDiv;
pa.appendChild(_127);
var _129=this;
_127.onchange=function(){
_129.adjustRoll(_127.value);
};
return _127;
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
var _133=false;
var _134=null;
var _135=null;
var _136=null;
var _137=null;
var _138=null;
var px=0;
var py=0;
var getX=function(e){
return Dygraph.pageX(e)-px;
};
var getY=function(e){
return Dygraph.pageX(e)-py;
};
Dygraph.addEvent(this.hidden_,"mousemove",function(_143){
if(_133){
_136=getX(_143);
_137=getY(_143);
self.drawZoomRect_(_134,_136,_138);
_138=_136;
}
});
Dygraph.addEvent(this.hidden_,"mousedown",function(_144){
_133=true;
px=Dygraph.findPosX(self.canvas_);
py=Dygraph.findPosY(self.canvas_);
_134=getX(_144);
_135=getY(_144);
});
Dygraph.addEvent(document,"mouseup",function(_145){
if(_133){
_133=false;
_134=null;
_135=null;
}
});
Dygraph.addEvent(this.hidden_,"mouseout",function(_146){
if(_133){
_136=null;
_137=null;
}
});
Dygraph.addEvent(this.hidden_,"mouseup",function(_147){
if(_133){
_133=false;
_136=getX(_147);
_137=getY(_147);
var _148=Math.abs(_136-_134);
var _149=Math.abs(_137-_135);
if(_148<2&&_149<2&&self.attr_("clickCallback")!=null&&self.lastx_!=undefined){
self.attr_("clickCallback")(_147,new Date(self.lastx_));
}
if(_148>=10){
self.doZoom_(Math.min(_134,_136),Math.max(_134,_136));
}else{
self.canvas_.getContext("2d").clearRect(0,0,self.canvas_.width,self.canvas_.height);
}
_134=null;
_135=null;
}
});
Dygraph.addEvent(this.hidden_,"dblclick",function(_150){
self.dateWindow_=null;
self.drawGraph_(self.rawData_);
var _151=self.rawData_[0][0];
var _152=self.rawData_[self.rawData_.length-1][0];
if(self.attr_("zoomCallback")){
self.attr_("zoomCallback")(_151,_152);
}
});
};
Dygraph.prototype.drawZoomRect_=function(_153,endX,_155){
var ctx=this.canvas_.getContext("2d");
if(_155){
ctx.clearRect(Math.min(_153,_155),0,Math.abs(_153-_155),this.height_);
}
if(endX&&_153){
ctx.fillStyle="rgba(128,128,128,0.33)";
ctx.fillRect(Math.min(_153,endX),0,Math.abs(endX-_153),this.height_);
}
};
Dygraph.prototype.doZoom_=function(lowX,_157){
var _158=this.layout_.points;
var _159=null;
var _160=null;
for(var i=0;i<_158.length;i++){
var cx=_158[i].canvasx;
var x=_158[i].xval;
if(cx<lowX&&(_159==null||x>_159)){
_159=x;
}
if(cx>_157&&(_160==null||x<_160)){
_160=x;
}
}
if(_159==null){
_159=_158[0].xval;
}
if(_160==null){
_160=_158[_158.length-1].xval;
}
this.dateWindow_=[_159,_160];
this.drawGraph_(this.rawData_);
if(this.attr_("zoomCallback")){
this.attr_("zoomCallback")(_159,_160);
}
};
Dygraph.prototype.mouseMove_=function(_162){
var _163=Dygraph.pageX(_162)-Dygraph.findPosX(this.hidden_);
var _164=this.layout_.points;
var _165=-1;
var _166=-1;
var _167=1e+100;
var idx=-1;
for(var i=0;i<_164.length;i++){
var dist=Math.abs(_164[i].canvasx-_163);
if(dist>_167){
break;
}
_167=dist;
idx=i;
}
if(idx>=0){
_165=_164[idx].xval;
}
if(_163>_164[_164.length-1].canvasx){
_165=_164[_164.length-1].xval;
}
var _170=[];
for(var i=0;i<_164.length;i++){
if(_164[i].xval==_165){
_170.push(_164[i]);
}
}
var _171=this.attr_("highlightCircleSize");
var ctx=this.canvas_.getContext("2d");
if(this.previousVerticalX_>=0){
var px=this.previousVerticalX_;
ctx.clearRect(px-_171-1,0,2*_171+2,this.height_);
}
var isOK=function(x){
return x&&!isNaN(x);
};
if(_170.length>0){
var _163=_170[0].canvasx;
var _173=this.attr_("xValueFormatter")(_165,this)+":";
var clen=this.colors_.length;
for(var i=0;i<_170.length;i++){
if(!isOK(_170[i].canvasy)){
continue;
}
if(this.attr_("labelsSeparateLines")){
_173+="<br/>";
}
var _175=_170[i];
var c=new RGBColor(this.colors_[i%clen]);
_173+=" <b><font color='"+c.toHex()+"'>"+_175.name+"</font></b>:"+this.round_(_175.yval,2);
}
this.attr_("labelsDiv").innerHTML=_173;
this.lastx_=_165;
ctx.save();
for(var i=0;i<_170.length;i++){
if(!isOK(_170[i%clen].canvasy)){
continue;
}
ctx.beginPath();
ctx.fillStyle=this.colors_[i%clen];
ctx.arc(_163,_170[i%clen].canvasy,_171,0,360,false);
ctx.fill();
}
ctx.restore();
this.previousVerticalX_=_163;
}
};
Dygraph.prototype.mouseOut_=function(_177){
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
var _179=Dygraph.zeropad;
var d=new Date(date);
if(d.getSeconds()){
return _179(d.getHours())+":"+_179(d.getMinutes())+":"+_179(d.getSeconds());
}else{
if(d.getMinutes()){
return _179(d.getHours())+":"+_179(d.getMinutes());
}else{
return _179(d.getHours());
}
}
};
Dygraph.dateString_=function(date,self){
var _181=Dygraph.zeropad;
var d=new Date(date);
var year=""+d.getFullYear();
var _183=_181(d.getMonth()+1);
var day=_181(d.getDate());
var ret="";
var frac=d.getHours()*3600+d.getMinutes()*60+d.getSeconds();
if(frac){
ret=" "+self.hmsString_(date);
}
return year+"/"+_183+"/"+day+ret;
};
Dygraph.prototype.round_=function(num,_187){
var _188=Math.pow(10,_187);
return Math.round(num*_188)/_188;
};
Dygraph.prototype.loadedEvent_=function(data){
this.rawData_=this.parseCSV_(data);
this.drawGraph_(this.rawData_);
};
Dygraph.prototype.months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
Dygraph.prototype.quarters=["Jan","Apr","Jul","Oct"];
Dygraph.prototype.addXTicks_=function(){
var _190,endDate;
if(this.dateWindow_){
_190=this.dateWindow_[0];
endDate=this.dateWindow_[1];
}else{
_190=this.rawData_[0][0];
endDate=this.rawData_[this.rawData_.length-1][0];
}
var _191=this.attr_("xTicker")(_190,endDate,this);
this.layout_.updateOptions({xTicks:_191});
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
Dygraph.prototype.NumXTicks=function(_192,_193,_194){
if(_194<Dygraph.MONTHLY){
var _195=Dygraph.SHORT_SPACINGS[_194];
return Math.floor(0.5+1*(_193-_192)/_195);
}else{
var _196=1;
var _197=12;
if(_194==Dygraph.QUARTERLY){
_197=3;
}
if(_194==Dygraph.BIANNUAL){
_197=2;
}
if(_194==Dygraph.ANNUAL){
_197=1;
}
if(_194==Dygraph.DECADAL){
_197=1;
_196=10;
}
var _198=365.2524*24*3600*1000;
var _199=1*(_193-_192)/_198;
return Math.floor(0.5+1*_199*_197/_196);
}
};
Dygraph.prototype.GetXAxis=function(_200,_201,_202){
var _203=[];
if(_202<Dygraph.MONTHLY){
var _204=Dygraph.SHORT_SPACINGS[_202];
var _205="%d%b";
if(_202<Dygraph.HOURLY){
_200=_204*Math.floor(0.5+_200/_204);
}
for(var t=_200;t<=_201;t+=_204){
var d=new Date(t);
var frac=d.getHours()*3600+d.getMinutes()*60+d.getSeconds();
if(frac==0||_202>=Dygraph.DAILY){
_203.push({v:t,label:new Date(t+3600*1000).strftime(_205)});
}else{
_203.push({v:t,label:this.hmsString_(t)});
}
}
}else{
var _206;
var _207=1;
if(_202==Dygraph.MONTHLY){
_206=[0,1,2,3,4,5,6,7,8,9,10,11,12];
}else{
if(_202==Dygraph.QUARTERLY){
_206=[0,3,6,9];
}else{
if(_202==Dygraph.BIANNUAL){
_206=[0,6];
}else{
if(_202==Dygraph.ANNUAL){
_206=[0];
}else{
if(_202==Dygraph.DECADAL){
_206=[0];
_207=10;
}
}
}
}
}
var _208=new Date(_200).getFullYear();
var _209=new Date(_201).getFullYear();
var _210=Dygraph.zeropad;
for(var i=_208;i<=_209;i++){
if(i%_207!=0){
continue;
}
for(var j=0;j<_206.length;j++){
var _211=i+"/"+_210(1+_206[j])+"/01";
var t=Date.parse(_211);
if(t<_200||t>_201){
continue;
}
_203.push({v:t,label:new Date(t).strftime("%b %y")});
}
}
}
return _203;
};
Dygraph.dateTicker=function(_212,_213,self){
var _214=-1;
for(var i=0;i<Dygraph.NUM_GRANULARITIES;i++){
var _215=self.NumXTicks(_212,_213,i);
if(self.width_/_215>=self.attr_("pixelsPerXLabel")){
_214=i;
break;
}
}
if(_214>=0){
return self.GetXAxis(_212,_213,_214);
}else{
}
};
Dygraph.numericTicks=function(minV,maxV,self){
var _218=[1,2,5];
var _219,low_val,high_val,nTicks;
var _220=self.attr_("pixelsPerYLabel");
for(var i=-10;i<50;i++){
var _221=Math.pow(10,i);
for(var j=0;j<_218.length;j++){
_219=_221*_218[j];
low_val=Math.floor(minV/_219)*_219;
high_val=Math.ceil(maxV/_219)*_219;
nTicks=(high_val-low_val)/_219;
var _222=self.height_/nTicks;
if(_222>_220){
break;
}
}
if(_222>_220){
break;
}
}
var _223=[];
for(var i=0;i<nTicks;i++){
var _224=low_val+i*_219;
var _225=self.round_(_224,2);
if(self.attr_("labelsKMB")){
var k=1000;
if(_224>=k*k*k){
_225=self.round_(_224/(k*k*k),1)+"B";
}else{
if(_224>=k*k){
_225=self.round_(_224/(k*k),1)+"M";
}else{
if(_224>=k){
_225=self.round_(_224/k,1)+"K";
}
}
}
}
_223.push({label:_225,v:_224});
}
return _223;
};
Dygraph.prototype.addYTicks_=function(minY,maxY){
var _229=Dygraph.numericTicks(minY,maxY,this);
this.layout_.updateOptions({yAxis:[minY,maxY],yTicks:_229});
};
Dygraph.prototype.extremeValues_=function(_230){
var minY=null,maxY=null;
var bars=this.attr_("errorBars")||this.attr_("customBars");
if(bars){
for(var j=0;j<_230.length;j++){
var y=_230[j][1][0];
if(!y){
continue;
}
var low=y-_230[j][1][1];
var high=y+_230[j][1][2];
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
for(var j=0;j<_230.length;j++){
var y=_230[j][1];
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
var _234=[];
for(var j=0;j<data.length;j++){
var date=data[j][0];
_234[j]=[date,data[j][i]];
}
_234=this.rollingAverage(_234,this.rollPeriod_);
var bars=this.attr_("errorBars")||this.attr_("customBars");
if(this.dateWindow_){
var low=this.dateWindow_[0];
var high=this.dateWindow_[1];
var _235=[];
for(var k=0;k<_234.length;k++){
if(_234[k][0]>=low&&_234[k][0]<=high){
_235.push(_234[k]);
}
}
_234=_235;
}
var _236=this.extremeValues_(_234);
var _237=_236[0];
var _238=_236[1];
if(!minY||_237<minY){
minY=_237;
}
if(!maxY||_238>maxY){
maxY=_238;
}
if(bars){
var vals=[];
for(var j=0;j<_234.length;j++){
vals[j]=[_234[j][0],_234[j][1][0],_234[j][1][1],_234[j][1][2]];
}
this.layout_.addDataset(this.attr_("labels")[i],vals);
}else{
this.layout_.addDataset(this.attr_("labels")[i],_234);
}
}
if(this.valueRange_!=null){
this.addYTicks_(this.valueRange_[0],this.valueRange_[1]);
}else{
var span=maxY-minY;
var _241=maxY+0.1*span;
var _242=minY-0.1*span;
if(_242<0&&minY>=0){
_242=0;
}
if(_241>0&&maxY<=0){
_241=0;
}
if(this.attr_("includeZero")){
if(maxY<0){
_241=0;
}
if(minY>0){
_242=0;
}
}
this.addYTicks_(_242,_241);
}
this.addXTicks_();
this.layout_.evaluateWithError();
this.plotter_.clear();
this.plotter_.render();
this.canvas_.getContext("2d").clearRect(0,0,this.canvas_.width,this.canvas_.height);
};
Dygraph.prototype.rollingAverage=function(_243,_244){
if(_243.length<2){
return _243;
}
var _244=Math.min(_244,_243.length-1);
var _245=[];
var _246=this.attr_("sigma");
if(this.fractions_){
var num=0;
var den=0;
var mult=100;
for(var i=0;i<_243.length;i++){
num+=_243[i][1][0];
den+=_243[i][1][1];
if(i-_244>=0){
num-=_243[i-_244][1][0];
den-=_243[i-_244][1][1];
}
var date=_243[i][0];
var _249=den?num/den:0;
if(this.attr_("errorBars")){
if(this.wilsonInterval_){
if(den){
var p=_249<0?0:_249,n=den;
var pm=_246*Math.sqrt(p*(1-p)/n+_246*_246/(4*n*n));
var _251=1+_246*_246/den;
var low=(p+_246*_246/(2*den)-pm)/_251;
var high=(p+_246*_246/(2*den)+pm)/_251;
_245[i]=[date,[p*mult,(p-low)*mult,(high-p)*mult]];
}else{
_245[i]=[date,[0,0,0]];
}
}else{
var _252=den?_246*Math.sqrt(_249*(1-_249)/den):1;
_245[i]=[date,[mult*_249,mult*_252,mult*_252]];
}
}else{
_245[i]=[date,mult*_249];
}
}
}else{
if(this.attr_("customBars")){
var low=0;
var mid=0;
var high=0;
var _254=0;
for(var i=0;i<_243.length;i++){
var data=_243[i][1];
var y=data[1];
_245[i]=[_243[i][0],[y,y-data[0],data[2]-y]];
low+=data[0];
mid+=y;
high+=data[2];
_254+=1;
if(i-_244>=0){
var prev=_243[i-_244];
low-=prev[1][0];
mid-=prev[1][1];
high-=prev[1][2];
_254-=1;
}
_245[i]=[_243[i][0],[1*mid/_254,1*(mid-low)/_254,1*(high-mid)/_254]];
}
}else{
var _256=Math.min(_244-1,_243.length-2);
if(!this.attr_("errorBars")){
if(_244==1){
return _243;
}
for(var i=0;i<_243.length;i++){
var sum=0;
var _258=0;
for(var j=Math.max(0,i-_244+1);j<i+1;j++){
var y=_243[j][1];
if(!y||isNaN(y)){
continue;
}
_258++;
sum+=_243[j][1];
}
if(_258){
_245[i]=[_243[i][0],sum/_258];
}else{
_245[i]=[_243[i][0],null];
}
}
}else{
for(var i=0;i<_243.length;i++){
var sum=0;
var _259=0;
var _258=0;
for(var j=Math.max(0,i-_244+1);j<i+1;j++){
var y=_243[j][1][0];
if(!y||isNaN(y)){
continue;
}
_258++;
sum+=_243[j][1][0];
_259+=Math.pow(_243[j][1][1],2);
}
if(_258){
var _252=Math.sqrt(_259)/_258;
_245[i]=[_243[i][0],[sum/_258,_246*_252,_246*_252]];
}else{
_245[i]=[_243[i][0],[null,null,null]];
}
}
}
}
}
return _245;
};
Dygraph.dateParser=function(_260,self){
var _261;
var d;
if(_260.length==10&&_260.search("-")!=-1){
_261=_260.replace("-","/","g");
while(_261.search("-")!=-1){
_261=_261.replace("-","/");
}
d=Date.parse(_261);
}else{
if(_260.length==8){
_261=_260.substr(0,4)+"/"+_260.substr(4,2)+"/"+_260.substr(6,2);
d=Date.parse(_261);
}else{
d=Date.parse(_260);
}
}
if(!d||isNaN(d)){
self.error("Couldn't parse "+_260+" as a date");
}
return d;
};
Dygraph.prototype.detectTypeFromString_=function(str){
var _263=false;
if(str.indexOf("-")>=0||str.indexOf("/")>=0||isNaN(parseFloat(str))){
_263=true;
}else{
if(str.length==8&&str>"19700101"&&str<"20371231"){
_263=true;
}
}
if(_263){
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
var _264=data.split("\n");
var _265=0;
if(this.labelsFromCSV_){
_265=1;
this.attrs_.labels=_264[0].split(",");
}
var _266;
var _267=false;
var _268=this.attr_("labels").length;
for(var i=_265;i<_264.length;i++){
var line=_264[i];
if(line.length==0){
continue;
}
var _270=line.split(",");
if(_270.length<2){
continue;
}
var _271=[];
if(!_267){
this.detectTypeFromString_(_270[0]);
_266=this.attr_("xValueParser");
_267=true;
}
_271[0]=_266(_270[0],this);
if(this.fractions_){
for(var j=1;j<_270.length;j++){
var vals=_270[j].split("/");
_271[j]=[parseFloat(vals[0]),parseFloat(vals[1])];
}
}else{
if(this.attr_("errorBars")){
for(var j=1;j<_270.length;j+=2){
_271[(j+1)/2]=[parseFloat(_270[j]),parseFloat(_270[j+1])];
}
}else{
if(this.attr_("customBars")){
for(var j=1;j<_270.length;j++){
var vals=_270[j].split(";");
_271[j]=[parseFloat(vals[0]),parseFloat(vals[1]),parseFloat(vals[2])];
}
}else{
for(var j=1;j<_270.length;j++){
_271[j]=parseFloat(_270[j]);
}
}
}
}
ret.push(_271);
if(_271.length!=_268){
this.error("Number of columns in line "+i+" ("+_271.length+") does not agree with number of labels ("+_268+") "+line);
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
if(MochiKit.Base.isDateLike(data[0][0])){
this.attrs_.xValueFormatter=Dygraph.dateString_;
this.attrs_.xTicker=Dygraph.dateTicker;
var _272=MochiKit.Base.clone(data);
for(var i=0;i<data.length;i++){
if(_272[i].length==0){
this.error("Row "<<(1+i)<<" of data is empty");
return null;
}
if(_272[i][0]==null||typeof (_272[i][0].getTime)!="function"){
this.error("x value in row "<<(1+i)<<" is not a Date");
return null;
}
_272[i][0]=_272[i][0].getTime();
}
return _272;
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
var _275=[];
for(var i=0;i<cols;i++){
_275.push(data.getColumnLabel(i));
}
this.attrs_.labels=_275;
var _276=data.getColumnType(0);
if(_276=="date"){
this.attrs_.xValueFormatter=Dygraph.dateString_;
this.attrs_.xValueParser=Dygraph.dateParser;
this.attrs_.xTicker=Dygraph.dateTicker;
}else{
if(_276=="number"){
this.attrs_.xValueFormatter=function(x){
return x;
};
this.attrs_.xValueParser=function(x){
return parseFloat(x);
};
this.attrs_.xTicker=Dygraph.numericTicks;
}else{
this.error("only 'date' and 'number' types are supported for column 1 "+"of DataTable input (Got '"+_276+"')");
return null;
}
}
var ret=[];
for(var i=0;i<rows;i++){
var row=[];
if(!data.getValue(i,0)){
continue;
}
if(_276=="date"){
row.push(data.getValue(i,0).getTime());
}else{
row.push(data.getValue(i,0));
}
for(var j=1;j<cols;j++){
row.push(data.getValue(i,j));
}
ret.push(row);
}
return ret;
};
Dygraph.prototype.start_=function(){
if(typeof this.file_=="function"){
this.loadedEvent_(this.file_());
}else{
if(MochiKit.Base.isArrayLike(this.file_)){
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
var _279=this;
req.onreadystatechange=function(){
if(req.readyState==4){
if(req.status==200){
_279.loadedEvent_(req.responseText);
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
Dygraph.prototype.updateOptions=function(_280){
if(_280.rollPeriod){
this.rollPeriod_=_280.rollPeriod;
}
if(_280.dateWindow){
this.dateWindow_=_280.dateWindow;
}
if(_280.valueRange){
this.valueRange_=_280.valueRange;
}
MochiKit.Base.update(this.user_attrs_,_280);
this.labelsFromCSV_=(this.attr_("labels")==null);
this.layout_.updateOptions({"errorBars":this.attr_("errorBars")});
if(_280["file"]&&_280["file"]!=this.file_){
this.file_=_280["file"];
this.start_();
}else{
this.drawGraph_(this.rawData_);
}
};
Dygraph.prototype.adjustRoll=function(_281){
this.rollPeriod_=_281;
this.drawGraph_(this.rawData_);
};
Dygraph.GVizChart=function(_282){
this.container=_282;
};
Dygraph.GVizChart.prototype.draw=function(data,_283){
this.container.innerHTML="";
this.date_graph=new Dygraph(this.container,data,_283);
};
DateGraph=Dygraph;
function RGBColor(_284){
this.ok=false;
if(_284.charAt(0)=="#"){
_284=_284.substr(1,6);
}
_284=_284.replace(/ /g,"");
_284=_284.toLowerCase();
var _285={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"00ffff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000000",blanchedalmond:"ffebcd",blue:"0000ff",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"00ffff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dodgerblue:"1e90ff",feldspar:"d19275",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"ff00ff",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgrey:"d3d3d3",lightgreen:"90ee90",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslateblue:"8470ff",lightslategray:"778899",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"00ff00",limegreen:"32cd32",linen:"faf0e6",magenta:"ff00ff",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370d8",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"d87093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",red:"ff0000",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",violetred:"d02090",wheat:"f5deb3",white:"ffffff",whitesmoke:"f5f5f5",yellow:"ffff00",yellowgreen:"9acd32"};
for(var key in _285){
if(_284==key){
_284=_285[key];
}
}
var _287=[{re:/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,example:["rgb(123, 234, 45)","rgb(255,234,245)"],process:function(bits){
return [parseInt(bits[1]),parseInt(bits[2]),parseInt(bits[3])];
}},{re:/^(\w{2})(\w{2})(\w{2})$/,example:["#00ff00","336699"],process:function(bits){
return [parseInt(bits[1],16),parseInt(bits[2],16),parseInt(bits[3],16)];
}},{re:/^(\w{1})(\w{1})(\w{1})$/,example:["#fb0","f0f"],process:function(bits){
return [parseInt(bits[1]+bits[1],16),parseInt(bits[2]+bits[2],16),parseInt(bits[3]+bits[3],16)];
}}];
for(var i=0;i<_287.length;i++){
var re=_287[i].re;
var _290=_287[i].process;
var bits=re.exec(_284);
if(bits){
channels=_290(bits);
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

