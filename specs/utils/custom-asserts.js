function customAsserts(chai_, utils) {
    function equalsDelta(expected, actual, epsilon, msg) {
        var isElement_ = (function () {
            var div = document.createElement('div');

            function isNode(obj) {
                try {
                    div.appendChild(obj);
                    div.removeChild(obj);
                } catch (e) {
                    return false;
                }

                return true;
            }

            return function isElement(obj) {
                return obj && obj.nodeType === 1 && isNode(obj);
            };
        }());
        function compareDelta(expected, actual, epsilon) {
            var compareDouble = function(e,a,d) {
                return Math.abs(e - a) <= d;
            };
            if (expected === actual) {
                return true;
            }

            if (typeof expected == "number" ||
                typeof actual == "number" ||
                !expected || !actual) {
                return compareDouble(expected, actual, epsilon);
            }

            if (isElement_(expected) || isElement_(actual)) {
                return false;
            }

            var key = null;
            var actualLength   = 0;
            var expectedLength = 0;

            try {
                // If an array is expected the length of actual should be simple to
                // determine. If it is not it is undefined.
                if (Array.isArray(actual)) {
                    actualLength = actual.length;
                } else {
                    // In case it is an object it is a little bit more complicated to
                    // get the length.
                    for (key in actual) {
                        if (actual.hasOwnProperty(key)) {
                            ++actualLength;
                        }
                    }
                }

                // Arguments object
                if (actualLength == 0 && typeof actual.length == "number") {
                    actualLength = actual.length;

                    for (var i = 0, l = actualLength; i < l; i++) {
                        if (!(i in actual)) {
                            actualLength = 0;
                            break;
                        }
                    }
                }

                for (key in expected) {
                    if (expected.hasOwnProperty(key)) {
                        if (!compareDelta(expected[key], actual[key], epsilon)) {
                            return false;
                        }

                        ++expectedLength;
                    }
                }

                if (expectedLength != actualLength) {
                    return false;
                }

                return expectedLength == 0 ? expected.toString() == actual.toString() : true;
            } catch (e) {
                console.log(e);
                return false;
            }
        }

        var test = new chai_.Assertion(compareDelta(expected, actual, epsilon), msg);

        var expectation = "";
        if (Array.isArray(expected) && Array.isArray(actual)) {
            expectation = expected.map(function(val, index) {
                return val - actual[index];
            });
        } else if (Array.isArray(expected) || Array.isArray(actual)) {
            test.assert(false, "Both values must be array or scalar, not mixed", "Mixed values, array and scalar");
            return;
        } else {
            expectation = expected - actual;
        }

        test.assert(true == test._obj,
            'expected #{exp} to be within delta #{act}',
            'expected #{exp} to not be within #{act}',
            expectation,
            epsilon);
    }
    utils.addMethod(chai.assert, "equalsDelta", equalsDelta);
    utils.addMethod(chai.assert, "isNaN", isNaN);
}

// Pulled in from utilities, must tell chai to use here, because files are loaded in wrong order
chai.use(customAsserts);
