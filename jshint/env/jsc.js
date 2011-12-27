/*jshint boss:true, evil:true */

// usage:
//   jsc ${env_home}/jsc.js -- ${file} "$(cat ${file})" "{option1:true,option2:false} ${env_home}"
var env_home = '';
if (arguments.length > 3) {
  env_home = arguments[3].toString().replace(/\/env$/, '/');
}
load(env_home + "jshint.js");

if (typeof(JSHINT) === 'undefined') {
  print('jshint: Could not load jshint.js, tried "' + env_home + 'jshint.js".');
  quit();
}

(function(args){
    var home  = args[3],
        name  = args[0],
        input = args[1],
        opts  = (function(arg){
            var opts = {};
            var item;

            switch (arg) {
            case undefined:
            case '':
                return opts;
            default:
                arg = arg.split(',');
                for (var i = 0, ii = arg.length; i < ii; i++) {
                    item = arg[i].split(':');
                    opts[item[0]] = eval(item[1]);
                }
                return opts;
            }
        })(args[2]);

    if (!name) {
        print('jshint: No file name was provided.');
        quit();
    }

    if (!input) {
        print('jshint: ' + name + ' contents were not provided to jshint.');
        quit();
    }

    if (!JSHINT(input, opts)) {
        for (var i = 0, err; err = JSHINT.errors[i]; i++) {
            print(err.reason + ' (line: ' + err.line + ', character: ' + err.character + ')');
            print('> ' + (err.evidence || '').replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1"));
            print('');
        }
    }

    var data = JSHINT.data();
    if (data.unused !== undefined) {
      for (var i = 0, unused; unused = data.unused[i]; i++) {
        print('Unused variable "' + unused.name + '" (line: ' + unused.line + ')');
      }
    }

    // if (data.globals !== undefined) {
    //   for (var i = 0, globals; global = data.globals[i]; i++) {
    //     print('Global variable "' + global + '"');
    //   }
    // }

    if (data.implieds !== undefined) {
      for (var i = 0, implied; implied = data.implieds[i]; i++) {
        print('Implied global variable "' + implied.name + '" (line: ' + implied.line + ')');
      }
    }

    // print('Errors: ' + JSHINT.errors.length);
    // print(JSHINT.report(true));

    quit();
})(arguments);
