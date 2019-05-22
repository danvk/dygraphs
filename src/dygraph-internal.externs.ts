import Dygraph from "./dygraph";

// This file:
// - declares symbols that are provided outisde of dygraphs
// - defines custom types used internally

export type AxisLabelFormatter = (
  value: (number|Date),
  granularity: number,
  opts: (optionName: string) => any,
  dygraph: Dygraph|undefined
) => string;


export type ValueFormatter = (
  value: number,
  opts: (optionName: string) => any,
  dygraph: Dygraph
) => string;


export type DygraphDataArray = (string|number|number[])[][];

export type GVizDataTable = any;
