/**

run with:
cscript.exe //nologo scripts\jscriptmochi.js

**/
if (typeof(print) == "undefined" && typeof(WScript) != "undefined") {
    // Make JScript look like SpiderMonkey and Rhino
    var print = WScript.Echo;
    var load = function (fn) {
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var textStream = fso.OpenTextFile(fn, 1);
        var namespace = undefined;
        if (typeof(JSAN) != "undefined") {
            namespace = JSAN.global;
        }
        arguments.callee.do_eval.apply(namespace, [textStream.ReadAll()]);
    };
    load.do_eval = function () {
        eval(arguments[0]);
    };
}

load('tests/standalone.js');
