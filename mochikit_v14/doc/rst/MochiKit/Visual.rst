.. title:: MochiKit.Visual - visual effects

Name
====

MochiKit.Visual - visual effects


Synopsis
========

::

    // round the corners of all h1 elements
    roundClass("h1", null);

    // round the top left corner of the element with the id "title"
    roundElement("title", {corners: "tl"});

    // Add an fade effect to an element
    fade('myelement');


Description
===========

MochiKit.Visual provides visual effects and support functions for
visuals.


Dependencies
============

- :mochiref:`MochiKit.Base`
- :mochiref:`MochiKit.Iter`
- :mochiref:`MochiKit.DOM`
- :mochiref:`MochiKit.Color`
- :mochiref:`MochiKit.Position`

Overview
========

MochiKit.Visual provides different visual effect: rounded corners and
animations for your HTML elements. Rounded corners are created
completely through CSS manipulations and require no external images or
style sheets.  This implementation was adapted from Rico_. Dynamic
effects are ported from Scriptaculous_.

.. _Rico: http://www.openrico.org

.. _Scriptaculous: http://script.aculo.us


API Reference
=============

Functions
---------

:mochidef:`roundClass(tagName[, className[, options]])`:

    Rounds all of the elements that match the ``tagName`` and
    ``className`` specifiers, using the options provided.  ``tagName``
    or ``className`` can be ``null`` to match all tags or classes.
    For more information about the options, see the
    :mochiref:`roundElement` function.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`roundElement(element[, options])`:

    Immediately round the corners of the specified element.  The
    element can be given as either a string with the element ID, or as
    an element object.

    The options mapping has the following defaults:

    ========= =================
    corners   ``"all"``
    color     ``"fromElement"``
    bgColor   ``"fromParent"``
    blend     ``true``
    border    ``false``
    compact   ``false``
    ========= =================

    corners:

        specifies which corners of the element should be rounded.
        Choices are:

        - all
        - top
        - bottom
        - tl (top left)
        - bl (bottom left)
        - tr (top right)
        - br (bottom right)

        Example:
            ``"tl br"``: top-left and bottom-right corners are rounded

    blend:
        specifies whether the color and background color should be
        blended together to produce the border color.

    *Availability*:
        Available in MochiKit 1.3.1+


:mochidef:`toggle(element[, effect[, options]])`:

    Toggle an element between visible and invisible state using an effect.

    effect:
        One of the visual pairs to use, between 'slide', 'blind',
        'appear', and 'size'.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`tagifyText(element[, tagifyStyle])`:

    Transform a node text into nodes containing one letter by tag.

    tagifyStyle:
        style to apply to character nodes, default to 'position:
        relative'.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`multiple(elements, effect[, options])`:

    Launch the same effect on a list of elements.

    *Availability*:
        Available in MochiKit 1.4+


Basic Effects classes
---------------------

:mochidef:`DefaultOptions`:

    Default options for all Effect creation.

    =========== ========================================
    transition  ``MochiKit.Visual.Transitions.sinoidal``
    duration    ``1.0``
    fps         ``25.0``
    sync        ``false``
    from        ``0.0``
    to          ``1.0``
    delay       ``0.0``
    queue       ``'parallel'``
    =========== ========================================

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`Base()`:

    Base class to all effects. Define a basic looping service, use it
    for creating new effects.

    You can override the methods ``setup``, ``update`` and ``finish```.

    The class defines a number of events that will be called during effect
    life. The events are:

    - beforeStart
    - beforeSetup
    - beforeUpdate
    - afterUpdate
    - beforeFinish
    - afterFinish

    If you want to define your own callbacks, define it in the options
    parameter of the effect. Example::

        // I slide it up and then down again
        slideUp('myelement', {afterFinish: function () {
            slideDown('myelement');
        });
 
    Specific ``internal`` events are also available: for each one abone the
    same exists with 'Internal' (example: 'beforeStartInternal'). Their purpose
    is mainly for creating your own effect and keep the user access to event
    callbacks (not overriding the library ones).

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`Parallel(effects [, options])`:

    Launch effects in parallel.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`Opacity(element [, options])`:

    Change the opacity of an element progressively.

    options:

    ====== ========
    from   ``0.0``
    to     ``1.0``
    ====== ========

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`Move(element [, options])`:

    Change the position of an element in small steps, creating a
    moving effect.

    options:

    ========= ================
    x         ``0``
    y         ``0``
    position  ``'relative'``
    ========= ================

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`Scale(element, percent [, options])`:

    Change the size of an element.

    percent:
        Final wanted size in percent of current size. The size will be
        reduced if the value is between 0 and 100, and raised if the
        value is above 100.

    options:

    ================ ============
    scaleX           ``true``
    scaleY           ``true``
    scaleContent     ``true``
    scaleFromCenter  ``false``
    scaleMode        ``'box'``
    scaleFrom        ``100.0``
    scaleTo          ``percent``
    ================ ============

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`Highlight(element [, options])`:

    Highlight an element, flashing with one color.

    options:

    =========== ==============
    startcolor  ``'#ffff99'``
    =========== ==============

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`ScrollTo(element [, options])`:

    Scroll the window to the position of the given element.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`Morph(element [, options])`:

    Make a transformation to the given element. It's called with the option
    ``style`` with an array holding the styles to change. It works with
    properties for size (``font-size``, ``border-width``, ...) and properties
    for color (``color``, ``background-color``, ...). 

    For size, it's better to have defined the original style. You *must*
    use the same unit in the call to Morph (no translation exists between two
    different units).
    
    Parsed length are postfixed with: em, ex, px, in, cm, mm, pt, pc.
    
    Example::
        
        <div id="foo" style="font-size: 1em">MyDiv</div>
        ...
        Morph("foo", {"style": {"font-size": "2em"}});


    *Availability*:
        Available in MochiKit 1.4+


Combination Effects
-------------------

:mochidef:`fade(element [, options])`:

    Change the opacity of an element until making it disappear.

    options:

    ====== =============================================
    from   ``element.opacity || 1.0``
    to     ``0.0``
    ====== =============================================

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`appear(element [, options])`:

    Slowly show an invisible element.

    options:

    ===== =========
    from  ``0.0``
    to    ``1.0``
    ===== =========

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`puff(element [, options])`:

    Make an element double size, and then make it disappear.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`blindUp(element [, options])`:

    Blind an element up, changing its vertical size to 0.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`blindDown(element [, options])`:

    Blind an element down, restoring its vertical size.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`switchOff(element [, options])`:

    A switch-off like effect, making the element disappear.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`dropOut(element [, options])`:

    Make the element fall and fade.

    options:

    ======== =======
    distance ``100``
    ======== =======

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`shake(element [, options])`:

    Shake an element from left to right.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`slideDown(element [, options])`:

    Slide an element down.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`slideUp(element [, options])`:

    Slide an element up.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`squish(element [, options])`:

    Reduce the horizontal and vertical sizes at the same time, using
    the top left corner.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`grow(element [, options])`:

    Restore the size of an element.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`shrink(element [, options])`:

    Shrink an element to its center.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`pulsate(element [, options])`:

    Switch an element between appear and fade.

    options:

    ====== ========
    pulses ``null``
    ====== ========

    pulses controls the number of pulses made during the effect.

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`fold(element [, options])`:

    Reduce first the vertical size, and then the horizontal size.

    *Availability*:
        Available in MochiKit 1.4+


The Effects Queue
-----------------

When you create effects based on user input (mouse clicks for example), it can
create conflicts between the effects if multiple effects are running at the
same time. To manage this problem, the Queue mechanism has been introduced:
it's responsible for running the effects as you desired.

By default, you have one Queue called 'global', and the effects run in 'parallel'
(see default options). Every effects have a queue option to customize this.
It can be a string, the scope is then global:
    
- `start`: the effect will be run before any other;
- `end`: the effect will be run after any other;
- `break`: every other effects break when the the effect start;
- `parallel`: the effect run normally with others.


But you have even more control if you use an array with the following keys:

- `position` takes a value listed above;
- `scope` manages how the information has to be taken. If it's `global` 
  then it's the same information for every effects. Otherwise you can define
  your own scode. For example, if you add an effect on a specified element,
  you may use the element id as scode;
- `limit` defines how many effects can run in the current scode. If an
  effect is added whereas the limit is reached, it will never be run (it's
  lost).


See Also
========

.. [1] Application Kit Reference - NSColor: http://developer.apple.com/documentation/Cocoa/Reference/ApplicationKit/ObjC_classic/Classes/NSColor.html
.. [2] SVG 1.0 color keywords: http://www.w3.org/TR/SVG/types.html#ColorKeywords
.. [3] W3C CSS3 Color Module: http://www.w3.org/TR/css3-color/#svg-color


Authors
=======

- Kevin Dangoor <dangoor@gmail.com>
- Bob Ippolito <bob@redivi.com>
- Thomas Herve <therve@gmail.com>
- Round corners originally adapted from Rico <http://openrico.org/>
  (though little remains)
- Effects originally adapted from Script.aculo.us
  <http://script.aculo.us/>


Copyright
=========

Copyright 2005 Bob Ippolito <bob@redivi.com>.  This program is
dual-licensed free software; you can redistribute it and/or modify it
under the terms of the `MIT License`_ or the `Academic Free License
v2.1`_.

.. _`MIT License`: http://www.opensource.org/licenses/mit-license.php
.. _`Academic Free License v2.1`: http://www.opensource.org/licenses/afl-2.1.php

Portions adapted from `Rico`_ are available under the terms of the
`Apache License, Version 2.0`_.

Portions adapted from `Scriptaculous`_ are available under the terms
of the `MIT License`_.

.. _`Apache License, Version 2.0`: http://www.apache.org/licenses/LICENSE-2.0.html
