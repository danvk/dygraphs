/**
 * @license
 * Copyright 2006 Dan Vanderkam (danvdk@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

// This file contains typedefs and externs that are needed by the Closure Compiler.

export interface DygraphInteractionContext {
  px: number;
  py: number;
  isZooming: boolean;
  isPanning: boolean;
  is2DPan: boolean;
  cancelNextDblclick: boolean;
  initializeMouseDown: (e: Event, dygraph: any, context: any) => void;
}

/**
 * Point structure.
 *
 * xval_* and yval_* are the original unscaled data values,
 * while x_* and y_* are scaled to the range (0.0-1.0) for plotting.
 * yval_stacked is the cumulative Y value used for stacking graphs,
 * and bottom/top/minus/plus are used for error bar graphs.
 */
export interface DygraphPointType {
    idx: number;
    name: string;
    x?: number;
    xval?: number;
    y_bottom?: number;
    y?: number;
    y_stacked?: number;
    y_top?: number;
    yval_minus?: number;
    yval?: number;
    yval_plus?: number;
    yval_stacked?: any;
}

 export interface DygraphAxisType {
   minxval: number;
   minyval: number;
   minval: number;
   maxval: number;
   xlogscale: number;
   ylogscale: number;
   yscale: number;
 }

/** Placeholder for TS conversion. Should be Dygraph. */
export type DygraphAny = any;
