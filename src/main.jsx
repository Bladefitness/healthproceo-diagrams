import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Excalidraw } from "@excalidraw/excalidraw";

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

function DiagramViewer({ name }) {
  const [elements, setElements] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/diagrams/${name}.excalidraw`)
      .then((r) => {
        if (!r.ok) throw new Error("Diagram not found");
        return r.json();
      })
      .then((data) => setElements(data.elements || []))
      .catch((e) => setError(e.message));
  }, [name]);

  if (error) return <div className="error">{error}</div>;
  if (!elements) return <div className="loading">Loading diagram...</div>;

  return (
    <div className="viewer-container">
      <div className="viewer-header">
        <a href="/">← All Diagrams</a>
        <h2>{formatName(name)}</h2>
      </div>
      <div className="viewer-canvas">
        <Excalidraw
          initialData={{ elements, scrollToContent: true }}
          viewModeEnabled={true}
          zenModeEnabled={true}
          gridModeEnabled={false}
          theme="dark"
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
