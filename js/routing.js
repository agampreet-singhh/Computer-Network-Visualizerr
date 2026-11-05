// ========================================================
// Routing Algorithms Simulator: Dijkstra & Distance Vector
// ========================================================

// Graph definition for Dijkstra visualizer
const ROUTING_NODES = [
    { id: "A", label: "Router A", x: 120, y: 150 },
    { id: "B", label: "Router B", x: 260, y: 80 },
    { id: "C", label: "Router C", x: 260, y: 240 },
    { id: "D", label: "Router D", x: 420, y: 80 },
    { id: "E", label: "Router E", x: 420, y: 240 },
    { id: "F", label: "Router F", x: 560, y: 160 }
];

const ROUTING_EDGES = [
    { u: "A", v: "B", weight: 4 },
    { u: "A", v: "C", weight: 2 },
    { u: "B", v: "C", weight: 1 },
    { u: "B", v: "D", weight: 5 },
    { u: "C", v: "D", weight: 8 },
    { u: "C", v: "E", weight: 10 },
    { u: "D", v: "E", weight: 2 },
    { u: "D", v: "F", weight: 6 },
    { u: "E", v: "F", weight: 3 }
];

let dijkstraSteps = [];
let currentStepIdx = 0;
let autoPlayInterval = null;

// Initialize Routing Canvas & Algorithms
function initRoutingPage() {
    const canvas = document.getElementById("routingCanvas");
    if (!canvas) return;

    // Populate dropdowns
    const srcSel = document.getElementById("dijkstraSource");
    const dstSel = document.getElementById("dijkstraTarget");
    srcSel.innerHTML = "";
    dstSel.innerHTML = "";

    ROUTING_NODES.forEach(n => {
        srcSel.innerHTML += `<option value="${n.id}">${n.label} (${n.id})</option>`;
        dstSel.innerHTML += `<option value="${n.id}">${n.label} (${n.id})</option>`;
    });

    srcSel.value = "A";
    dstSel.value = "F";

    calculateDijkstraSteps();
    renderDijkstraStep(0);
    renderDistanceVectorTables();
}

// Compute all discrete steps of Dijkstra for step-by-step playback
function calculateDijkstraSteps() {
    const src = document.getElementById("dijkstraSource").value;
    const dst = document.getElementById("dijkstraTarget").value;

    dijkstraSteps = [];

    // Adjacency list
    const adj = {};
    ROUTING_NODES.forEach(n => adj[n.id] = []);
    ROUTING_EDGES.forEach(e => {
        adj[e.u].push({ node: e.v, weight: e.weight });
        adj[e.v].push({ node: e.u, weight: e.weight });
    });

    const dist = {};
    const prev = {};
    const visited = new Set();
    const unvisited = new Set(ROUTING_NODES.map(n => n.id));

    ROUTING_NODES.forEach(n => {
        dist[n.id] = Infinity;
        prev[n.id] = null;
    });
    dist[src] = 0;

    // Step 0: Initialization
    dijkstraSteps.push({
        stepName: "Step 0: Initialization",
        explanation: `Distance to source node <strong>${src}</strong> initialized to 0. All other nodes initialized to ∞ (infinity).`,
        currentNode: null,
        dist: { ...dist },
        prev: { ...prev },
        visited: new Set(visited),
        shortestPath: []
    });

    while (unvisited.size > 0) {
        // Find unvisited node with smallest distance
        let curr = null;
        let smallestDist = Infinity;
        for (const u of unvisited) {
            if (dist[u] < smallestDist) {
                smallestDist = dist[u];
                curr = u;
            }
        }

        if (curr === null || smallestDist === Infinity) {
            // Remaining nodes are unreachable
            break;
        }

        unvisited.delete(curr);
        visited.add(curr);

        // Step: Visiting node
        dijkstraSteps.push({
            stepName: `Inspecting Node ${curr}`,
            explanation: `Node <strong>${curr}</strong> has the smallest tentative distance (${smallestDist}). Mark ${curr} as permanently visited. Now inspecting its neighboring links...`,
            currentNode: curr,
            dist: { ...dist },
            prev: { ...prev },
            visited: new Set(visited),
            shortestPath: []
        });

        // Relax neighbors
        for (const neighbor of adj[curr]) {
            if (!visited.has(neighbor.node)) {
                const alt = dist[curr] + neighbor.weight;
                if (alt < dist[neighbor.node]) {
                    const oldDist = dist[neighbor.node] === Infinity ? "∞" : dist[neighbor.node];
                    dist[neighbor.node] = alt;
                    prev[neighbor.node] = curr;

                    dijkstraSteps.push({
                        stepName: `Relaxing Link ${curr} ➔ ${neighbor.node}`,
                        explanation: `Updated distance to <strong>${neighbor.node}</strong>: ${dist[curr]} + ${neighbor.weight} = <strong>${alt}</strong> (shorter than previous ${oldDist}) via ${curr}.`,
                        currentNode: curr,
                        activeNeighbor: neighbor.node,
                        dist: { ...dist },
                        prev: { ...prev },
                        visited: new Set(visited),
                        shortestPath: []
                    });
                }
            }
        }

        if (curr === dst) {
            // Reached target
            break;
        }
    }

    // Build final shortest path
    const path = [];
    let pCurr = dst;
    while (pCurr !== null) {
        path.unshift(pCurr);
        pCurr = prev[pCurr];
    }

    const pathFound = (path.length > 0 && path[0] === src);
    const totalCost = dist[dst];

    dijkstraSteps.push({
        stepName: "Execution Complete: Shortest Path Found",
        explanation: pathFound 
            ? `Optimal shortest path from <strong>${src}</strong> to <strong>${dst}</strong> is: <strong style="color: #16a34a;">${path.join(" ➔ ")}</strong> with total metric cost = <strong>${totalCost}</strong>.`
            : `No route available between ${src} and ${dst}.`,
        currentNode: null,
        dist: { ...dist },
        prev: { ...prev },
        visited: new Set(visited),
        shortestPath: pathFound ? path : []
    });

    currentStepIdx = 0;
}

// Render Dijkstra step on Canvas & Table
function renderDijkstraStep(idx) {
    if (idx < 0 || idx >= dijkstraSteps.length) return;
    currentStepIdx = idx;
    const step = dijkstraSteps[idx];

    // Update Status Cards
    document.getElementById("dijkstraStepTitle").innerHTML = step.stepName;
    document.getElementById("dijkstraExplanation").innerHTML = step.explanation;
    document.getElementById("stepCounterBadge").textContent = `Step ${idx + 1} of ${dijkstraSteps.length}`;

    // Update Table
    const tbody = document.getElementById("dijkstraTableBody");
    tbody.innerHTML = "";
    ROUTING_NODES.forEach(n => {
        const d = step.dist[n.id];
        const p = step.prev[n.id] ? step.prev[n.id] : "—";
        const isVisited = step.visited.has(n.id);
        const isCurrent = step.currentNode === n.id;

        const row = document.createElement("tr");
        if (isCurrent) row.style.backgroundColor = "#fef3c7";
        else if (isVisited) row.style.backgroundColor = "#ecfdf5";

        row.innerHTML = `
            <td><strong>${n.label} (${n.id})</strong></td>
            <td><code>${d === Infinity ? "∞" : d}</code></td>
            <td><strong>${p}</strong></td>
            <td>
                ${isCurrent 
                    ? `<span style="color:#d97706;font-weight:bold;">● Active</span>` 
                    : (isVisited 
                        ? `<span style="color:#16a34a;font-weight:bold;">✓ Permanent</span>` 
                        : `<span style="color:#64748b;">Tentative</span>`)}
            </td>
        `;
        tbody.appendChild(row);
    });

    // Draw Canvas
    drawRoutingGraph(step);

    // Button states
    document.getElementById("dijkstraPrevBtn").disabled = (idx === 0);
    document.getElementById("dijkstraNextBtn").disabled = (idx === dijkstraSteps.length - 1);
}

function drawRoutingGraph(step) {
    const canvas = document.getElementById("routingCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width = canvas.parentElement.clientWidth || 680;
    const h = canvas.height = 340;

    ctx.clearRect(0, 0, w, h);

    // Draw Links
    ROUTING_EDGES.forEach(e => {
        const uNode = ROUTING_NODES.find(n => n.id === e.u);
        const vNode = ROUTING_NODES.find(n => n.id === e.v);
        if (!uNode || !vNode) return;

        // Check if edge is in final shortest path
        let isPathEdge = false;
        if (step.shortestPath && step.shortestPath.length > 1) {
            for (let i = 0; i < step.shortestPath.length - 1; i++) {
                const p1 = step.shortestPath[i];
                const p2 = step.shortestPath[i + 1];
                if ((e.u === p1 && e.v === p2) || (e.u === p2 && e.v === p1)) {
                    isPathEdge = true;
                    break;
                }
            }
        }

        ctx.beginPath();
        ctx.moveTo(uNode.x, uNode.y);
        ctx.lineTo(vNode.x, vNode.y);
        ctx.strokeStyle = isPathEdge ? "#16a34a" : "#94a3b8";
        ctx.lineWidth = isPathEdge ? 5 : 2;
        ctx.stroke();

        // Edge cost badge
        const midX = (uNode.x + vNode.x) / 2;
        const midY = (uNode.y + vNode.y) / 2;
        ctx.fillStyle = isPathEdge ? "#dcfce7" : "#ffffff";
        ctx.strokeStyle = isPathEdge ? "#16a34a" : "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.fillRect(midX - 12, midY - 10, 24, 20);
        ctx.strokeRect(midX - 12, midY - 10, 24, 20);

        ctx.fillStyle = isPathEdge ? "#15803d" : "#1e293b";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(e.weight.toString(), midX, midY);
    });

    // Draw Nodes
    ROUTING_NODES.forEach(n => {
        const isCurrent = step.currentNode === n.id;
        const isVisited = step.visited.has(n.id);
        const inPath = step.shortestPath.includes(n.id);

        let nodeColor = "#3b82f6"; // default blue
        if (inPath) nodeColor = "#16a34a"; // green
        else if (isCurrent) nodeColor = "#f59e0b"; // yellow
        else if (isVisited) nodeColor = "#0284c7"; // permanent

        // Glow ring for current node
        if (isCurrent) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, 28, 0, Math.PI * 2);
            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node Label
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.id, n.x, n.y);

        // Distance text below node
        const d = step.dist[n.id];
        ctx.font = "bold 11px monospace";
        ctx.fillStyle = "#1e293b";
        ctx.fillText(`d=${d === Infinity ? "∞" : d}`, n.x, n.y + 32);
    });
}

function nextDijkstraStep() {
    if (currentStepIdx < dijkstraSteps.length - 1) {
        renderDijkstraStep(currentStepIdx + 1);
    }
}

function prevDijkstraStep() {
    if (currentStepIdx > 0) {
        renderDijkstraStep(currentStepIdx - 1);
    }
}

function resetDijkstra() {
    stopAutoPlay();
    calculateDijkstraSteps();
    renderDijkstraStep(0);
}

function runDijkstraToCompletion() {
    stopAutoPlay();
    renderDijkstraStep(dijkstraSteps.length - 1);
}

function autoPlayDijkstra() {
    stopAutoPlay();
    autoPlayInterval = setInterval(() => {
        if (currentStepIdx < dijkstraSteps.length - 1) {
            nextDijkstraStep();
        } else {
            stopAutoPlay();
        }
    }, 1200);
}

function stopAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
}

// --------------------------------------------------------
// Distance Vector Routing Tables (Bellman-Ford / RIP)
// --------------------------------------------------------
function renderDistanceVectorTables() {
    const container = document.getElementById("dvRoutingTables");
    if (!container) return;

    // Standard converged tables for 4-router sub-network
    const tables = [
        {
            router: "Router A",
            routes: [
                { dest: "A", cost: 0, nextHop: "Direct" },
                { dest: "B", cost: 3, nextHop: "B" },
                { dest: "C", cost: 2, nextHop: "C" },
                { dest: "D", cost: 6, nextHop: "B" }
            ]
        },
        {
            router: "Router B",
            routes: [
                { dest: "A", cost: 3, nextHop: "A" },
                { dest: "B", cost: 0, nextHop: "Direct" },
                { dest: "C", cost: 1, nextHop: "C" },
                { dest: "D", cost: 3, nextHop: "D" }
            ]
        },
        {
            router: "Router C",
            routes: [
                { dest: "A", cost: 2, nextHop: "A" },
                { dest: "B", cost: 1, nextHop: "B" },
                { dest: "C", cost: 0, nextHop: "Direct" },
                { dest: "D", cost: 4, nextHop: "B" }
            ]
        },
        {
            router: "Router D",
            routes: [
                { dest: "A", cost: 6, nextHop: "B" },
                { dest: "B", cost: 3, nextHop: "B" },
                { dest: "C", cost: 4, nextHop: "B" },
                { dest: "D", cost: 0, nextHop: "Direct" }
            ]
        }
    ];

    let html = "";
    tables.forEach(t => {
        html += `
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 10px;">
                <h4 style="font-size: 13px; color: #1f4e79; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                    ${t.router} Table
                </h4>
                <table class="data-table" style="font-size: 11px; margin-top: 4px;">
                    <tr><th>Dest</th><th>Cost</th><th>Next Hop</th></tr>
                    ${t.routes.map(r => `
                        <tr>
                            <td><strong>${r.dest}</strong></td>
                            <td><code>${r.cost}</code></td>
                            <td>${r.nextHop}</td>
                        </tr>
                    `).join("")}
                </table>
            </div>
        `;
    });

    container.innerHTML = html;
}

