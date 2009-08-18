.. title:: MochiKit.Selector - Selecting elements by CSS selector syntax

Name
====

MochiKit.Selector - Selecting elements by CSS selector syntax


Synopsis
========

::

    MochiKit.Base.map(MochiKit.Visual.fade, $$('p.fademe'));


Description
===========

MochiKit.Selector provides utilities to select elements by CSS
selector syntax. In particular it provides the :mochiref:`$$`
function.

Dependencies
============

- :mochiref:`MochiKit.Base`
- :mochiref:`MochiKit.DOM`
- :mochiref:`MochiKit.Iter`


Overview
========

This module provides facilities to select childs of a DOM node by
using CSS selector syntax. In particular, it provides the 
:mochiref:`$$` function, which performs such a selection on the
current document.

Many of CSS3 [1]_ selectors are supported:

- Select by tag name (``A``)
- Select by class (``.theclass``)
- Select by id (``#someid``)
- Combinators
      - Descendant: ``E F``
      - Child: ``E > F``
      - Immediate following sibling: ``E + F``
      - Following sibling: ``E ~ F`` 
- Attribute selectors
      - simple "has attribute" (without operator)
      - ``=`` equal
      - ``!=`` not equal (not in CSS std.)
      - ``~=`` word containment
      - ``^=`` starts-with
      - ``$=`` ends-with
      - ``*=`` substring containment
      - ``|=`` first part of hyphen deleimited (eg. lang|="en" matches lang="en-US") 
- Pseudo-classes
      - ``:root``, ``:nth-child``, ``:nth-last-child``, ``:nth-of-type``, ``:nth-last-of-type``, ``:first-child``, ``:last-child``, ``:first-of-type``, ``:last-of-type``, ``:only-child``, ``:only-of-type``, ``:empty``, ``:enabled``, ``:disabled``, ``:checked``, ``:not(<any other selector>)`` 

Multiple selectors can be concatenated, like this: ``P.quote[author~='Torvalds']``,
in which case elements matching *all* the selectors are returned. Furthermore, such
concatenations can be *combined* by joining them with spaces and combinators.
This invokes the regular CSS behaviour of matching parts of the combination in
sequence, starting off each part from the elements returned by the preceeding part.

For the ``:nth-*`` pseudoclasses, the ``an+b`` syntax is partially
supported, specifically a and b must be non-negative and only a is 
optional (this differs from the CSS std.) Also, ``odd`` and ``even`` 
are supported, e.g. ``table tr:nth-child(odd)`` gives you every 
other row of table starting with the first one.

For further documentation of CSS selectors, refer to the W3C CSS standard. [1]_

The original version of this module was ported from Prototype.

**Note:** Due to how Internet Explorer handles node attributes, some attribute
selectors may not work as expected. In particular ``a[title]`` will not work
as all ``A`` elements in the Internet Explorer DOM model have a title attribute
regardless of whether it's specified in the markup or not.


API Reference
=============

Functions
---------

:mochidef:`$$(expression[, ...])`:
    
    Performs a selection on the active document. Equivalent
    to ``findChildElements(MochiKit.DOM.currentDocument(), [expression, ...])``

    *Availability*:
        Available in MochiKit 1.4+


:mochidef:`findChildElements(element, expressions)`:

    Traverses the child nodes of ``element`` and returns the subset
    of those that match any of the selector expressions in ``expressions``.

    Each expression can be a combination of simple expressions, by concatenating
    them with spaces or combinators. In that case, normal CSS rules apply, each
    simple expression is evaluated in turn and the results of that one is used
    as the scope for the succeeding expression (see :mochiref:`Selector.findElements`).
    Finally, the results of the last simple expression is returned as the search result.

    *Availability*:
        Available in MochiKit 1.4+


Constructors
-------------

:mochidef:`Selector(simpleExpression)`:

    An object storing the parsed version of a simple CSS selector expression
    and providing functions for executing searches.

    *Simple* means that the expression is not a combination of expressions,
    i.e. it does not contain any spaces.
    
    Usually the user would not instantiate or use this object directly, but 
    heres how::

        var selector = MochiKit.Selector.Selector('#someelementid');
        var searchResults = selector.findElements(rootElement);

    *Availability*:
        Available in MochiKit 1.4+

:mochidef:`Selector.findElements(scope[, axis=""])`:

    Performs a search on ``scope``. The value of axis controls what relatives
    of ``scope`` are considered.

    ``scope``:
        A DOM node that acts as a starting point for the search.

    ``axis``:
        One of ``">"``, ``"+"``, ``"~"`` or the empty string (default).
        If the empty string, all descendant nodes of ``scope`` are tested against
        the expression. If ``>`` only direct child nodes of ``scope`` are tested,
        if ``+`` only the next sibling (if any) of ``scope`` is tested and if
        ``~`` all succeeding siblings of ``scope`` are tested.

    *Availability*:
        Available in MochiKit 1.4+


See Also
========

.. [1] CSS Selectors Level 3 (Last Call, oct. 2006):
       http://www.w3.org/TR/2005/WD-css3-selectors-20051215/ 


Authors
=======

- Arnar Birgisson <arnarbi@gmail.com>
- Thomas Herve <therve@gmail.com>
- Originally ported from Prototype <http://prototype.conio.net/>


Copyright
=========

Copyright 2005 Bob Ippolito <bob@redivi.com>. This program is
dual-licensed free software; you can redistribute it and/or modify it
under the terms of the `MIT License`_ or the `Academic Free License
v2.1`_.

.. _`MIT License`: http://www.opensource.org/licenses/mit-license.php
.. _`Academic Free License v2.1`: http://www.opensource.org/licenses/afl-2.1.php

Based on Prototype, (c) 2005 Sam Stephenson, available under the `Prototype
license`_

.. _`Prototype license`: http://dev.rubyonrails.org/browser/spinoffs/prototype/LICENSE?rev=3362
