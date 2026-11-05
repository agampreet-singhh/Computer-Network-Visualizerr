// ========================================================
// Interactive Computer Networks Quiz Engine
// ========================================================

const QUIZ_QUESTIONS = [
    {
        id: 1,
        question: "1. At which layer of the OSI model does a standard IP Router primarily operate?",
        options: [
            { text: "Layer 1 - Physical Layer", correct: false },
            { text: "Layer 2 - Data Link Layer", correct: false },
            { text: "Layer 3 - Network Layer", correct: true },
            { text: "Layer 4 - Transport Layer", correct: false }
        ],
        explanation: "Routers operate at Layer 3 (Network Layer) to inspect logical IP addresses and determine optimal routing paths."
    },
    {
        id: 2,
        question: "2. Which transport protocol provides reliable, connection-oriented packet delivery with acknowledgments?",
        options: [
            { text: "UDP (User Datagram Protocol)", correct: false },
            { text: "TCP (Transmission Control Protocol)", correct: true },
            { text: "ICMP (Internet Control Message Protocol)", correct: false },
            { text: "ARP (Address Resolution Protocol)", correct: false }
        ],
        explanation: "TCP uses 3-way handshakes, sequence numbers, and ACKs to ensure reliable, ordered byte-stream delivery."
    },
    {
        id: 3,
        question: "3. What is the standard subnet mask for a /24 IPv4 prefix (Class C)?",
        options: [
            { text: "255.0.0.0", correct: false },
            { text: "255.255.0.0", correct: false },
            { text: "255.255.255.0", correct: true },
            { text: "255.255.255.240", correct: false }
        ],
        explanation: "A /24 network prefix has 24 network bits (11111111.11111111.11111111.00000000), which translates to 255.255.255.0."
    },
    {
        id: 4,
        question: "4. During a standard TCP 3-way handshake, what packet does the server reply with upon receiving a SYN?",
        options: [
            { text: "ACK", correct: false },
            { text: "SYN-ACK", correct: true },
            { text: "FIN", correct: false },
            { text: "RST", correct: false }
        ],
        explanation: "The server acknowledges the client's SYN and synchronizes its own sequence number by transmitting a SYN-ACK packet."
    },
    {
        id: 5,
        question: "5. In which network topology are all client nodes connected directly to a central hub or switch?",
        options: [
            { text: "Ring Topology", correct: false },
            { text: "Star Topology", correct: true },
            { text: "Mesh Topology", correct: false },
            { text: "Bus Topology", correct: false }
        ],
        explanation: "A Star Topology connects all individual hosts via point-to-point cables to a central switch or concentrator."
    }
];

function renderQuiz() {
    const container = document.getElementById("quizContainer");
    if (!container) return;

    let html = "";
    QUIZ_QUESTIONS.forEach((q, idx) => {
        html += `
            <div class="quiz-card" id="q_card_${q.id}">
                <h4>${q.question}</h4>
                <div>
        `;
        q.options.forEach((opt, optIdx) => {
            html += `
                <label class="quiz-option">
                    <input type="radio" name="q_${q.id}" value="${optIdx}">
                    <span>${opt.text}</span>
                </label>
            `;
        });
        html += `
                </div>
                <div id="q_feedback_${q.id}" style="display: none; margin-top: 8px; font-size: 12px; padding: 6px 10px; border-radius: 4px;"></div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function submitQuiz() {
    let score = 0;
    let answeredCount = 0;

    QUIZ_QUESTIONS.forEach(q => {
        const radios = document.getElementsByName(`q_${q.id}`);
        const feedbackEl = document.getElementById(`q_feedback_${q.id}`);
        let selectedIdx = -1;

        for (let i = 0; i < radios.length; i++) {
            if (radios[i].checked) {
                selectedIdx = parseInt(radios[i].value);
                answeredCount++;
                break;
            }
        }

        feedbackEl.style.display = "block";
        if (selectedIdx === -1) {
            feedbackEl.className = "alert alert-warning";
            feedbackEl.innerHTML = `⚠️ Not answered! Correct answer: <strong>${q.options.find(o => o.correct).text}</strong>`;
        } else if (q.options[selectedIdx].correct) {
            score++;
            feedbackEl.className = "alert alert-success";
            feedbackEl.innerHTML = `✓ Correct! ${q.explanation}`;
        } else {
            feedbackEl.className = "alert alert-danger";
            feedbackEl.innerHTML = `✗ Incorrect. Correct answer: <strong>${q.options.find(o => o.correct).text}</strong><br>${q.explanation}`;
        }
    });

    const resultBox = document.getElementById("quizScoreBox");
    resultBox.style.display = "block";
    const percentage = Math.round((score / QUIZ_QUESTIONS.length) * 100);

    let badgeClass = "alert-success";
    let message = "Outstanding! You have a solid grasp of computer network fundamentals.";

    if (percentage < 60) {
        badgeClass = "alert-danger";
        message = "Needs review. Check out the Guide and Topology visualizer to strengthen your concepts!";
    } else if (percentage < 80) {
        badgeClass = "alert-warning";
        message = "Good job! A few more reviews on TCP handshakes and OSI layers will make it perfect.";
    }

    resultBox.className = `alert ${badgeClass}`;
    resultBox.innerHTML = `
        <h3 style="font-size: 16px; margin-bottom: 4px;">Quiz Results: ${score} / ${QUIZ_QUESTIONS.length} (${percentage}%)</h3>
        <p style="font-size: 13px;">${message}</p>
    `;

    resultBox.scrollIntoView({ behavior: "smooth" });
}

function resetQuiz() {
    document.querySelectorAll("input[type=radio]").forEach(r => r.checked = false);
    QUIZ_QUESTIONS.forEach(q => {
        const feedbackEl = document.getElementById(`q_feedback_${q.id}`);
        if (feedbackEl) feedbackEl.style.display = "none";
    });
    const resultBox = document.getElementById("quizScoreBox");
    if (resultBox) resultBox.style.display = "none";
}

