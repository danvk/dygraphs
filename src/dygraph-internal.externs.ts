// This file:
// - declares symbols that are provided outisde of dygraphs
// - defines custom types used internally

import {DygraphAny} from './dygraph-types';

export type AxisLabelFormatter = (
  value: (number|Date),
  granularity: number,
  opts: (optionName: string) => any,
  dygraph: DygraphAny|undefined
) => string;


export type ValueFormatter = (
  value: number,
  opts: (optionName: string) => any,
  dygraph: DygraphAny
) => string;


export type DygraphDataArray = (string|number|number[])[][];

export type GVizDataTable = any;
