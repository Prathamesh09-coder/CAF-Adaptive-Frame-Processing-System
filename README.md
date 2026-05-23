# CAF — Adaptive Frame Processing System

Adaptive Frame Processing (CAF) is a real-time system that adaptively selects and processes video frames based on motion, scene, and content signals. It provides a FastAPI backend that manages live WebSocket streams, frame scoring and selection logic, and a Vite-powered frontend for visualization and interaction.

**Key features**
- **Adaptive scoring**: Combines motion, scene-change, edge and context features to decide whether to skip, partially process, or fully process frames.
- **Real-time transport**: WebSocket endpoints for live frame ingestion and comparison streams.
- **Export / Replay**: Store selected frames and session exports to resume analysis later.
- **Pluggable models**: Includes lightweight YOLOv8 checkpoints for optional object-aware processing.

**Quick Start**

Prerequisites: `Python 3.9+`, `node 16+`/`npm` (or `pnpm`/`yarn`), and MongoDB for persistent session storage.

- Backend (API + processing)

  1. Create a virtual environment and install Python deps:

     ```bash
     python -m venv .venv
     source .venv/bin/activate
     pip install -r requirements.txt
     ```

  2. Configure environment variables (optional):

     - `MONGODB_URL` (default: `mongodb://localhost:27017`)
     - `MONGODB_DB` (default: `adaptive_frame_processor`)
     - `HOST` (default: `127.0.0.1`) and `PORT` (default: `8000`)

     Example:

     ```bash
     export MONGODB_URL=mongodb://localhost:27017
     export PORT=8000
     ```

  3. Run the backend (development):

     ```bash
     uvicorn app.main:app --reload --host $HOST --port $PORT
     ```

  4. API docs are available at `http://$HOST:$PORT/docs`.

- Frontend (UI)

  1. Install dependencies and run dev server:

     ```bash
     cd Frontend
     npm install
     npm run dev
     ```

  2. The frontend is served by Vite; open the address printed by the dev server.

**Important files & locations**
- **Backend entrypoint**: [Backend/app/main.py](Backend/app/main.py#L1)
- **Backend config**: [Backend/app/core/config.py](Backend/app/core/config.py#L1)
- **Python deps**: [requirements.txt](requirements.txt#L1)
- **Frontend app**: [Frontend/index.html](Frontend/index.html#L1)
- **Frontend package**: [Frontend/package.json](Frontend/package.json#L1)
- **YOLO models**: `Backend/yolov8n.pt`, `Backend/yolov8s.pt` (optional for object-aware modules)
- **Stored exports**: `session_exports/` — contains recorded session CSV/JSONL exports.

**Architecture overview**
- **Transport**: Frontend streams frames to the backend over WebSocket; the backend responds with selection decisions and telemetry.
- **Processing**: The backend computes feature scores (motion, scene, edges, etc.), applies the configurable `FEATURE_WEIGHTS` and `DECISION_THRESHOLDS`, and persists selected frames to `EXPORTS_DIR`.
- **Storage**: MongoDB stores session metadata; session exports are written to `session_exports/`.

**Customization & configuration**
- Processing and thresholds can be tuned in environment variables or via `Backend/app/core/config.py`.
- To change model weights, replace the files in `Backend/` and point model loaders to the desired checkpoint.

**Development tips**
- Use the FastAPI interactive docs (`/docs`) for exploring endpoints and WebSocket paths.
- Keep `uvicorn --reload` enabled during development to auto-reload code changes.

**Contributing**
- Please open issues or pull requests. Add tests for new processing logic and keep changes small and focused.

**License & Contact**
- This repository does not include a license file by default — add one if you plan to publish.
- For questions, open an issue or contact the repository owner.

**Diagrams**

System activity and processing flow are shown below (Mermaid). These diagrams describe the runtime interactions between the Frontend, Backend, and Storage, and the decision flow used to score and select frames.

Activity diagram:

```mermaid
flowchart LR
   A[Frontend (Client)] -->|WebSocket: frames| B(Backend WebSocket Ingest)
   B --> C{Frame Scoring}
   C -->|Compute features| D[Motion || Scene || Edge || Context]
   D --> E[Score Aggregation]
   E --> F{Decision Thresholds}
   F -->|score < skip| G[SKIP frame]
   F -->|skip <= score < partial| H[PARTIAL process]
   F -->|score >= partial| I[FULL process]
   H --> J[Lightweight processing / telemetry]
   I --> K[Full processing / optional model inference]
   K --> L[Persist selected frame -> Export / DB]
   G --> M[Drop or low-fidelity telemetry]
   L --> N[Session exports folder / MongoDB]
   J --> N
   M --> N
   N --> O[Frontend (replay / visualization)]
   style A fill:#eef,stroke:#333,stroke-width:1px
   style B fill:#f9f,stroke:#333,stroke-width:1px
   style K fill:#ffd,stroke:#333,stroke-width:1px
```

Processing flowchart (detailed):

```mermaid
flowchart TB
   Start([Start]) --> Receive[Receive frame via WebSocket]
   Receive --> Preproc[Pre-process (resize, decompress)]
   Preproc --> FeatureCalc[Calculate features (motion, scene, edge, context)]
   FeatureCalc --> Weighting[Apply FEATURE_WEIGHTS]
   Weighting --> Score[Aggregate score]
   Score --> Decision{Compare to DECISION_THRESHOLDS}
   Decision -->|skip| Skip[Skip frame -> optionally log telemetry]
   Decision -->|partial| Partial[Partial processing -> send reduced data back]
   Decision -->|full| Full[Full processing -> run models / extract metadata]
   Full --> Persist[Persist selected frame & metadata to EXPORTS_DIR and DB]
   Persist --> Notify[Notify client via WebSocket with decision & metadata]
   Partial --> Notify
   Skip --> Continue[Continue streaming]
   Notify --> Continue
   Continue --> End([Loop / Next frame])
```

**Comparison**

Decision outcomes and recommended usage:

| Decision | Processing cost | Typical latency | Output | Storage impact | Use case |
|---|---:|---:|---|---|---|
| SKIP | Minimal | Lowest | None or low-fidelity telemetry | Negligible | Steady scenes, low motion, conserve compute/bandwidth |
| PARTIAL | Low | Low | Reduced metadata / small thumbnails | Small | Moderate motion or when lightweight monitoring is sufficient |
| FULL | High | Higher | Full frame, metadata, optional model outputs | Significant | Important events, high motion, when detailed analysis needed |

Scenario presets (from configuration):

| Preset | Motion weight | Threshold | Model size | Recommended when |
|---|---:|---:|---:|---|
| performance_optimized | 0.4 | 0.55 | `n` (nano) | Low-latency deployments with limited compute |
| balanced | 0.3 | 0.45 | `s` (small) | General purpose, balanced accuracy and cost |
| accuracy_preserved | 0.2 | 0.35 | `m` (medium) | Prioritize detection accuracy over throughput |

