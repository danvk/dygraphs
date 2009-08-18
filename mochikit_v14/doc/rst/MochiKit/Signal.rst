.. title:: MochiKit.Signal - Simple universal event handling
.. |---| unicode:: U+2014  .. em dash, trimming surrounding whitespace
   :trim:

Name
====

MochiKit.Signal - Simple universal event handling


Synopsis
========

Signal for DOM events::

    // DOM events are also signals. Connect freely! The functions will be
    // called with the custom event as a parameter.

    // calls myClicked.apply(getElement('myID'), [event])
    connect('myID', 'onclick', myClicked);

    // calls wasClicked.apply(myObject, [event])
    connect('myID', 'onclick', myObject, wasClicked);

    // calls myObject.wasClicked(event)
    connect('myID', 'onclick', myObject, 'wasClicked');

    // the event is normalized, no more e = e || window.event!
    myObject.wasClicked = function(e) {
        var crossBrowserCoordinates = e.mouse().page;
        // e.mouse().page is a MochiKit.Style.Coordinates object
    }


Signal for non-DOM events::

    // otherObject.gotFlash() will be called when 'flash' signalled.
    connect(myObject, 'flash', otherObject, 'gotFlash');

    // gotBang.apply(otherObject, [...]) will be called when 'bang' signalled.
    // You can access otherObject from within gotBang as 'this'.
    connect(myObject, 'bang', otherObject, gotBang);

    // myFunc.apply(myObject, [...]) will be called when 'flash' signalled.
    // You can access myObject from within myFunc as 'this'.
    var ident = connect(myObject, 'flash', myFunc);

    // You may disconnect with the return value from connect
    disconnect(ident);

    // Signal can take parameters. These will be passed along to the
    // connected functions.
    signal(myObject, 'flash');
    signal(myObject, 'bang', 'BANG!');


Description
===========

Event handling was never so easy!

This module takes care of all the hard work |---| figuring out which
event model to use, trying to retrieve the event object, and handling
your own internal events, as well as cleanup when the page is unloaded
to clean up IE's nasty memory leakage.

This event system is largely based on Qt's signal/slot system. Read
more on how that is handled and also how it is used in model/view
programming at: http://doc.trolltech.com/


Dependencies
============

- :mochiref:`MochiKit.Base`
- :mochiref:`MochiKit.DOM`


Overview
========

Using Signal for DOM Events
---------------------------

When using MochiKit.Signal, do not use the browser's native event
API. That means, no ``onclick="blah"``, no
``elem.addEventListener(...)``, and certainly no
``elem.attachEvent(...)``. This also means that
:mochiref:`MochiKit.DOM.addToCallStack` and
:mochiref:`MochiKit.DOM.addLoadEvent` should not be used in
combination with this module.

Signals for DOM objects are named with the ``'on'`` prefix, e.g.:
``'onclick'``, ``'onkeyup'``, etc.

When the signal fires, your slot will be called with one parameter,
the custom event object.


Custom Event Objects for DOM events
-----------------------------------

Signals triggered by DOM events are called with a custom event object
as a parameter. The custom event object presents a consistent view of
the event across all supported platforms and browsers, and provides
many conveniences not available even in a correct W3C implementation.

See the `DOM Custom Event Object Reference`_ for a detailed API
description of this object.

If you find that you're accessing the native event for any reason,
create a `new ticket`_ and we'll look into normalizing the behavior
you're looking for.

.. _`new ticket`: http://trac.mochikit.com/newticket
.. _`Safari bug 6595`: http://bugs.webkit.org/show_bug.cgi?id=6595
.. _`Safari bug 7790`: http://bugs.webkit.org/show_bug.cgi?id=7790
.. _`Safari bug 8707`: http://bugs.webkit.org/show_bug.cgi?id=8707
.. _`stopPropagation()`: http://developer.mozilla.org/en/docs/DOM:event.stopPropagation
.. _`preventDefault()`: http://developer.mozilla.org/en/docs/DOM:event.preventDefault


Memory Usage
------------

Any object that has connected slots (via :mochiref:`connect()`) is
referenced by the Signal mechanism until it is disconnected via
:mochiref:`disconnect()` or :mochiref:`disconnectAll()`.

Signal does not leak. It registers an ``'onunload'`` event that
disconnects all objects on the page when the browser leaves the
page. However, memory usage will grow during the page view for every
connection made until it is disconnected. Even if the DOM object is
removed from the document, it will still be referenced by Signal until
it is explicitly disconnected.

In order to conserve memory during the page view,
:mochiref:`disconnectAll()` any DOM elements that are about to be
removed from the document.


Synthesized Events
------------------

Certain events supported by MochiKit are not generated natively by all
browsers. MochiKit can synthesize these events even for non-supporting
browsers, however, by watching for related events and triggering the
appropriate signals at the right times.

These events include:

``onmouseenter``

    Similar to ``'onmouseover'``, but does not "bubble" up to parent
    nodes. Such bubbling is often a cause of confusion. On an
    ``'onmouseenter'`` event, you can be certain that the mouse has
    left the node attached to the event.

    *Availability:*
        Available in MochiKit 1.4+

``onmouseleave``

    Similar to ``'onmouseout'``, but does not "bubble" up to parent
    nodes. This is the analog to ``'onmouseenter'``.

    *Availability:*
        Available in MochiKit 1.4+


Using Signal for non-DOM objects
--------------------------------

Signals are triggered with the :mochiref:`signal(src, 'signal', ...)`
function. Additional parameters passed to this are passed onto the
connected slots. Explicit signals are not required for DOM events.

Slots that are connected to a signal are called in the following
manner when that signal is signalled:

-   If the slot was a single function, then it is called with ``this``
    set to the object originating the signal with whatever parameters
    it was signalled with.

-   If the slot was an object and a function, then it is called with
    ``this`` set to the object, and with whatever parameters it was
    signalled with.

-   If the slot was an object and a string, then ``object[string]`` is
    called with the parameters to the signal.


API Reference
=============


Signal API Reference
--------------------

:mochidef:`connect(src, signal, dest[, func])`:

    Connects a signal to a slot, and return a unique identifier that
    can be used to disconnect that signal.

    ``src`` is the object that has the signal. You may pass in a
    string, in which case, it is interpreted as an id for an HTML
    element.

    ``signal`` is a string that represents a signal name. If 'src' is
    an HTML Element, ``window``, or the ``document``, then it can be
    one of the 'on-XYZ' events. You must include the 'on' prefix, and
    it must be all lower-case.

    ``dest`` and ``func`` describe the slot, or the action to take
    when the signal is triggered.

        -   If ``dest`` is an object and ``func`` is a string, then
            ``dest[func].apply(dest, [...])`` will be called when the
            signal is signalled.

        -   If ``dest`` is an object and ``func`` is a function, then
            ``func.apply(dest, [...])`` will be called when the signal
            is signalled.

        -   If ``func`` is undefined and ``dest`` is a function, then
            ``dest.apply(src, [...])`` will be called when the signal is
            signalled.

    No other combinations are allowed and will raise an exception.

    The return value can be passed to :mochiref:`disconnect` to
    disconnect the signal.

    In MochiKit 1.4+, if ``src`` is an object that has a ``__connect__``
    method, then ``src.__connect__(ident, signal, objOrFunc, funcOrStr)``
    will be called. This method may be used to disconnect the signal.
    DOM objects can not implement this feature.
    
    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`disconnect(ident)`:

    To disconnect a signal, pass its ident returned by
    :mochiref:`connect()`.  This is similar to how the browser's
    ``setTimeout`` and ``clearTimeout`` works.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`disconnectAll(src[, signal, ...])`:

    ``disconnectAll(src)`` removes all signals from src.

    ``disconnectAll(src, 'onmousedown', 'mySignal')`` will remove all
    ``'onmousedown'`` and ``'mySignal'`` signals from src.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`disconnectAllTo(dest[, func])`:

    ``disconnectAllTo(dest)`` removes all signals connected to dest.

    ``disconnectAllTo(dest, func)`` will remove all
    signals connected to dest using func. 

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`signal(src, signal, ...)`:

    This will signal a signal, passing whatever additional parameters
    on to the connected slots. ``src`` and ``signal`` are the same as
    for :mochiref:`connect()`.

    *Availability*:
        Available in MochiKit 1.3.1+


DOM Custom Event Object Reference
---------------------------------

:mochidef:`event()`:

    The native event produced by the browser. You should not need to
    use this.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`src()`:

    The element that this signal is connected to.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`type()`:

    The event type (``'click'``, ``'mouseover'``, ``'keypress'``,
    etc.) as a string. Does not include the ``'on'`` prefix.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`target()`:

    The element that triggered the event. This may be a child of
    :mochiref:`src()`.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`modifier()`:

    Returns ``{shift, ctrl, meta, alt, any}``, where each property is
    ``true`` if its respective modifier key was pressed, ``false``
    otherwise. ``any`` is ``true`` if any modifier is pressed,
    ``false`` otherwise.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`stopPropagation()`:

    Works like W3C's `stopPropagation()`_.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`preventDefault()`:

    Works like W3C's `preventDefault()`_.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`stop()`:

    Shortcut that calls ``stopPropagation()`` and
    ``preventDefault()``.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`key()`:

    Returns ``{code, string}``.

    Use ``'onkeydown'`` and ``'onkeyup'`` handlers to detect control
    characters such as ``'KEY_F1'``. Use the ``'onkeypress'``
    handler to detect "printable" characters, such as ``'é'``.

    When a user presses F1, in ``'onkeydown'`` and ``'onkeyup'`` this
    method returns ``{code: 122, string: 'KEY_F1'}``. In
    ``'onkeypress'``, it returns ``{code: 0, string: ''}``.

    If a user presses Shift+2 on a US keyboard, this method returns
    ``{code: 50, string: 'KEY_2'}`` in ``'onkeydown'`` and
    ``'onkeyup'``.  In ``'onkeypress'``, it returns ``{code: 64,
    string: '@'}``.

    See ``_specialKeys`` in the source code for a comprehensive list
    of control characters.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`mouse()`:

    Properties for ``'onmouse*'``, ``'onclick'``, ``'ondblclick'``,
    and ``'oncontextmenu'``:

        -   ``page`` is a :mochiref:`MochiKit.Style.Coordinates` object
            that represents the cursor position relative to the HTML
            document.  Equivalent to ``pageX`` and ``pageY`` in
            Safari, Mozilla, and Opera.

        -   ``client`` is a :mochiref:`MochiKit.Style.Coordinates`
            object that represents the cursor position relative to the
            visible portion of the HTML document. Equivalent to
            ``clientX`` and ``clientY`` on all browsers. Current versions of
            Safari incorrectly return clientX as relative to the canvas
            instead of relative to the viewport (`Safari Bug 8707`_).

    Properties for ``'onmouseup'``, ``'onmousedown'``, ``'onclick'``,
    and ``'ondblclick'``:

        -   ``mouse().button`` returns ``{left, right, middle}`` where
            each property is ``true`` if the mouse button was pressed,
            ``false`` otherwise.

    Known browser bugs:

        -   Current versions of Safari won't signal ``'ondblclick'``
            when attached via ``connect()`` (`Safari Bug 7790`_).
            
        -   In Safari < 2.0.4, calling ``preventDefault()`` or ``stop()`` 
            in ``'onclick'`` events signalled from ``<a>`` tags does not 
            prevent the browser from following those links.

        -   Mac browsers don't report right-click consistently. Firefox
            signals the slot and sets ``modifier().ctrl`` to true,
            Opera signals the slot and sets ``modifier().meta`` to
            ``true``, and Safari doesn't signal the slot at all
            (`Safari Bug 6595`_).

            To find a right-click in Safari, Firefox, and IE, you can
            connect an element to ``'oncontextmenu'``. This doesn't
            work in Opera.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`relatedTarget()`:

    Returns the document element that the mouse has moved to. This is
    generated for ``'onmouseover'`` and ``'onmouseout'`` events.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`confirmUnload(msg)`:

    In browsers that support the ``'onbeforeunload'`` event (IE and
    Firefox), calling this in the event handler will show a dialog box
    that allows the user to confirm or cancel the navigation away from
    the page.

    *Availability*:
        Available in MochiKit 1.4+


Authors
=======

-   Jonathan Gardner <jgardner@jonathangardner.net>
-   Beau Hartshorne <beau@hartshornesoftware.com>
-   Bob Ippolito <bob@redivi.com>


Copyright
=========

Copyright 2006 Jonathan Gardner <jgardner@jonathangardner.net>, Beau
Hartshorne <beau@hartshornesoftware.com>, and Bob Ippolito
<bob@redivi.com>.  This program is dual-licensed free software; you
can redistribute it and/or modify it under the terms of the `MIT
License`_ or the `Academic Free License v2.1`_.

.. _`MIT License`: http://www.opensource.org/licenses/mit-license.php
.. _`Academic Free License v2.1`: http://www.opensource.org/licenses/afl-2.1.php
