// ========================================================
// Network Topology Visualizer & Packet Simulation Engine
// ========================================================

const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");

// Node Types and their drawing properties
const DEVICE_TYPES = {
    pc: { label: "PC", icon: "💻", color: "#3b82f6", defaultPrefix: "PC" },
    switch: { label: "Switch", icon: "🔀", color: "#10b981", defaultPrefix: "SW" },
    router: { label: "Router", icon: "🌐", color: "#f59e0b", defaultPrefix: "R" },
    server: { label: "Server", icon: "🗄️", color: "#8b5cf6", defaultPrefix: "SRV" }
};

// Simulation State
let nodes = [];
let links = [];
let selectedNode = null;
let activeTool = "select"; // 'select', 'connect', 'delete', or device type ('pc','switch','router','server')
let connectSourceNode = null;
let isDragging = false;
let dragNode = null;
let dragOffset = { x: 0, y: 0 };
let animatingPackets = []; // { x, y, path, pathIndex, progress, speed, color, type, isReturn }

let nodeCounter = 1;

// Initialize Canvas resolution & listeners
function initTopology() {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    // Load initial Star topology so canvas is never blank
    loadPresetTopology("star");

    // Animation Loop
    requestAnimationFrame(renderLoop);
}

function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth || 700;
    canvas.height = 480;
    drawNetwork();
}

// Set Active Tool
function setTool(toolName) {
    activeTool = toolName;
    connectSourceNode = null;

    // Update UI highlights
    document.querySelectorAll(".palette-item").forEach(el => {
        el.classList.toggle("active", el.dataset.tool === toolName);
    });

    logMessage(`Active Tool: ${toolName.toUpperCase()}`, "info");
    drawNetwork();
}

// Generate realistic mock IP/MAC
function generateIP(type, id) {
    if (type === "router") return `192.168.${id}.1`;
    if (type === "switch") return `Layer 2 (No IP)`;
    if (type === "server") return `192.168.1.100`;
    return `192.168.1.${10 + id}`;
}

function generateMAC(id) {
    const hex = (id + 10).toString(16).padStart(2, "0");
    return `00:1A:2B:3C:4D:${hex.toUpperCase()}`;
}

// Add Node
function addNode(type, x, y) {
    const id = nodeCounter++;
    const def = DEVICE_TYPES[type];
    const newNode = {
        id: id,
        type: type,
        name: `${def.defaultPrefix}${id}`,
        x: x,
        y: y,
        radius: 24,
        ip: generateIP(type, id),
        mac: generateMAC(id),
        status: "Online"
    };
    nodes.push(newNode);
    updateNodeSelectDropdowns();
    logMessage(`Added ${newNode.name} (${def.label}) at (${Math.round(x)}, ${Math.round(y)})`, "info");
    selectDevice(newNode);
    return newNode;
}

// Add Link between two nodes
function addLink(nodeA, nodeB) {
    if (nodeA.id === nodeB.id) return;
    const exists = links.some(l => 
        (l.source.id === nodeA.id && l.target.id === nodeB.id) ||
        (l.source.id === nodeB.id && l.target.id === nodeA.id)
    );
    if (!exists) {
        links.push({
            id: `link_${nodeA.id}_${nodeB.id}`,
            source: nodeA,
            target: nodeB,
            bandwidth: "100 Mbps",
            latency: Math.floor(Math.random() * 5 + 2) + " ms"
        });
        logMessage(`Connected ${nodeA.name} <---> ${nodeB.name}`, "success");
    } else {
        logMessage(`Link already exists between ${nodeA.name} and ${nodeB.name}`, "error");
    }
}

// Mouse Event Handlers
function getCanvasMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function getNodeAtPosition(x, y) {
    for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const dist = Math.hypot(n.x - x, n.y - y);
        if (dist <= n.radius) {
            return n;
        }
    }
    return null;
}

function handleMouseDown(e) {
    const pos = getCanvasMousePos(e);
    const clickedNode = getNodeAtPosition(pos.x, pos.y);

    if (["pc", "switch", "router", "server"].includes(activeTool)) {
        addNode(activeTool, pos.x, pos.y);
        setTool("select");
        drawNetwork();
        return;
    }

    if (activeTool === "connect") {
        if (clickedNode) {
            if (!connectSourceNode) {
                connectSourceNode = clickedNode;
                logMessage(`Connection source selected: ${clickedNode.name}. Click destination node.`, "info");
            } else {
                addLink(connectSourceNode, clickedNode);
                connectSourceNode = null;
            }
            drawNetwork();
        }
        return;
    }

    if (activeTool === "delete") {
        if (clickedNode) {
            deleteNode(clickedNode);
        }
        return;
    }

    // Select & Drag
    if (clickedNode) {
        selectedNode = clickedNode;
        isDragging = true;
        dragNode = clickedNode;
        dragOffset.x = pos.x - clickedNode.x;
        dragOffset.y = pos.y - clickedNode.y;
        selectDevice(clickedNode);
    } else {
        selectedNode = null;
        clearInspector();
    }
    drawNetwork();
}

function handleMouseMove(e) {
    const pos = getCanvasMousePos(e);
    if (isDragging && dragNode) {
        dragNode.x = Math.max(30, Math.min(canvas.width - 30, pos.x - dragOffset.x));
        dragNode.y = Math.max(30, Math.min(canvas.height - 30, pos.y - dragOffset.y));
        drawNetwork();
    }
}

function handleMouseUp() {
    isDragging = false;
    dragNode = null;
}

// Delete Selected Node
function deleteNode(nodeToDelete) {
    nodes = nodes.filter(n => n.id !== nodeToDelete.id);
    links = links.filter(l => l.source.id !== nodeToDelete.id && l.target.id !== nodeToDelete.id);
    if (selectedNode && selectedNode.id === nodeToDelete.id) {
        selectedNode = null;
        clearInspector();
    }
    updateNodeSelectDropdowns();
    logMessage(`Removed node ${nodeToDelete.name}`, "error");
    drawNetwork();
}

function deleteSelected() {
    if (selectedNode) {
        deleteNode(selectedNode);
    } else {
        alert("Please click on a node in the canvas to select it first!");
    }
}

function clearAllTopology() {
    if (confirm("Are you sure you want to clear the entire topology?")) {
        nodes = [];
        links = [];
        selectedNode = null;
        animatingPackets = [];
        nodeCounter = 1;
        clearInspector();
        updateNodeSelectDropdowns();
        logMessage("Topology cleared.", "info");
        drawNetwork();
    }
}

// Preset Topologies
function loadPresetTopology(type) {
    nodes = [];
    links = [];
    selectedNode = null;
    animatingPackets = [];
    nodeCounter = 1;
    const cw = canvas.width || 700;
    const ch = canvas.height || 480;
    const cx = cw / 2;
    const cy = ch / 2;

    if (type === "star") {
        const sw = addNode("switch", cx, cy);
        const pc1 = addNode("pc", cx - 180, cy - 120);
        const pc2 = addNode("pc", cx + 180, cy - 120);
        const pc3 = addNode("pc", cx - 180, cy + 120);
        const pc4 = addNode("server", cx + 180, cy + 120);
        addLink(pc1, sw);
        addLink(pc2, sw);
        addLink(pc3, sw);
        addLink(pc4, sw);
        logMessage("Loaded Preset: Star Topology (Central Switch + Hosts)", "info");
    } else if (type === "ring") {
        const r1 = addNode("router", cx - 140, cy - 110);
        const r2 = addNode("router", cx + 140, cy - 110);
        const r3 = addNode("router", cx + 180, cy + 90);
        const r4 = addNode("router", cx - 180, cy + 90);
        addLink(r1, r2);
        addLink(r2, r3);
        addLink(r3, r4);
        addLink(r4, r1);
        const pc1 = addNode("pc", cx - 240, cy - 110);
        const srv = addNode("server", cx + 260, cy + 90);
        addLink(pc1, r1);
        addLink(srv, r3);
        logMessage("Loaded Preset: Ring Topology (Token/FDDI style ring)", "info");
    } else if (type === "mesh") {
        const r1 = addNode("router", cx - 130, cy - 110);
        const r2 = addNode("router", cx + 130, cy - 110);
        const r3 = addNode("router", cx + 130, cy + 110);
        const r4 = addNode("router", cx - 130, cy + 110);
        // Full mesh
        addLink(r1, r2);
        addLink(r2, r3);
        addLink(r3, r4);
        addLink(r4, r1);
        addLink(r1, r3);
        addLink(r2, r4);
        logMessage("Loaded Preset: Full Mesh Topology (Redundant multi-links)", "info");
    } else if (type === "bus") {
        const yLine = cy;
        const sw1 = addNode("switch", cx - 180, yLine);
        const sw2 = addNode("switch", cx, yLine);
        const sw3 = addNode("switch", cx + 180, yLine);
        addLink(sw1, sw2);
        addLink(sw2, sw3);
        const pc1 = addNode("pc", cx - 180, yLine - 110);
        const pc2 = addNode("pc", cx, yLine - 110);
        const pc3 = addNode("pc", cx + 180, yLine - 110);
        const srv = addNode("server", cx + 180, yLine + 110);
        addLink(pc1, sw1);
        addLink(pc2, sw2);
        addLink(pc3, sw3);
        addLink(srv, sw3);
        logMessage("Loaded Preset: Bus Backbone Topology", "info");
    }

    updateNodeSelectDropdowns();
    drawNetwork();
}

// Canvas Rendering
function drawNetwork() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Links
    links.forEach(l => {
        ctx.beginPath();
        ctx.moveTo(l.source.x, l.source.y);
        ctx.lineTo(l.target.x, l.target.y);
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw latency pill in middle of link
        const midX = (l.source.x + l.target.x) / 2;
        const midY = (l.source.y + l.target.y) / 2;
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(midX - 16, midY - 9, 32, 18);
        ctx.strokeRect(midX - 16, midY - 9, 32, 18);
        ctx.fillStyle = "#475569";
        ctx.font = "9px Arial";
        ctx.textAlign = "center";
        ctx.fillText(l.latency, midX, midY + 3);
    });

    // If connecting in progress, draw temporary line to mouse (or indicator)
    if (activeTool === "connect" && connectSourceNode) {
        ctx.beginPath();
        ctx.arc(connectSourceNode.x, connectSourceNode.y, connectSourceNode.radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw Nodes
    nodes.forEach(n => {
        const isSelected = selectedNode && selectedNode.id === n.id;
        const def = DEVICE_TYPES[n.type];

        // Selection ring
        if (isSelected) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.radius + 7, 0, Math.PI * 2);
            ctx.strokeStyle = "#0284c7";
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = def.color;
        ctx.fill();
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node Icon
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(def.icon, n.x, n.y);

        // Label
        ctx.font = "bold 11px Arial";
        ctx.fillStyle = "#0f172a";
        ctx.fillText(n.name, n.x, n.y + n.radius + 14);

        // IP subtitle
        ctx.font = "10px monospace";
        ctx.fillStyle = "#64748b";
        ctx.fillText(n.ip, n.x, n.y + n.radius + 26);
    });

    // Draw Animating Packets
    animatingPackets.forEach(pkt => {
        ctx.beginPath();
        ctx.arc(pkt.x, pkt.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = pkt.color || "#ef4444";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Packet label
        ctx.font = "bold 9px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(pkt.isReturn ? "ACK" : "DATA", pkt.x, pkt.y - 10);
    });
}

// Packet Animation Engine
function renderLoop() {
    let needsRedraw = false;

    for (let i = animatingPackets.length - 1; i >= 0; i--) {
        const pkt = animatingPackets[i];
        needsRedraw = true;
        pkt.progress += pkt.speed;

        const currentHop = pkt.path[pkt.pathIndex];
        const nextHop = pkt.path[pkt.pathIndex + 1];

        if (!nextHop) {
            // Reached destination!
            animatingPackets.splice(i, 1);
            onPacketDelivered(pkt);
            continue;
        }

        pkt.x = currentHop.x + (nextHop.x - currentHop.x) * pkt.progress;
        pkt.y = currentHop.y + (nextHop.y - currentHop.y) * pkt.progress;

        if (pkt.progress >= 1.0) {
            pkt.progress = 0;
            pkt.pathIndex++;
            if (pkt.pathIndex >= pkt.path.length - 1) {
                animatingPackets.splice(i, 1);
                onPacketDelivered(pkt);
            }
        }
    }

    if (needsRedraw || isDragging) {
        drawNetwork();
    }

    requestAnimationFrame(renderLoop);
}

// Handle packet reaching its goal
function onPacketDelivered(pkt) {
    if (!pkt.isReturn) {
        logMessage(`[PACKET RECEIVED] ${pkt.type} reached ${pkt.dstNode.name}! Sending ACK reply...`, "success");
        // Trigger reverse return ACK packet
        const returnPath = [...pkt.path].reverse();
        animatingPackets.push({
            x: returnPath[0].x,
            y: returnPath[0].y,
            path: returnPath,
            pathIndex: 0,
            progress: 0,
            speed: 0.035,
            color: "#22c55e",
            type: "ACK",
            srcNode: pkt.dstNode,
            dstNode: pkt.srcNode,
            isReturn: true
        });
    } else {
        const rtt = Math.floor(Math.random() * 20 + 8);
        logMessage(`[PING SUCCESS] Reply from ${pkt.srcNode.ip}: bytes=32 time=${rtt}ms TTL=64`, "success");
        logMessage(`Packets: Sent = 1, Received = 1, Lost = 0 (0% loss)`, "info");
    }
}

// BFS Pathfinding Algorithm
function findShortestPath(startNode, targetNode) {
    const queue = [[startNode]];
    const visited = new Set([startNode.id]);

    while (queue.length > 0) {
        const currentPath = queue.shift();
        const currentNode = currentPath[currentPath.length - 1];

        if (currentNode.id === targetNode.id) {
            return currentPath;
        }

        // Find neighbors
        const neighbors = [];
        links.forEach(l => {
            if (l.source.id === currentNode.id) neighbors.push(l.target);
            if (l.target.id === currentNode.id) neighbors.push(l.source);
        });

        for (const neighbor of neighbors) {
            if (!visited.has(neighbor.id)) {
                visited.add(neighbor.id);
                queue.push([...currentPath, neighbor]);
            }
        }
    }

    return null; // No path found
}

// Trigger Packet Transmission from UI
function triggerSendPacket() {
    const srcSelect = document.getElementById("packetSourceSelect");
    const dstSelect = document.getElementById("packetDestSelect");
    const protoSelect = document.getElementById("packetTypeSelect");

    const srcId = parseInt(srcSelect.value);
    const dstId = parseInt(dstSelect.value);
    const pType = protoSelect.value;

    if (isNaN(srcId) || isNaN(dstId)) {
        alert("Please ensure you have at least 2 devices on the canvas!");
        return;
    }

    if (srcId === dstId) {
        alert("Source and Destination cannot be the same device!");
        return;
    }

    const srcNode = nodes.find(n => n.id === srcId);
    const dstNode = nodes.find(n => n.id === dstId);

    if (!srcNode || !dstNode) return;

    logMessage(`--- Initiating ${pType} from ${srcNode.name} (${srcNode.ip}) to ${dstNode.name} (${dstNode.ip}) ---`, "info");

    const path = findShortestPath(srcNode, dstNode);

    if (!path) {
        logMessage(`[ERROR] Destination host unreachable! No network path connects ${srcNode.name} to ${dstNode.name}.`, "error");
        logMessage(`Request timed out. Packets: Sent = 1, Received = 0, Lost = 1 (100% loss).`, "error");
        return;
    }

    const hopNames = path.map(n => n.name).join(" ➔ ");
    logMessage(`Routing Path resolved: ${hopNames}`, "info");

    // Launch packet animation
    animatingPackets.push({
        x: path[0].x,
        y: path[0].y,
        path: path,
        pathIndex: 0,
        progress: 0,
        speed: 0.035,
        color: "#e11d48",
        type: pType,
        srcNode: srcNode,
        dstNode: dstNode,
        isReturn: false
    });
}

// Node Inspector UI
function selectDevice(node) {
    selectedNode = node;
    const inspectorEl = document.getElementById("deviceInspector");
    if (!inspectorEl) return;

    inspectorEl.innerHTML = `
        <div style="font-size: 13px;">
            <div style="margin-bottom: 8px;"><strong>Device:</strong> ${node.name} (${node.type.toUpperCase()})</div>
            <div class="form-group" style="margin-bottom: 8px;">
                <label style="font-size: 11px;">Host Name:</label>
                <input type="text" class="form-control" style="font-size: 12px; padding: 4px 6px;" value="${node.name}" onchange="updateNodeName(${node.id}, this.value)">
            </div>
            <div class="form-group" style="margin-bottom: 8px;">
                <label style="font-size: 11px;">IP Address:</label>
                <input type="text" class="form-control" style="font-size: 12px; padding: 4px 6px;" value="${node.ip}" onchange="updateNodeIP(${node.id}, this.value)">
            </div>
            <div style="margin-bottom: 6px;"><strong>MAC Address:</strong> <span style="font-family: monospace;">${node.mac}</span></div>
            <div style="margin-bottom: 10px;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">● Active</span></div>
            <button class="btn btn-danger" style="width: 100%; font-size: 12px; padding: 5px;" onclick="deleteSelected()">Remove Device</button>
        </div>
    `;
}

function clearInspector() {
    const inspectorEl = document.getElementById("deviceInspector");
    if (inspectorEl) {
        inspectorEl.innerHTML = `<p style="font-size: 12px; color: #64748b; font-style: italic;">Click any device on the canvas to inspect its configuration.</p>`;
    }
}

function updateNodeName(id, newName) {
    const node = nodes.find(n => n.id === id);
    if (node && newName.trim()) {
        node.name = newName.trim();
        updateNodeSelectDropdowns();
        drawNetwork();
    }
}

function updateNodeIP(id, newIP) {
    const node = nodes.find(n => n.id === id);
    if (node && newIP.trim()) {
        node.ip = newIP.trim();
        drawNetwork();
    }
}

// Update source/destination select lists
function updateNodeSelectDropdowns() {
    const srcSelect = document.getElementById("packetSourceSelect");
    const dstSelect = document.getElementById("packetDestSelect");
    if (!srcSelect || !dstSelect) return;

    const currentSrc = srcSelect.value;
    const currentDst = dstSelect.value;

    srcSelect.innerHTML = "";
    dstSelect.innerHTML = "";

    nodes.forEach(n => {
        const opt1 = document.createElement("option");
        opt1.value = n.id;
        opt1.textContent = `${n.name} (${n.ip})`;
        srcSelect.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = n.id;
        opt2.textContent = `${n.name} (${n.ip})`;
        dstSelect.appendChild(opt2);
    });

    if (nodes.length >= 2) {
        srcSelect.value = currentSrc || nodes[0].id;
        dstSelect.value = (currentDst && currentDst !== srcSelect.value) ? currentDst : nodes[nodes.length - 1].id;
    }
}

// Terminal Logging
function logMessage(msg, type = "normal") {
    const terminal = document.getElementById("terminalOutput");
    if (!terminal) return;

    const line = document.createElement("div");
    line.className = `terminal-line ${type}`;
    const timestamp = new Date().toTimeString().split(" ")[0];
    line.textContent = `[${timestamp}] ${msg}`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function clearConsoleLog() {
    const terminal = document.getElementById("terminalOutput");
    if (terminal) {
        terminal.innerHTML = `<div class="terminal-line info">[SYSTEM] Console cleared. Ready for packet simulation.</div>`;
    }
}

