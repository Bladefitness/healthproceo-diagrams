import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

function formatName(slug) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function DiagramIndex() {
  const [diagrams, setDiagrams] = useState([]);

  useEffect(() => {
    fetch("/api/diagrams.json")
      .catch(() => fetch("/api/diagrams"))
      .then((r) => r.json())
      .then(setDiagrams)
      .catch(() => setDiagrams([]));
  }, []);

  return (
    <div className="index-container">
      <h1>HealthProCEO Diagrams</h1>
      <p>Click a diagram to view it interactively</p>
      <div className="diagram-grid">
        {diagrams.map((name) => (
          <a key={name} className="diagram-card" href={`?diagram=${name}`}>
            <h3>{formatName(name)}</h3>
            <span>{name}.excalidraw</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function computeViewport(elements) {
  const visible = elements.filter((el) => !el.isDeleted);
  if (visible.length === 0) return {};

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of visible) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + (el.width || 0));
    maxY = Math.max(maxY, el.y + (el.height || 0));
  }

  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const centerX = minX + contentW / 2;
  const centerY = minY + contentH / 2;

  // Zoom to fit with padding (assume ~1200x800 viewport)
  const zoom = Math.min(0.8, 1100 / contentW, 700 / contentH);

  return {
    scrollX: -centerX + 600 / zoom,
    scrollY: -centerY + 400 / zoom,
    zoom: { value: zoom },
  };
}

function DiagramViewer({ name }) {
  const [diagramData, setDiagramData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/diagrams/${name}.excalidraw`)
      .then((r) => {
        if (!r.ok) throw new Error("Diagram not found");
        return r.json();
      })
      .then((data) => setDiagramData(data))
      .catch((e) => setError(e.message));
  }, [name]);

  const handleExcalidrawAPI = useCallback((api) => {
    if (api) {
      setTimeout(() => {
        api.scrollToContent(api.getSceneElements(), { fitToContent: true });
      }, 500);
    }
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!diagramData) return <div className="loading">Loading diagram...</div>;

  const elements = diagramData.elements || [];
  const viewport = computeViewport(elements);

  return (
    <div className="viewer-container">
      <div className="viewer-header">
        <a href="/">← All Diagrams</a>
        <h2>{formatName(name)}</h2>
      </div>
      <div className="viewer-canvas">
        <Excalidraw
          excalidrawAPI={handleExcalidrawAPI}
          initialData={{
            elements,
            appState: {
              ...(diagramData.appState || {}),
              viewBackgroundColor:
                diagramData.appState?.viewBackgroundColor || "#ffffff",
              ...viewport,
            },
            scrollToContent: true,
          }}
          theme="light"
        />
      </div>
    </div>
  );
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const diagram = params.get("diagram");

  return diagram ? <DiagramViewer name={diagram} /> : <DiagramIndex />;
}

createRoot(document.getElementById("root")).render(<App />);
