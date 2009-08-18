function function_ref(fn) {
    return A({"href": fn[1], "class": "mochiref reference"}, fn[0], BR());
};

function toggle_docs() {
    toggleElementClass("invisible", "show_index", "function_index");
    return false;
};

function create_toc() {
    if (getElement("distribution")) {
        return global_index();
    } 
    if (getElement("api-reference")) {
        return module_index();
    }
};

function doXHTMLRequest(url) {
    var d = doXHR(url, {mimeType: 'text/xml'});
    return d.addCallback(function (res) {
        if (res.responseXML.documentElement) {
            return res.responseXML.documentElement;
        } else {
            var container = document.createElement('div');
            container.innerHTML = res.responseText;
            return container;
        }
    });
};

function load_request(href, div, doc) {
    var functions = withDocument(doc, spider_doc);
    forEach(functions, function (func) {
        // fix anchors
        if (func[1].charAt(0) == "#") {
            func[1] = href + func[1];
        } else if (func[1].lastIndexOf("#") != -1) {
            func[1] = href + "#" + func[1].split("#")[1];
        }
    });
    var showLink = A({"class": "force-pointer"}, "[+]");
    var hideLink = A({"class": "force-pointer"}, "[\u2013]");
    var functionIndex = DIV({"id": "function_index", "class": "invisible"},
        hideLink,
        P(null, map(function_ref, functions))
    );
    var toggleFunc = function (e) {
        toggleElementClass("invisible", showLink, functionIndex);
    };
    connect(showLink, "onclick", toggleFunc);
    connect(hideLink, "onclick", toggleFunc);
    replaceChildNodes(div,
        showLink,
        functionIndex
    );
    return [showLink, toggleFunc];
};

function global_index() {
    var distList = getElementsByTagAndClassName("ul")[0];
    var bullets = getElementsByTagAndClassName("li", null, distList);
    var lst = [];
    for (var i = 0; i < bullets.length; i++) {
        var tag = bullets[i];
        var firstLink = getElementsByTagAndClassName("a", "mochiref", tag)[0];
        var href = getNodeAttribute(firstLink, "href");
        var div = DIV(null, "[\u2026]");
        appendChildNodes(tag, BR(), div);
        lst.push(doXHTMLRequest(href).addCallback(load_request, href, div));
    }
    
    var loadingNode = DIV(null, "[loading index\u2026]");
    distList.parentNode.insertBefore(P(null, loadingNode), distList);
    
    var dl = gatherResults(lst).addCallback(function (res) {
        var toggleFunc = function (e) {
            for (var i = 0; i < res.length; i++) {
                var item = res[i];
                if (!hasElementClass(item[0], "invisible")) {
                    item[1]();
                }
            }
        };
        var node = A({"class": "force-pointer"}, "[click to expand all]");
        swapDOM(loadingNode, node);
        connect(node, "onclick", toggleFunc);
    });
};

function spider_doc() {
    return map(
        function (tag) {
            return [scrapeText(tag), getNodeAttribute(tag, "href")];
        },
        getElementsByTagAndClassName("a", "mochidef")
    );
};

function module_index() {
    var sections = getElementsByTagAndClassName("div", "section");
    var ptr = sections[1];
    var ref = DIV({"class": "section"},
        H1(null, "Function Index"),
        A({"id": "show_index", "href": "#", "onclick": toggle_docs}, "[show]"),
        DIV({"id": "function_index", "class": "invisible"},
            A({"href":"#", "onclick": toggle_docs}, "[hide]"),
            P(null, map(function_ref, spider_doc()))));
    ptr.parentNode.insertBefore(ref, ptr);
};

connect(window, 'onload', create_toc);

