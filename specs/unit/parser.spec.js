/**
 * @fileoverview Tests the way that dygraphs parses data.
 *
 * @author danvk@google.com (Dan Vanderkam)
 */
describe("parser", function () {
    beforeEach(function () {
        document.body.innerHTML = "<div id='graph'></div>";
    });

    it("testDetectLineDelimiter", function () {
        var data = "X,Y\r" +
                "0,-1\r" +
                "1,0\r" +
                "2,1\r" +
                "3,0\r"
            ;
        assert.equal("\r", Dygraph.detectLineDelimiter(data));

        data = "X,Y\n" +
        "0,-1\n" +
        "1,0\n" +
        "2,1\n" +
        "3,0\n"
        ;
        assert.equal("\n", Dygraph.detectLineDelimiter(data));

        data = "X,Y\n\r" +
        "0,-1\n\r" +
        "1,0\n\r" +
        "2,1\n\r" +
        "3,0\n\r"
        ;
        assert.equal("\n\r", Dygraph.detectLineDelimiter(data));
    });

    it("testParseDosNewlines", function () {
        var opts = {
            width: 480,
            height: 320
        };
        var data = "X,Y\r" +
                "0,-1\r" +
                "1,0\r" +
                "2,1\r" +
                "3,0\r"
            ;

        var graph = document.getElementById("graph");
        var g = new Dygraph(graph, data, opts);

        assert.equal(0, g.getValue(0, 0));
        assert.equal(-1, g.getValue(0, 1));
        assert.equal(1, g.getValue(1, 0));
        assert.equal(0, g.getValue(1, 1));
        assert.deepEqual(['X', 'Y'], g.getLabels());
    });
});
