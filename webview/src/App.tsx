import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  ViewportPortal,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Component,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import "./App.css";
import "./theme.css";
import { MarkerDefs } from "./edges/markers";
import { applyEdgeStyling } from "./edges/cardinality";
import { GroupHulls } from "./groups/GroupHulls";
import { computeHulls, type Hull } from "./groups/hulls";
import { layout } from "./layout";
import { nodeTypes } from "./nodes";
import type { SchemaModel } from "./schema";
import { applyTheme } from "./theme";
import { type FlowEdge, type FlowNode, toFlow } from "./transform";

declare global {
  interface Window {
    render: (json: string, structuralHash: string) => void;
    applyTheme: (vars: Record<string, string>) => void;
    __onNavigate?: (payload: {
      kind: "table" | "column" | "enum";
      offset: number;
    }) => void;
    __dbmlReady?: boolean;
  }
}

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return <div className="dbml-fallback">The diagram could not render.</div>;
    }
    return this.props.children;
  }
}

interface RenderState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  hulls: Hull[];
  banner: string | null;
}

function Diagram() {
  const [state, setState] = useState<RenderState>({
    nodes: [],
    edges: [],
    hulls: [],
    banner: null,
  });
  const lastHash = useRef<string | null>(null);
  const groupsRef = useRef<SchemaModel["groups"]>([]);

  const doRender = useCallback(async (json: string, hash: string) => {
    let schema: SchemaModel;
    try {
      schema = JSON.parse(json) as SchemaModel;
    } catch {
      setState((s) => ({ ...s, banner: "Could not render: invalid schema data." }));
      return;
    }
    try {
      const { nodes, edges, danglingCount } = toFlow(schema);
      const styledEdges = edges.map(applyEdgeStyling);
      groupsRef.current = schema.groups;

      const parts: string[] = [];
      if (schema.parseErrorCount > 0) parts.push(`${schema.parseErrorCount} parse error(s)`);
      if (danglingCount > 0) parts.push(`${danglingCount} unresolved relation(s)`);
      const banner = parts.length ? parts.join(", ") : null;

      if (hash === lastHash.current) {
        setState((prev) => {
          const positions = new Map(prev.nodes.map((n) => [n.id, n.position]));
          const merged = nodes.map((n) => ({
            ...n,
            position: positions.get(n.id) ?? n.position,
          }));
          return {
            nodes: merged,
            edges: styledEdges,
            hulls: computeHulls(groupsRef.current, merged),
            banner,
          };
        });
        return;
      }

      const positioned = await layout(nodes, styledEdges);
      lastHash.current = hash;
      setState({
        nodes: positioned,
        edges: styledEdges,
        hulls: computeHulls(groupsRef.current, positioned),
        banner,
      });
    } catch (e) {
      // Surface transform/layout failures instead of leaving a blank canvas.
      setState((s) => ({ ...s, banner: `Render error: ${String(e)}` }));
    }
  }, []);

  useEffect(() => {
    window.render = (json, hash) => void doRender(json, hash);
    window.applyTheme = (vars) => applyTheme(vars);
    // Handshake: set a flag AND dispatch the event so the host wins either race
    // (host attaches its listener before or after this effect runs).
    window.__dbmlReady = true;
    window.dispatchEvent(new Event("dbml-webview-ready"));
    return () => {
      // leave stubs in place; Phase 3 owns lifecycle
    };
  }, [doRender]);

  const onPaneClickCapture = useCallback((e: ReactMouseEvent) => {
    const el = (e.target as HTMLElement).closest("[data-kind]") as HTMLElement | null;
    if (!el || !window.__onNavigate) return;
    const kind = el.getAttribute("data-kind") as "table" | "column" | "enum";
    const offset = Number(el.getAttribute("data-offset"));
    if (Number.isFinite(offset)) window.__onNavigate({ kind, offset });
  }, []);

  return (
    <div className="dbml-app" onClickCapture={onPaneClickCapture}>
      {state.banner ? <div className="dbml-banner">{state.banner}</div> : null}
      <MarkerDefs />
      <ReactFlow
        nodes={state.nodes}
        edges={state.edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
        <ViewportPortal>
          <GroupHulls hulls={state.hulls} />
        </ViewportPortal>
      </ReactFlow>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ReactFlowProvider>
        <Diagram />
      </ReactFlowProvider>
    </ErrorBoundary>
  );
}
