import { createContext } from "react";
import { EMPTY_HIGHLIGHT, type Highlight } from "./selection";

/**
 * Carries the current highlight to node internals. A context rather than node data so highlighting
 * never rewrites node objects, which would churn identity and invite a relayout.
 */
export const HighlightContext = createContext<Highlight>(EMPTY_HIGHLIGHT);
