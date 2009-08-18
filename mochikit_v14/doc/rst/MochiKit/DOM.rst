.. title:: MochiKit.DOM - painless DOM manipulation API

Name
====

MochiKit.DOM - painless DOM manipulation API


Synopsis
========

::

    var rows = [
        ["dataA1", "dataA2", "dataA3"],
        ["dataB1", "dataB2", "dataB3"]
    ];
    row_display = function (row) {
        return TR(null, map(partial(TD, null), row));
    }
    var newTable = TABLE({'class': 'prettytable'},
        THEAD(null,
            row_display(["head1", "head2", "head3"])),
        TFOOT(null,
            row_display(["foot1", "foot2", "foot3"])),
        TBODY(null,
            map(row_display, rows)));
    // put that in your document.createElement and smoke it!
    swapDOM(oldTable, newTable);


Description
===========

As you probably know, the DOM APIs are some of the most painful
Java-inspired APIs you'll run across from a highly dynamic
language. Don't worry about that though, because they provide a
reasonable basis to build something that sucks a lot less.

MochiKit.DOM takes much of its inspiration from Nevow's [1]_ stan
[2]_.  This means you choose a tag, give it some attributes, then
stuff it full of *whatever objects you want*. MochiKit.DOM isn't
stupid, it knows that a string should be a text node, and that you
want functions to be called, and that ``Array``-like objects should be
expanded, and stupid ``null`` values should be skipped.

Hell, it will let you return strings from functions, and use iterators
from :mochiref:`MochiKit.Iter`. If that's not enough, just teach it
new tricks with :mochiref:`registerDOMConverter`. If you have never
used an API like this for creating DOM elements, you've been wasting
your damn time. Get with it!


Dependencies
============

- :mochiref:`MochiKit.Base`
- :mochiref:`MochiKit.Style` (optional since MochiKit 1.4 for
  backwards-compatibility)
- :mochiref:`MochiKit.Iter` (optional since MochiKit 1.4)


Overview
========

DOM Coercion Rules
------------------

In order of precedence, :mochiref:`createDOM` coerces given arguments
to DOM nodes using the following rules:

1.  Functions are called with a ``this`` and first argument of the
    parent node and their return value is subject to the following
    rules (even this one).
2.  ``undefined`` and ``null`` are ignored.
3.  If :mochiref:`MochiKit.Iter` is loaded, iterables are flattened
    (as if they were passed in-line as nodes) and each return value is
    subject to these rules.
4.  Values that look like DOM nodes (objects with a ``.nodeType > 0``)
    are ``.appendChild``'ed to the created DOM fragment.
5.  Strings are wrapped up with ``document.createTextNode``
6.  Objects that have a ``.dom(node)`` or ``.__dom__(node)`` method
    are called with the parent node and their result is coerced using
    these rules.  (MochiKit 1.4+).
7.  Objects that are not strings are run through the ``domConverters``
    :mochiref:`MochiKit.Base.AdapterRegistry` (see
    :mochiref:`registerDOMConverter`).  The adapted value is subject
    to these same rules (e.g.  if the adapter returns a string, it
    will be coerced to a text node).
8.  If no adapter is available, ``.toString()`` is used to create a
    text node.


Creating DOM Element Trees
--------------------------

:mochiref:`createDOM` provides you with an excellent facility for
creating DOM trees that is easy on the wrists. One of the best ways to
understand how to use it is to take a look at an example::

    var rows = [
        ["dataA1", "dataA2", "dataA3"],
        ["dataB1", "dataB2", "dataB3"]
    ];
    row_display = function (row) {
        return TR(null, map(partial(TD, null), row));
    }
    var newTable = TABLE({'class': 'prettytable'},
        THEAD(null,
            row_display(["head1", "head2", "head3"])),
        TFOOT(null,
            row_display(["foot1", "foot2", "foot3"])),
        TBODY(null,
            map(row_display, rows)));


This will create a table with the following visual layout (if it were
inserted into the document DOM):

    +--------+--------+--------+
    | head1  | head2  | head3  |
    +========+========+========+
    | dataA1 | dataA2 | dataA3 |
    +--------+--------+--------+
    | dataB1 | dataB2 | dataB3 |
    +--------+--------+--------+
    | foot1  | foot2  | foot3  |
    +--------+--------+--------+

Corresponding to the following HTML::

    <table class="prettytable">
        <thead>
            <tr>
                <td>head1</td>
                <td>head2</td>
                <td>head3</td>
            </tr>
        </thead>
        <tfoot>
            <tr>
                <td>foot1</td>
                <td>foot2</td>
                <td>foot3</td>
            </tr>
        </tfoot>
        <tbody>
            <tr>
                <td>dataA1</td>
                <td>dataA2</td>
                <td>dataA3</td>
            </tr>
            <tr>
                <td>dataB1</td>
                <td>dataB2</td>
                <td>dataB3</td>
            </tr>
        </tbody>
    </table>


DOM Context
-----------

In order to prevent having to pass a ``window`` and/or ``document``
variable to every MochiKit.DOM function (e.g. when working with a
child window), MochiKit.DOM maintains a context variable for each of
them. They are managed with the :mochiref:`withWindow` and
:mochiref:`withDocument` functions, and can be acquired with
:mochiref:`currentWindow()` and :mochiref:`currentDocument()`

For example, if you are creating DOM nodes in a child window, you
could do something like this::

    withWindow(child, function () {
        var doc = currentDocument();
        appendChildNodes(doc.body, H1(null, "This is in the child!"));
    });

Note that :mochiref:`withWindow(win, ...)` also implies
:mochiref:`withDocument(win.document, ...)`.


DOM Gotchas
-----------

Performance Tradeoff:
    DOM is much easier to get correct and more flexible than working
    directly with markup as strings. Modifying ``innerHTML`` is still
    the fastest way to make document changes.

Internet Explorer:
    Internet Explorer's DOM implementation is quite poor in comparison
    to the other popular implementations. In order to avoid memory
    leaks due to circular references, you should use
    :mochiref:`MochiKit.Signal.connect` for all of your event handling
    needs. Additionally, when creating tables with DOM, it is required
    to use a ``TBODY`` tag (see `Creating DOM Element Trees`_ for an
    example of this).


API Reference
=============

Functions
---------

:mochidef:`$(id[, ...])`:

    An alias for :mochiref:`getElement(id[, ...])`

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`addElementClass(element, className)`:

    Ensure that the given ``element`` has ``className`` set as part of
    its class attribute. This will not disturb other class names.
    ``element`` is looked up with :mochiref:`getElement`, so string
    identifiers are also acceptable.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`addLoadEvent(func)`:

    Note that :mochiref:`addLoadEvent` can not be used in combination
    with :mochiref:`MochiKit.Signal` if the ``onload`` event is
    connected.  Once an event is connected with
    :mochiref:`MochiKit.Signal`, no other APIs may be used for that
    same event.

    This will stack ``window.onload`` functions on top of each other.
    Each function added will be called after ``onload`` in the order
    that they were added.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`addToCallStack(target, path, func[, once])`:

    Note that :mochiref:`addToCallStack` is not compatible with
    :mochiref:`MochiKit.Signal`. Once an event is connected with
    :mochiref:`MochiKit.Signal`, no other APIs may be used for that
    same event.

    Set the property ``path`` of ``target`` to a function that calls
    the existing function at that property (if any), then calls
    ``func``.

    If ``target[path]()`` returns exactly ``false``, then ``func``
    will not be called.

    If ``once`` is ``true``, then ``target[path]`` is set to ``null``
    after the function call stack has completed.

    If called several times for the same ``target[path]``, it will
    create a stack of functions (instead of just a pair).

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`appendChildNodes(node[, childNode[, ...]])`:

    Append children to a DOM element using the `DOM Coercion Rules`_.

    ``node``:
        A reference to the DOM element to add children to (if a string
        is given, :mochiref:`getElement(node)` will be used to locate
        the node)

    ``childNode``...:
        All additional arguments, if any, will be coerced into DOM
        nodes that are appended as children using the `DOM Coercion
        Rules`_.

    *returns*:
        The given DOM element

    *Availability*:
        Available in MochiKit 1.3.1+

:mochidef:`insertSiblingNodesBefore(node[, siblingNode[, ...]])`:

    Insert children into the DOM structure using the `DOM Coercion
    Rules`_.

    ``node``:
        A reference to the DOM element you want to insert children
        before (if a string is given, :mochiref:`getElement(node)`
        will be used to locate the node)

    ``siblingNode``...:
        All additional arguments, if any, will be coerced into DOM
        nodes that are inserted as siblings using the `DOM Coercion
        Rules`_.

    *returns*:
        The parent of the given DOM element

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`insertSiblingNodesAfter(node[, siblingNode[, ...]])`:

    Insert children into the DOM structure using the `DOM Coercion
    Rules`_.

    ``node``:
        A reference to the DOM element you want to insert children
        after (if a string is given, :mochiref:`getElement(node)`
        will be used to locate the node)

    ``siblingNode``...:
        All additional arguments, if any, will be coerced into DOM
        nodes that are inserted as siblings using the `DOM Coercion
        Rules`_.

    *returns*:
        The parent of the given DOM element

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`createDOM(name[, attrs[, node[, ...]]])`:

    Create a DOM fragment in a really convenient manner, much like
    Nevow`s [1]_ stan [2]_.

    Partially applied versions of this function for common tags are
    available as aliases:

    - ``A``
    - ``BUTTON``
    - ``BR``
    - ``CANVAS``
    - ``DIV``
    - ``FIELDSET``
    - ``FORM``
    - ``H1``
    - ``H2``
    - ``H3``
    - ``HR``
    - ``IMG``
    - ``INPUT``
    - ``LABEL``
    - ``LEGEND``
    - ``LI``
    - ``OL``
    - ``OPTGROUP``
    - ``OPTION``
    - ``P``
    - ``PRE``
    - ``SELECT``
    - ``SPAN``
    - ``STRONG``
    - ``TABLE``
    - ``TBODY``
    - ``TD``
    - ``TEXTAREA``
    - ``TFOOT``
    - ``TH``
    - ``THEAD``
    - ``TR``
    - ``TT``
    - ``UL``

    See `Creating DOM Element Trees`_ for a comprehensive example.

    ``name``:
        The kind of fragment to create (e.g. 'span'), such as you
        would pass to ``document.createElement``.

    ``attrs``:
        An object whose properties will be used as the attributes
        (e.g. ``{'style': 'display:block'}``), or ``null`` if no
        attributes need to be set.

        See :mochiref:`updateNodeAttributes` for more information.

        For convenience, if ``attrs`` is a string, ``null`` is used
        and the string will be considered the first ``node``.

    ``node``...:
        All additional arguments, if any, will be coerced into DOM
        nodes that are appended as children using the `DOM Coercion
        Rules`_.

    *returns*:
        A DOM element

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`createDOMFunc(tag[, attrs[, node[, ...]]])`:

    Convenience function to create a partially applied createDOM
    function. You'd want to use this if you add additional convenience
    functions for creating tags, or if you find yourself creating a
    lot of tags with a bunch of the same attributes or contents.

    See :mochiref:`createDOM` for more detailed descriptions of the
    arguments.

    ``tag``:
        The name of the tag

    ``attrs``:
        Optionally specify the attributes to apply

    ``node``...:
        Optionally specify any children nodes it should have

    *returns*:
        function that takes additional arguments and calls
        :mochiref:`createDOM`

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`currentDocument()`:

    Return the current ``document`` `DOM Context`_. This will always
    be the same as the global ``document`` unless
    :mochiref:`withDocument` or :mochiref:`withWindow` is currently
    executing.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`currentWindow()`:

    Return the current ``window`` `DOM Context`_. This will always be
    the same as the global ``window`` unless :mochiref:`withWindow` is
    currently executing.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`emitHTML(dom[, lst])`:

    Convert a DOM tree to an ``Array`` of HTML string fragments. This should
    be used for debugging/testing purposes only.

    The DOM property ``innerHTML`` or ``cloneNode(true)`` method should
    be used for most purposes.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`escapeHTML(s)`:

    Make a string safe for HTML, converting the usual suspects (lt,
    gt, quot, amp)

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`focusOnLoad(element)`:

    Note that :mochiref:`focusOnLoad` can not be used in combination
    with :mochiref:`MochiKit.Signal` if the ``onload`` event is
    connected.  Once an event is connected with
    :mochiref:`MochiKit.Signal`, no other APIs may be used for that
    same event.

    This adds an onload event to focus the given element.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`formContents(elem=document.body)`:

    Search the DOM tree, starting at ``elem``, for any elements with a
    ``name`` and ``value`` attribute. Return a 2-element ``Array`` of
    ``names`` and ``values`` suitable for use with
    :mochiref:`MochiKit.Base.queryString`.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`getElement(id[, ...])`:

    A small quick little function to encapsulate the
    ``getElementById`` method. It includes a check to ensure we can
    use that method.

    If the id isn't a string, it will be returned as-is.

    Also available as :mochiref:`$(...)` for convenience and
    compatibility with other JavaScript frameworks.

    If multiple arguments are given, an ``Array`` will be returned.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`getElementsByTagAndClassName(tagName, className, parent=document)`:

    Returns an array of elements in ``parent`` that match the tag name
    and class name provided. If ``parent`` is a string, it will be
    looked up with :mochiref:`getElement`.

    If ``tagName`` is ``null`` or ``"*"``, all elements will be
    searched for the matching class.

    If ``className`` is ``null``, all elements matching the provided
    tag are returned.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`getFirstElementByTagAndClassName(tagName, className, parent=document)`:

    Return the first element in ``parent`` that matches the tag name
    and class name provided. If ``parent`` is a string, it will be 
    looked up with :mochiref:`getElement`.

    If ``tagName`` is ``null`` or ``"*"``, all elements will be searched
    for the matching class.

    If ``className`` is ``null``, the first element matching the provided
    tag will be returned.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`getFirstParentByTagAndClassName(elem, tagName='*', className=null)`:

    Returns the first parent of ``elem`` matches the tag name and class name
    provided. If parent is a string, it will be looked up using
    :mochiref:`getElement`.

    If ``tagName`` is ``null`` or ``"*"``, all elements will be searched
    for the matching class.

    If ``className`` is ``null``, the first element matching the provided
    tag will be returned.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`getNodeAttribute(node, attr)`:

    Get the value of the given attribute for a DOM element without
    ever raising an exception (will return ``null`` on exception).

    ``node``:
        A reference to the DOM element to update (if a string is
        given, :mochiref:`getElement(node)` will be used to locate the
        node)

    ``attr``:
        The name of the attribute

        Note that it will do the right thing for IE, so don't do
        the ``class`` -> ``className`` hack yourself.

    *returns*:
        The attribute's value, or ``null``

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`hasElementClass(element, className[, ...])`:

    Return ``true`` if ``className`` is found on the ``element``.
    ``element`` is looked up with :mochiref:`getElement`, so string
    identifiers are also acceptable.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`isChildNode(node, maybeParent)`:

    Determine whether ``node`` is a child node of ``maybeParent``.
    Returns ``true`` if so, and ``false`` if not. A node is considered
    a child node of itself for the purposes of this function.

    If either ``node`` or ``maybeParent`` are strings, the related
    nodes will be looked up with :mochiref:`getElement`.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`isParent(child, element)`:

    Returns ``true`` if ``element`` contains ``child``. Returns ``false``
    if ``element == child`` or ``child`` is not contained in ``element``.
    If ``child`` or ``element`` are strings, they will be looked up with
    :mochiref:`getElement`.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`makeClipping(element)`:

    Ensure that ``element.style.overflow = 'hidden'``. If ``element`` is a
    string, then it will be looked up with :mochiref:`getElement`.

    Returns the original value of ``element.style.overflow``, so that it
    may be restored with :mochiref:`undoClipping(element, overflow)`.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`makePositioned(element)`:

    Ensure that ``element.style.position`` is set to ``"relative"`` if it
    is not set or is ``"static"``. If ``element`` is a
    string, then it will be looked up with :mochiref:`getElement`.

    Returns the original value of ``element.style.position``, so that it
    may be restored with :mochiref:`undoPositioned(element, position)`.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`registerDOMConverter(name, check, wrap[, override])`:

    Register an adapter to convert objects that match ``check(obj,
    ctx)`` to a DOM element, or something that can be converted to a
    DOM element (i.e. number, bool, string, function, iterable).

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`removeElement(node)`:

    Remove and return ``node`` from a DOM tree.

    ``node``:
        the DOM element (or string id of one) to be removed

    *returns*
        The removed element

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`removeElementClass(element, className)`:

    Ensure that the given ``element`` does not have ``className`` set
    as part of its class attribute. This will not disturb other class
    names.  ``element`` is looked up with :mochiref:`getElement`, so
    string identifiers are also acceptable.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`removeEmptyTextNodes(node)`:

    Remove all text node children that contain only whitespace from
    ``node``. Useful in situations where such empty text nodes can
    interfere with DOM traversal.
    
    ``node``:
        the DOM element (or string id of one) to remove whitespace child
        nodes from.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`replaceChildNodes(node[, childNode[, ...]])`:

    Remove all children from the given DOM element, then append any
    given childNodes to it (by calling :mochiref:`appendChildNodes`).

    ``node``:
        A reference to the DOM element to add children to (if a string
        is given, :mochiref:`getElement(node)` will be used to locate
        the node)

    ``childNode``...:
        All additional arguments, if any, will be coerced into DOM
        nodes that are appended as children using the `DOM Coercion
        Rules`_.

    *returns*:
        The given DOM element

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`scrapeText(node[, asArray=false])`:

    Walk a DOM tree in-order and scrape all of the text out of it as a
    ``string``.

    If ``asArray`` is ``true``, then an ``Array`` will be returned
    with each individual text node. These two are equivalent::

        assert( scrapeText(node) == scrapeText(node, true).join("") );

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`setElementClass(element, className)`:

    Set the entire class attribute of ``element`` to ``className``.
    ``element`` is looked up with :mochiref:`getElement`, so string
    identifiers are also acceptable.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`setNodeAttribute(node, attr, value)`:

    Set the value of the given attribute for a DOM element without
    ever raising an exception (will return null on exception). If
    setting more than one attribute, you should use
    :mochiref:`updateNodeAttributes`.

    ``node``:
        A reference to the DOM element to update (if a string is
        given, :mochiref:`getElement(node)` will be used to locate the
        node)

    ``attr``:
        The name of the attribute

        Note that it will do the right thing for IE, so don't do the
        ``class`` -> ``className`` hack yourself.

    ``value``:
        The value of the attribute, may be an object to be merged
        (e.g. for setting style).

    *returns*:
        The given DOM element or ``null`` on failure

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`swapDOM(dest, src)`:

    Replace ``dest`` in a DOM tree with ``src``, returning ``src``.

    ``dest``:
        a DOM element (or string id of one) to be replaced

    ``src``:
        the DOM element (or string id of one) to replace it with, or
        ``null`` if ``dest`` is to be removed (replaced with nothing).

    *returns*:
        a DOM element (``src``)

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`swapElementClass(element, fromClass, toClass)`:

    If ``fromClass`` is set on ``element``, replace it with
    ``toClass``.  This will not disturb other classes on that element.
    ``element`` is looked up with :mochiref:`getElement`, so string
    identifiers are also acceptable.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`toggleElementClass(className[, element[, ...]])`:

    Toggle the presence of a given ``className`` in the class
    attribute of all given elements. All elements will be looked up
    with :mochiref:`getElement`, so string identifiers are acceptable.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`toHTML(dom)`:

    Convert a DOM tree to a HTML string using :mochiref:`emitHTML`.
    This should be used for debugging/testing purposes only.

    The DOM property ``innerHTML`` or ``cloneNode(true)`` method should
    be used for most purposes.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`undoClipping(element, overflow)`:

    Restore the setting of ``element.style.overflow`` set by
    :mochiref:`makeClipping(element)`. If ``element`` is a string, then
    it will be looked up with :mochiref:`getElement`.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`undoPositioned(element, overflow)`:

    Restore the setting of ``element.style.position`` set by
    :mochiref:`makePositioned(element)`. If ``element`` is a string, then
    it will be looked up with :mochiref:`getElement`.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`updateNodeAttributes(node, attrs)`:

    Update the attributes of a DOM element from a given object.

    ``node``:
        A reference to the DOM element to update (if a string is
        given, :mochiref:`getElement(node)` will be used to locate the
        node)

    ``attrs``:
        An object whose properties will be used to set the attributes
        (e.g. ``{'class': 'invisible'}``), or ``null`` if no
        attributes need to be set. If an object is given for the
        attribute value (e.g. ``{'style': {'display': 'block'}}``)
        then :mochiref:`MochiKit.Base.updatetree` will be used to set
        that attribute.

        Note that it will do the right thing for IE, so don't do the
        ``class`` -> ``className`` hack yourself, and it deals with
        setting "on..." event handlers correctly.

    *returns*:
        The given DOM element

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`withWindow(win, func)`:

    Call ``func`` with the ``window`` `DOM Context`_ set to ``win``
    and the ``document`` `DOM Context`_ set to ``win.document``. When
    ``func()`` returns or throws an error, the `DOM Context`_ will be
    restored to its previous state.

    The return value of ``func()`` is returned by this function.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`withDocument(doc, func)`:

    Call ``func`` with the ``doc`` `DOM Context`_ set to ``doc``.
    When ``func()`` returns or throws an error, the `DOM Context`_
    will be restored to its previous state.

    The return value of ``func()`` is returned by this function.

    *Availability*:
        Available in MochiKit 1.3.1+


Style Functions
---------------

These functions are available in MochiKit 1.3.1, but have been moved to 
:mochiref:`MochiKit.Style` in 1.4+.


:mochidef:`computedStyle(htmlElement, cssProperty, mozillaEquivalentCSS)`:

    Looks up a CSS property for the given element. The element can be
    specified as either a string with the element's ID or the element
    object itself.
    
    ``cssProperty``:
        MochiKit 1.3.1 expects camel case, e.g. ``backgroundColor``.
        MochiKit 1.4+ expects CSS selector case, e.g. ``background-color``,
        but will accept camel case for backwards-compatibility.
        
    ``mozillaEquivalentCSS``:
        MochiKit 1.3.1 expects selector case.
        MochiKit 1.4+ ignores this argument.

    *Availability*:
        Available in MochiKit 1.3.1, deprecated in favor of
        :mochiref:`MochiKit.Style.getStyle` in 1.4+


:mochidef:`elementDimensions(element)`:

    Return the absolute pixel width and height (including padding and border,
    but not margins) of ``element`` as an object with ``w`` and ``h``
    properties, or ``undefined`` if ``element`` is not in the document.
    ``element`` may be specified as a string to be looked up with
    :mochiref:`getElement`, a DOM element, or trivially as an object with
    ``w`` and/or ``h`` properties.

    *Availability*:
        Available in MochiKit 1.3.1, deprecated in favor of
        :mochiref:`MochiKit.Style.getElementDimensions` in 1.4+


:mochidef:`elementPosition(element[, relativeTo={x: 0, y: 0}])`:

    Return the absolute pixel position of ``element`` in the document
    as an object with ``x`` and ``y`` properties, or ``undefined`` if
    ``element`` is not in the document. ``element`` may be specified
    as a string to be looked up with :mochiref:`getElement`, a DOM
    element, or trivially as an object with ``x`` and/or ``y``
    properties.

    If ``relativeTo`` is given, then its coordinates are subtracted from
    the absolute position of ``element``, e.g.::

        var elemPos = elementPosition(elem);
        var anotherElemPos = elementPosition(anotherElem);
        var relPos = elementPosition(elem, anotherElem);
        assert( relPos.x == (elemPos.x - anotherElemPos.x) );
        assert( relPos.y == (elemPos.y - anotherElemPos.y) );

    ``relativeTo`` may be specified as a string to be looked up with
    :mochiref:`getElement`, a DOM element, or trivially as an object
    with ``x`` and/or ``y`` properties.

    *Availability*:
        Available in MochiKit 1.3.1, deprecated in favor of
        :mochiref:`MochiKit.Style.getElementPosition` in 1.4+


:mochidef:`getViewportDimensions()`:

    Return the pixel width and height of the viewport as an object
    with ``w`` and ``h`` properties. ``element`` is looked up with
    :mochiref:`getElement`, so string identifiers are also acceptable.

    *Availability*:
        Available in MochiKit 1.3.1, moved to
        :mochiref:`MochiKit.Style.getViewportDimensions` in 1.4+


:mochidef:`hideElement(element, ...)`:

    Partial form of :mochiref:`setDisplayForElement`, specifically::

        partial(setDisplayForElement, "none")

    For information about the caveats of using a ``style.display``
    based show/hide mechanism, and a CSS based alternative, see
    `Element Visibility`_.

.. _`Element Visibility`: Style.html#element-visibility

    *Availability*:
        Available in MochiKit 1.3.1, moved to 
        :mochiref:`MochiKit.Style.hideElement` in 1.4+


:mochidef:`setElementDimensions(element, dimensions[, units='px'])`:

    Sets the dimensions of ``element`` in the document from an object
    with ``w`` and ``h`` properties.

    ``node``:
        A reference to the DOM element to update (if a string is
        given, :mochiref:`getElement(node)` will be used to locate the
        node)

    ``dimensions``:
        An object with ``w`` and ``h`` properties

    ``units``:
        Optionally set the units to use, default is ``px``

    *Availability*:
        Available in MochiKit 1.3.1, moved to 
        :mochiref:`MochiKit.Style.setElementDimensions` in 1.4+


:mochidef:`setElementPosition(element, position[, units='px'])`:

    Sets the absolute position of ``element`` in the document from an
    object with ``x`` and ``y`` properties.

    ``node``:
        A reference to the DOM element to update (if a string is
        given, :mochiref:`getElement(node)` will be used to locate the
        node)

    ``position``:
        An object with ``x`` and ``y`` properties

    ``units``:
        Optionally set the units to use, default is ``px``

    *Availability*:
        Available in MochiKit 1.3.1, moved to 
        :mochiref:`MochiKit.Style.setElementPosition` in 1.4+


:mochidef:`setDisplayForElement(display, element[, ...])`:

    Change the ``style.display`` for the given element(s). Usually
    used as the partial forms:

    - :mochiref:`showElement(element, ...)`
    - :mochiref:`hideElement(element, ...)`

    Elements are looked up with :mochiref:`getElement`, so string
    identifiers are acceptable.

    For information about the caveats of using a ``style.display``
    based show/hide mechanism, and a CSS based alternative, see
    `Element Visibility`_.

    *Availability*:
        Available in MochiKit 1.3.1, moved to 
        :mochiref:`MochiKit.Style.setDisplayForElement` in 1.4+


:mochidef:`setOpacity(element, opacity)`:

    Sets ``opacity`` for ``element``. Valid ``opacity`` values range
    from 0 (invisible) to 1 (opaque). ``element`` is looked up with
    :mochiref:`getElement`, so string identifiers are also acceptable.

    *Availability*:
        Available in MochiKit 1.3.1, moved to 
        :mochiref:`MochiKit.Style.setOpacity` in 1.4+


:mochidef:`showElement(element, ...)`:

    Partial form of :mochiref:`setDisplayForElement`, specifically::

        partial(setDisplayForElement, "block")

    For information about the caveats of using a ``style.display``
    based show/hide mechanism, and a CSS based alternative, see
    `Element Visibility`_.

    *Availability*:
        Available in MochiKit 1.3.1, moved to 
        :mochiref:`MochiKit.Style.showElement` in 1.4+


Style Objects
-------------

These objects are available in MochiKit 1.3.1, but have been moved to 
:mochiref:`MochiKit.Style` in 1.4+.

:mochidef:`Coordinates(x, y)`:

    Constructs an object with ``x`` and ``y`` properties. ``obj.toString()`` 
    returns something like ``{x: 0, y: 42}`` for debugging.

    *Availability*:
    Available in MochiKit 1.3.1, moved to 
    :mochiref:`MochiKit.Style.Coordinates` in 1.4+

:mochidef:`Dimensions(w, h)`:

    Constructs an object with ``w`` and ``h`` properties. ``obj.toString()`` 
    returns something like ``{w: 0, h: 42}`` for debugging.

    *Availability*:
    Available in MochiKit 1.3.1, moved to 
    :mochiref:`MochiKit.Style.Dimensions` in 1.4+



See Also
========

.. [1] Nevow, a web application construction kit for Python:
       http://divmod.org/trac/wiki/DivmodNevow
.. [2] nevow.stan is a domain specific language for Python (read as
       "crazy getitem/call overloading abuse") that Donovan and I
       schemed up at PyCon 2003 at this super ninja Python/C++
       programmer's (David Abrahams) hotel room. Donovan later
       inflicted this upon the masses in Nevow. Check out the Nevow
       Guide for some examples:
       http://divmod.org/trac/wiki/DivmodNevow


Authors
=======

- Bob Ippolito <bob@redivi.com>


Copyright
=========

Copyright 2005 Bob Ippolito <bob@redivi.com>. This program is
dual-licensed free software; you can redistribute it and/or modify it
under the terms of the `MIT License`_ or the `Academic Free License
v2.1`_.

.. _`MIT License`: http://www.opensource.org/licenses/mit-license.php
.. _`Academic Free License v2.1`: http://www.opensource.org/licenses/afl-2.1.php
