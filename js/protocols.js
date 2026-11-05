// ========================================================
// Protocols, TCP Handshake & Subnetting Visualizer Script
// ========================================================

// --------------------------------------------------------
// 1. TCP 3-Way Handshake Visualizer
// --------------------------------------------------------
let handshakeStep = 0;
let handshakeTimer = null;

const HANDSHAKE_STEPS = [
    {
        title: "Step 0: Initial State (Closed)",
        clientState: "CLOSED",
        serverState: "LISTEN",
        description: "The server socket is passively listening on Port 80/443. The client is ready to initiate a new connection.",
        arrow: null
    },
    {
        title: "Step 1: Client sends SYN",
        clientState: "SYN_SENT",
        serverState: "LISTEN",
        description: "Client sends a SYN (Synchronize) packet with initial sequence number <code>Seq = 100</code> to request a connection.",
        arrow: { dir: "right", label: "SYN [Seq=100]", color: "#2563eb" }
    },
    {
        title: "Step 2: Server responds with SYN-ACK",
        clientState: "SYN_SENT",
        serverState: "SYN_RCVD",
        description: "Server receives SYN, allocates buffers, and replies with <code>SYN-ACK</code>. Sequence number <code>Seq = 500</code> and Acknowledgment <code>Ack = 101</code>.",
        arrow: { dir: "left", label: "SYN-ACK [Seq=500, Ack=101]", color: "#16a34a" }
    },
    {
        title: "Step 3: Client sends ACK (Connection Established)",
        clientState: "ESTABLISHED",
        serverState: "ESTABLISHED",
        description: "Client acknowledges with <code>ACK</code> [Seq=101, Ack=501]. Both endpoints are now in <strong>ESTABLISHED</strong> state! Bidirectional data flow can begin.",
        arrow: { dir: "right", label: "ACK [Seq=101, Ack=501]", color: "#d97706" }
    },
    {
        title: "Step 4: HTTP Data Transfer",
        clientState: "ESTABLISHED",
        serverState: "ESTABLISHED",
        description: "Client sends HTTP GET request: <code>GET /index.html HTTP/1.1</code>. Server sends <code>HTTP 200 OK</code> with webpage payload.",
        arrow: { dir: "both", label: "HTTP GET &lt;---&gt; 200 OK (Data)", color: "#9333ea" }
    }
];

function updateHandshakeUI() {
    const stepData = HANDSHAKE_STEPS[handshakeStep];

    document.getElementById("stepTitle").innerHTML = stepData.title;
    document.getElementById("stepDescription").innerHTML = stepData.description;
    document.getElementById("clientStateBadge").textContent = stepData.clientState;
    document.getElementById("serverStateBadge").textContent = stepData.serverState;

    // Color code states
    const getBadgeBg = (state) => {
        if (state === "ESTABLISHED") return "#16a34a";
        if (state.startsWith("SYN")) return "#d97706";
        if (state === "LISTEN") return "#2563eb";
        return "#64748b";
    };

    document.getElementById("clientStateBadge").style.backgroundColor = getBadgeBg(stepData.clientState);
    document.getElementById("serverStateBadge").style.backgroundColor = getBadgeBg(stepData.serverState);

    // Draw Handshake Canvas Diagram
    drawHandshakeDiagram();

    // Disable / Enable buttons
    document.getElementById("prevStepBtn").disabled = (handshakeStep === 0);
    document.getElementById("nextStepBtn").disabled = (handshakeStep === HANDSHAKE_STEPS.length - 1);
}

function nextHandshakeStep() {
    if (handshakeStep < HANDSHAKE_STEPS.length - 1) {
        handshakeStep++;
        updateHandshakeUI();
    }
}

function prevHandshakeStep() {
    if (handshakeStep > 0) {
        handshakeStep--;
        updateHandshakeUI();
    }
}

function resetHandshake() {
    stopAutoHandshake();
    handshakeStep = 0;
    updateHandshakeUI();
}

function autoPlayHandshake() {
    stopAutoHandshake();
    resetHandshake();
    handshakeTimer = setInterval(() => {
        if (handshakeStep < HANDSHAKE_STEPS.length - 1) {
            nextHandshakeStep();
        } else {
            stopAutoHandshake();
        }
    }, 1800);
}

function stopAutoHandshake() {
    if (handshakeTimer) {
        clearInterval(handshakeTimer);
        handshakeTimer = null;
    }
}

function drawHandshakeDiagram() {
    const c = document.getElementById("handshakeCanvas");
    if (!c) return;
    const ctx = c.getContext("2d");
    const w = c.width = c.parentElement.clientWidth || 600;
    const h = c.height = 240;

    ctx.clearRect(0, 0, w, h);

    const clientX = 100;
    const serverX = w - 100;

    // Lifelines (vertical dotted lines)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(clientX, 45);
    ctx.lineTo(clientX, h - 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(serverX, 45);
    ctx.lineTo(serverX, h - 20);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw Top Endpoint Nodes
    // Client Node
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(clientX - 50, 10, 100, 32);
    ctx.strokeStyle = "#1d4ed8";
    ctx.strokeRect(clientX - 50, 10, 100, 32);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("💻 Client (Host)", clientX, 30);

    // Server Node
    ctx.fillStyle = "#8b5cf6";
    ctx.fillRect(serverX - 50, 10, 100, 32);
    ctx.strokeStyle = "#6d28d9";
    ctx.strokeRect(serverX - 50, 10, 100, 32);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Arial";
    ctx.fillText("🗄️ Server (Port 80)", serverX, 30);

    // Draw past and current packet arrows based on step
    const yOffsets = [75, 120, 165, 205];

    for (let i = 1; i <= handshakeStep; i++) {
        const step = HANDSHAKE_STEPS[i];
        if (!step.arrow) continue;

        const y = yOffsets[i - 1];
        ctx.strokeStyle = step.arrow.color;
        ctx.fillStyle = step.arrow.color;
        ctx.lineWidth = 2.5;

        if (step.arrow.dir === "right") {
            // Left to Right Arrow
            ctx.beginPath();
            ctx.moveTo(clientX, y);
            ctx.lineTo(serverX, y + 25);
            ctx.stroke();

            // Arrow head
            drawArrowhead(ctx, clientX, y, serverX, y + 25, 9);

            // Label
            ctx.font = "bold 11px Arial";
            ctx.fillText(step.arrow.label, (clientX + serverX) / 2, y + 8);

        } else if (step.arrow.dir === "left") {
            // Right to Left Arrow
            ctx.beginPath();
            ctx.moveTo(serverX, y);
            ctx.lineTo(clientX, y + 25);
            ctx.stroke();

            // Arrow head
            drawArrowhead(ctx, serverX, y, clientX, y + 25, 9);

            // Label
            ctx.font = "bold 11px Arial";
            ctx.fillText(step.arrow.label, (clientX + serverX) / 2, y + 8);

        } else if (step.arrow.dir === "both") {
            // Bidirectional
            ctx.beginPath();
            ctx.moveTo(clientX, y);
            ctx.lineTo(serverX, y);
            ctx.stroke();

            drawArrowhead(ctx, clientX + 20, y, serverX, y, 8);
            drawArrowhead(ctx, serverX - 20, y, clientX, y, 8);

            ctx.font = "bold 11px Arial";
            ctx.fillText("DATA STREAM (ESTABLISHED)", (clientX + serverX) / 2, y - 6);
        }
    }
}

function drawArrowhead(ctx, fromX, fromY, toX, toY, radius) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - radius * Math.cos(angle - Math.PI / 6), toY - radius * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - radius * Math.cos(angle + Math.PI / 6), toY - radius * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}


// --------------------------------------------------------
// 2. OSI 7-Layer Model Reference Data
// --------------------------------------------------------
const OSI_LAYERS = [
    {
        num: 7,
        name: "Application Layer",
        pdu: "Data",
        protocols: "HTTP, HTTPS, FTP, DNS, SMTP, Telnet, SSH",
        devices: "Web Browsers, Email Clients, Gateway APIs",
        description: "Closest to the end user. Directly provides network services to user applications. Formats user requests and delivers responses."
    },
    {
        num: 6,
        name: "Presentation Layer",
        pdu: "Data",
        protocols: "SSL/TLS, ASCII, JPEG, MPEG, GIF",
        description: "Handles data translation, encryption, decryption, compression, and character code conversions so the application layer can interpret it."
    },
    {
        num: 5,
        name: "Session Layer",
        pdu: "Data",
        protocols: "NetBIOS, RPC, PPTP, Sockets",
        description: "Establishes, manages, coordinates, and terminates connections/sessions between applications on both communicating machines."
    },
    {
        num: 4,
        name: "Transport Layer",
        pdu: "Segments (TCP) / Datagrams (UDP)",
        protocols: "TCP, UDP, SCTP, DCCP",
        devices: "Firewalls, Load Balancers",
        description: "Provides end-to-end communication control, flow control, error recovery (TCP retransmission), and port multiplexing (e.g., port 80, 443)."
    },
    {
        num: 3,
        name: "Network Layer",
        pdu: "Packets",
        protocols: "IPv4, IPv6, ICMP, ARP, OSPF, BGP",
        devices: "Routers, Layer 3 Switches",
        description: "Handles logical IP addressing and packet routing across intermediate network nodes. Determines optimal shortest paths."
    },
    {
        num: 2,
        name: "Data Link Layer",
        pdu: "Frames",
        protocols: "Ethernet (IEEE 802.3), Wi-Fi (802.11), PPP, HDLC",
        devices: "Network Switches, Network Interface Cards (NIC), Bridges",
        description: "Responsible for node-to-node hop delivery using physical MAC addresses. Detects transmission errors at frame level using CRC/checksum."
    },
    {
        num: 1,
        name: "Physical Layer",
        pdu: "Bits (0s and 1s)",
        protocols: "100BASE-T, RS-232, DSL, Fiber Optics",
        devices: "Ethernet Cables (Cat6), Repeaters, Hubs, Connectors",
        description: "Transmits raw, unstructured bit streams over physical transmission mediums (copper wire, fiber optics, radio radio frequencies)."
    }
];

function selectOsiLayer(layerNum) {
    const layer = OSI_LAYERS.find(l => l.num === layerNum);
    if (!layer) return;

    // Update active layer highlight
    document.querySelectorAll(".osi-layer").forEach(el => {
        el.classList.toggle("active", parseInt(el.dataset.layer) === layerNum);
    });

    const infoBox = document.getElementById("osiLayerDetail");
    infoBox.innerHTML = `
        <div style="border-left: 4px solid #0284c7; padding-left: 12px; margin-bottom: 12px;">
            <h3 style="color: #0369a1; font-size: 16px;">Layer ${layer.num}: ${layer.name}</h3>
            <span style="font-size: 12px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 3px; font-weight: bold;">
                Protocol Data Unit (PDU): ${layer.pdu}
            </span>
        </div>
        <p style="font-size: 13px; margin-bottom: 10px; color: #334155;">${layer.description}</p>
        <div style="font-size: 12px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px;">
            <div><strong>Key Protocols:</strong> <code>${layer.protocols}</code></div>
            ${layer.devices ? `<div style="margin-top: 5px;"><strong>Common Hardware / Tools:</strong> ${layer.devices}</div>` : ""}
        </div>
    `;
}


// --------------------------------------------------------
// 3. Subnet / IPv4 Calculator
// --------------------------------------------------------
function calculateSubnet() {
    const ipInput = document.getElementById("calcIpInput").value.trim();
    const cidr = parseInt(document.getElementById("calcCidrInput").value);
    const resultBox = document.getElementById("subnetResult");

    const parts = ipInput.split(".");
    if (parts.length !== 4 || parts.some(p => isNaN(p) || parseInt(p) < 0 || parseInt(p) > 255)) {
        resultBox.innerHTML = `<div class="alert alert-danger">Please enter a valid IPv4 address (e.g. 192.168.1.50)</div>`;
        return;
    }

    // Convert IP to 32-bit number
    const ipNum = parts.reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;

    // Subnet mask number
    const maskNum = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;

    // Network & Broadcast
    const netNum = (ipNum & maskNum) >>> 0;
    const bcastNum = (netNum | (~maskNum >>> 0)) >>> 0;

    const numToIp = (num) => [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255
    ].join(".");

    const totalHosts = Math.pow(2, 32 - cidr);
    const usableHosts = cidr >= 31 ? (cidr === 31 ? 2 : 1) : totalHosts - 2;

    const firstUsable = cidr >= 31 ? numToIp(netNum) : numToIp(netNum + 1);
    const lastUsable = cidr >= 31 ? numToIp(bcastNum) : numToIp(bcastNum - 1);

    resultBox.innerHTML = `
        <table class="data-table">
            <tr><th style="width: 40%;">Parameter</th><th>Value</th></tr>
            <tr><td><strong>Input IP & Prefix:</strong></td><td><code>${ipInput} /${cidr}</code></td></tr>
            <tr><td><strong>Subnet Mask:</strong></td><td><code>${numToIp(maskNum)}</code></td></tr>
            <tr><td><strong>Network Address:</strong></td><td><code style="color: #16a34a; font-weight: bold;">${numToIp(netNum)}</code></td></tr>
            <tr><td><strong>Broadcast Address:</strong></td><td><code style="color: #dc2626; font-weight: bold;">${numToIp(bcastNum)}</code></td></tr>
            <tr><td><strong>Usable Host IP Range:</strong></td><td><code>${firstUsable} — ${lastUsable}</code></td></tr>
            <tr><td><strong>Total Usable Host Capacity:</strong></td><td><strong>${usableHosts.toLocaleString()}</strong> hosts</td></tr>
        </table>
    `;
}

