.. title:: MochiKit.DragAndDrop - drag and drop elements with MochiKit

Name
====

MochiKit.DragAndDrop - drag and drop elements with MochiKit

Synopsis
========

::

    // Create a draggable
    new Draggable('mydrag');

    // Create a corresponding droppable
    new Droppable('mydrop', {
        accept: ['drag-class'],
        ondrop: function (element) {
            alert('"' + element.id + '" was dropped on me');
        }
    });

Description
===========

MochiKit.DragAndDrop enables you the power of dragging elements
through your pages, for richer interfaces.

Dependencies
============

- :mochiref:`MochiKit.Base`
- :mochiref:`MochiKit.Iter`
- :mochiref:`MochiKit.DOM`
- :mochiref:`MochiKit.Color`
- :mochiref:`MochiKit.Visual`
- :mochiref:`MochiKit.Signal`

Overview
========

The implementation was adapted from Scriptaculous_.

.. _Scriptaculous: http://script.aculo.us

API Reference
=============

Constructors
------------

:mochidef:`Draggable(element[, options])`:

    A object that can be drag with the mouse.

    You have the following options, with corresponding default values:

    ``handle (false)``:
        Option for giving the element where starting the drag. By
        default it's the element itself, but you can either put a
        class of a subelement or the id of another element as handle.

    ``starteffect (MochiKit.Visual.Opacity)``:
        Function called once the drag has begun, taking the dragged
        element as argument. It's an effect by default but you can
        define any callback.

    ``reverteffect (MochiKit.Visual.Move)``:
        Effect applied when drag is cancelled. You have to define the
        ``revert`` option to enable the call. By default it brings the
        element back to its initial position, so you should know what
        you want when you modify this. The function should return an
        effect that can be cancelled.

    ``endeffect (MochiKit.Visual.Opacity)``:
        Pending part of starteffect. If you have modified your element
        during start, you'd usually want to revert it in the function.

    ``zindex (1000)``:
        Zindex of the drag element. By default it brings it to front.

    ``revert (false)``:
        Indicate if the reverteffect function should be called. If you
        define a function here, this function will be called before
        reverteffect, with the element as first argument.

    ``snap (false)``:
        Define the behaviour of the drag element when moving. It can
        either be a function, a value or an array of two values. If
        it's a function, it should take the (x, y) position of the
        element as arguments, and return the position draw in the
        browser. If its a value, it's used as a modulo for each
        coordinates. If it's an array, each value is applied for the
        corresponding coordinate.

    ``selectclass (null)``:
        If defined, name of CSS class applied during the drag.

    ``ghosting (null)``:
        Make a ghost from the draggable: clone it at start, then
        remove the clone at end.

    ``onchange  (MochiKit.Base.noop)``:
        Function called when updates are made on the draggable object.

    ``scroll (false)``:
        Element to scroll around, if precised. For example, 'window'
        will allow the draggable to scroll in the page.

    ``scrollSensitivity (20)``:
        Scroll sensitivity, used when scroll is used.

    ``scrollSpeed (15)``:
        Scroll speed, used when scroll is used.

    A draggable generates some signals during its lifetime: start, drag and
    end. They are available through the Draggables handler, and are called
    with a draggable as argument. You can register a callback for these events
    like this::
        
        onStart = function (draggable) {
            // Do some stuff
        };

        connect(Draggables, 'start', onStart);


    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`Droppable(element[, options])`:

    A object where you can drop a draggable.

    You have the following options, with corresponding default values:

    ``greedy (true)``:
        Stop on this droppable when a draggable drops over it.

    ``hoverclass (null)``:
        If defined, name of CSS class applied when a draggable is
        hover the droppable element (hover state).

    ``hoverfunc (MochiKit.Base.noop)``:
        Function called on hover state.

    ``accept (null)``:
        Array of CSS classes allowed to drop on this.

    ``activeclass (null)``:
        If defined, name of CSS class applied if a possible draggable
        begins its start (active state).

    ``onactive (MochiKit.Base.noop)``:
        Function called on active state.

    ``containment ([])``:
        Specify a list of elements to check for active state: only the
        children of the specified elements can be dropped. Mainly
        useful for Sortable.

    ``onhover (MochiKit.Base.noop)``:
        Specific hover function, mainly used for Sortable.

    ``ondrop (MochiKit.Base.noop)``:
        Function called when a draggable is dropped. The function
        takes three arguments: the draggable element, the droppable
        element, and the event that raised the drop.

    *Availability*:
        Available in MochiKit 1.4+


Authors
=======

- Thomas Herve <therve@gmail.com>
- Bob Ippolito <bob@redivi.com>
- Originally adapted from Script.aculo.us <http://script.aculo.us/>

Copyright
=========

Copyright 2005 Bob Ippolito <bob@redivi.com>.  This program is
dual-licensed free software; you can redistribute it and/or modify it
under the terms of the `MIT License`_ or the `Academic Free License
v2.1`_.

.. _`MIT License`: http://www.opensource.org/licenses/mit-license.php
.. _`Academic Free License v2.1`: http://www.opensource.org/licenses/afl-2.1.php

Portions adapted from `Scriptaculous`_ are available under the terms
of the `MIT License`_.


