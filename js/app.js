// Sentinel Dashboard - Main Application Controller & Visual Systems

let activeNodeId = "node1";
let activeNodeSubscription = null;
let currentView = "login-view";
let lastSyncTimestamp = null;
let syncTimerInterval = null;

// Background particles system config
let particlesArray = [];
const particleCount = 45;

/* =========================================
   APPLICATION BOOTSTRAP
   ========================================= */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialise Background Canvas Particles
    initBackgroundCanvas();
    
    // 2. Set Up SPA Routing and UI Button Handlers
    setupSpaRouting();
    
    // 3. Monitor Auth Status for Session Persistence
    monitorAuthSession();
    
    // 4. Subscribe globally to all nodes updates to keep selectors and topology map synced
    subscribeToAllNodes(updateTopologyDisplay);
});

/* =========================================
   BACKGROUND INTERACTIVE CANVAS NETWORKING
   ========================================= */
function initBackgroundCanvas() {
    const canvas = document.getElementById("particle-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // Handle Window Resize
    function setCanvasSize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);
    
    // Particle Class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() * 0.4 - 0.2);
            this.vy = (Math.random() * 0.4 - 0.2);
            this.radius = Math.random() * 2 + 1.5;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 212, 255, 0.4)";
            ctx.shadowBlur = 4;
            ctx.shadowColor = "#00d4ff";
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            // Screen boundaries bounce
            if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
            if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;
        }
    }
    
    // Instantiate particles
    particlesArray = [];
    for (let i = 0; i < particleCount; i++) {
        particlesArray.push(new Particle());
    }
    
    // Draw connections between nearby particles
    function connectParticles() {
        const maxDist = 140;
        for (let i = 0; i < particlesArray.length; i++) {
            for (let j = i + 1; j < particlesArray.length; j++) {
                const dist = Math.hypot(particlesArray[i].x - particlesArray[j].x, particlesArray[i].y - particlesArray[j].y);
                if (dist < maxDist) {
                    const alpha = (1 - (dist / maxDist)) * 0.12;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                    ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                    ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    }
    
    // Loop
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particlesArray.forEach(p => {
            p.update();
            p.draw();
        });
        
        connectParticles();
        requestAnimationFrame(animateParticles);
    }
    
    animateParticles();
}

/* =========================================
   SPA ROUTING SYSTEM
   ========================================= */
function setupSpaRouting() {
    const loginForm = document.getElementById("login-form");
    const loginBtn = document.getElementById("login-btn");
    const bypassBtn = document.getElementById("bypass-login");
    
    const logoutBtnTopology = document.getElementById("logout-btn-topology");
    const logoutBtnDashboard = document.getElementById("logout-btn-dashboard");
    
    const nodeSelector = document.getElementById("node-selector");
    
    const pestDetailsBtn = document.getElementById("open-pest-details-btn");
    const pestCloseBtn = document.getElementById("close-pest-details-btn");
    const pestModal = document.getElementById("pest-modal");

    // 1. Submit Login Form
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const errorDiv = document.getElementById("login-error");
            const loader = loginBtn.querySelector(".btn-loader");
            
            // Show loaders
            loader.classList.remove("hidden");
            errorDiv.classList.add("hidden");
            loginBtn.disabled = true;
            
            authSignIn(email, password)
                .then(user => {
                    loader.classList.add("hidden");
                    loginBtn.disabled = false;
                    switchView("network-topology-view");
                })
                .catch(err => {
                    loader.classList.add("hidden");
                    loginBtn.disabled = false;
                    document.getElementById("error-text").innerText = err.message || "Failed to authenticate session credentials.";
                    errorDiv.classList.remove("hidden");
                });
        });
    }

    // 2. Bypass Login for Dev Review
    if (bypassBtn) {
        bypassBtn.addEventListener("click", (e) => {
            e.preventDefault();
            authSignIn("demo@sentinel.io", "demo123")
                .then(() => switchView("network-topology-view"));
        });
    }

    // 3. Logout buttons
    const triggerLogout = () => {
        authSignOut().then(() => {
            switchView("login-view");
            if (activeNodeSubscription) {
                activeNodeSubscription = null;
            }
        });
    };

    if (logoutBtnTopology) logoutBtnTopology.addEventListener("click", triggerLogout);
    if (logoutBtnDashboard) logoutBtnDashboard.addEventListener("click", triggerLogout);

    // 4. Node Selector Dropdown on Dashboard
    if (nodeSelector) {
        nodeSelector.addEventListener("change", (e) => {
            openNodeDashboard(e.target.value);
        });
    }

    // Rename Node Click Handler
    const renameNodeBtn = document.getElementById("rename-node-btn");
    if (renameNodeBtn) {
        renameNodeBtn.addEventListener("click", () => {
            const activeNode = localDbState.nodes[activeNodeId];
            if (!activeNode) return;
            const newName = prompt(`Enter custom name for Node ${activeNodeId.replace("node", "")}:`, activeNode.areaName);
            if (newName && newName.trim() !== "") {
                renameNode(activeNodeId, newName.trim());
            }
        });
    }

    // 5. Pest Intelligence Modal Controllers
    if (pestDetailsBtn && pestModal) {
        pestDetailsBtn.addEventListener("click", () => {
            pestModal.classList.add("active");
            // Load and draw modal charts based on active node pestData
            const activeNode = localDbState.nodes[activeNodeId];
            if (activeNode && activeNode.pestData) {
                initModalCharts(activeNode.pestData.frequency, activeNode.pestData.confidenceTrend);
            }
        });
    }

    if (pestCloseBtn && pestModal) {
        pestCloseBtn.addEventListener("click", () => {
            pestModal.classList.remove("active");
        });
        
        // Close modal when clicking outside card
        pestModal.addEventListener("click", (e) => {
            if (e.target === pestModal) {
                pestModal.classList.remove("active");
            }
        });
    }
}

// Switches visible view
function switchView(viewId) {
    document.querySelectorAll(".app-view").forEach(view => {
        view.classList.remove("active");
    });
    
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add("active");
        currentView = viewId;
        
        // Hide Simulator slider panel on login view
        const simPanel = document.getElementById("sim-control-panel");
        if (simPanel) {
            if (viewId === "login-view") {
                simPanel.style.display = "none";
            } else {
                simPanel.style.display = "block";
            }
        }
        
        // If switching into network-topology map, update layout immediately
        if (viewId === "network-topology-view" && typeof localDbState !== 'undefined') {
            updateTopologyDisplay(localDbState.nodes);
        }
    }
}

// Session monitor
function monitorAuthSession() {
    authOnStateChanged(user => {
        const demoBadge1 = document.getElementById("topology-demo-badge");
        if (demoBadge1) {
            if (isDemoMode) demoBadge1.classList.remove("hidden");
            else demoBadge1.classList.add("hidden");
        }

        if (user) {
            // Already logged in
            if (currentView === "login-view") {
                switchView("network-topology-view");
            }
        } else {
            switchView("login-view");
        }
    });
}

/* =========================================
   TOPOLOGY UPDATE LISTENERS
   ========================================= */
function updateTopologyDisplay(nodes) {
    if (!nodes) return;
    
    // Synchronize Node Selector dropdown elements
    renderNodeSelectorOptions(nodes);

    if (currentView !== "network-topology-view") return;
    
    Object.keys(nodes).forEach(nodeId => {
        const node = nodes[nodeId];
        const cardWrapper = document.querySelector(`.${nodeId}-pos`);
        if (!cardWrapper) return;
        
        // Update custom title name
        const cardTitle = cardWrapper.querySelector("h3");
        if (cardTitle) {
            cardTitle.innerText = node.areaName;
        }
        
        // Online/Offline style syncs
        const statusPill = cardWrapper.querySelector(".status-indicator");
        const statusText = cardWrapper.querySelector(".status-text");
        
        if (node.status === "online") {
            statusPill.className = "status-indicator online";
            statusText.innerText = "ONLINE";
        } else {
            statusPill.className = "status-indicator offline";
            statusText.innerText = "OFFLINE";
        }
        
        // Live readings
        const tempText = document.getElementById(`${nodeId}-temp`);
        const humiText = document.getElementById(`${nodeId}-humi`);
        
        if (tempText && node.sensorData) tempText.innerText = `${node.sensorData.temperature.toFixed(1)}°C`;
        if (humiText && node.sensorData) humiText.innerText = `${node.sensorData.humidity.toFixed(0)}%`;
        
        // SVG Connecting line activity animation sync
        const line = document.querySelector(`.path-${nodeId}`);
        if (line) {
            if (node.status === "online") {
                line.style.opacity = "0.75";
                line.style.animationPlayState = "running";
                line.style.stroke = "var(--cyan)";
            } else {
                line.style.opacity = "0.15";
                line.style.animationPlayState = "paused";
                line.style.stroke = "var(--text-muted)";
            }
        }
    });
}

/* =========================================
   DASHBOARD CONTROLLER & UPDATE LISTENERS
   ========================================= */
function openNodeDashboard(nodeId) {
    activeNodeId = nodeId;
    
    // Sync node selector dropdown
    const select = document.getElementById("node-selector");
    if (select && select.value !== nodeId) {
        select.value = nodeId;
    }
    
    // If user opens a new node, switch views and hook listeners
    switchView("dashboard-view");
    
    // Reset timer
    lastSyncTimestamp = null;
    
    // Sync to Node data stream
    subscribeToSingleNode(nodeId, updateDashboardDisplay);
}

function updateDashboardDisplay(node) {
    if (!node || currentView !== "dashboard-view") return;
    
    // Update sync clock timestamp
    if (node.sensorData && node.sensorData.timestamp) {
        lastSyncTimestamp = node.sensorData.timestamp;
        const d = new Date(lastSyncTimestamp);
        document.getElementById("val-sync").innerText = d.toLocaleTimeString();
        resetSyncTimer();
    }
    
    // 1. Update live numerical meters
    document.getElementById("val-temp").innerText = `${node.sensorData.temperature.toFixed(1)}°C`;
    document.getElementById("val-humi").innerText = `${node.sensorData.humidity.toFixed(1)}%`;
    
    // 2. Gas Status Meter color shifts
    const gasCard = document.getElementById("card-gas");
    const gasVal = document.getElementById("val-gas");
    const gasFill = document.getElementById("fill-gas");
    
    gasVal.innerText = node.sensorData.gasStatus;
    gasCard.className = "summary-card"; // reset classes
    
    if (node.sensorData.gasStatus === "OPTIMAL" || node.sensorData.gasStatus === "Normal") {
        gasFill.style.width = "100%";
    } else if (node.sensorData.gasStatus === "WARNING") {
        gasCard.classList.add("warning");
        gasFill.style.width = "60%";
    } else { // DANGER
        gasCard.classList.add("danger");
        gasFill.style.width = "30%";
    }
    
    // 3. Anomaly Status Meter color shifts
    const anomalyCard = document.getElementById("card-anomaly");
    const anomalyVal = document.getElementById("val-anomaly");
    const anomalyFill = document.getElementById("fill-anomaly");
    
    anomalyCard.className = "summary-card";
    
    if (node.sensorData.anomaly === "No Anomaly" || !node.sensorData.anomaly) {
        anomalyVal.innerText = "SECURE";
        anomalyFill.style.width = "100%";
    } else {
        anomalyVal.innerText = node.sensorData.anomaly;
        anomalyCard.classList.add("anomaly-triggered");
        anomalyFill.style.width = "30%";
    }

    // 4. Sync streaming charts
    if (node.history) {
        updateTelemetryCharts(node.history);
    }
    
    // 5. Sync pest detections section
    if (node.pestData) {
        const latest = node.pestData.latest;
        const sum = node.pestData.summary;
        
        // Latest detection panel
        const pestNameEl = document.getElementById("latest-pest-name");
        const pestConfEl = document.getElementById("latest-pest-conf");
        const pestTimeEl = document.getElementById("latest-pest-time");
        const pestIconBadge = document.querySelector(".pest-icon-badge");
        const alarmDot = document.getElementById("pest-alert-dot");
        
        if (latest && latest.pestName !== "None" && latest.pestName) {
            pestNameEl.innerText = latest.pestName;
            pestConfEl.innerText = `${latest.confidence.toFixed(1)}%`;
            const d = new Date(latest.timestamp);
            pestTimeEl.innerText = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
            
            pestIconBadge.classList.remove("no-pest");
            alarmDot.classList.add("active");
        } else {
            pestNameEl.innerText = "No Detection";
            pestConfEl.innerText = "--%";
            pestTimeEl.innerText = "--/--/---- --:--:--";
            
            pestIconBadge.classList.add("no-pest");
            alarmDot.classList.remove("active");
        }
        
        // Pest Summary Card details
        document.getElementById("pest-total-detections").innerText = sum.totalDetections;
        document.getElementById("pest-most-detected").innerText = sum.mostDetected;
        document.getElementById("pest-avg-confidence").innerText = `${sum.avgConfidence.toFixed(1)}%`;
        
        // Sync Modal Recent detections table if modal is visible
        const pestModal = document.getElementById("pest-modal");
        if (pestModal && pestModal.classList.contains("active")) {
            updatePestsTable(node.pestData.recent);
        }
    }
}

// Reset the relative sync timer (e.g. 5s ago)
function resetSyncTimer() {
    if (syncTimerInterval) clearInterval(syncTimerInterval);
    const counter = document.getElementById("sync-counter");
    if (!counter) return;
    
    counter.innerText = "0s ago";
    let secs = 0;
    
    syncTimerInterval = setInterval(() => {
        secs++;
        counter.innerText = `${secs}s ago`;
    }, 1000);
}

// Renders the Modal pest history details log
function updatePestsTable(recentDetections) {
    const tbody = document.querySelector("#recent-pest-table tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (!recentDetections || recentDetections.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No recorded detection logs.</td></tr>`;
        return;
    }
    
    recentDetections.forEach(det => {
        const d = new Date(det.timestamp);
        const timeStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="font-display" style="font-weight: 600;">${det.pestName}</td>
            <td class="font-mono text-cyan">${det.confidence.toFixed(1)}%</td>
            <td class="font-mono">${timeStr}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Go back to maps topology page
function backToTopology() {
    if (syncTimerInterval) {
        clearInterval(syncTimerInterval);
        syncTimerInterval = null;
    }
    switchView("network-topology-view");
}

function closeToast() {
    const toast = document.getElementById("status-toast");
    if (toast) toast.classList.add("hidden");
}

// Rebuild dropdown node selector options dynamically
function renderNodeSelectorOptions(nodes) {
    const select = document.getElementById("node-selector");
    if (!select) return;
    
    const currentVal = select.value;
    select.innerHTML = "";
    
    Object.keys(nodes).forEach(nodeId => {
        const node = nodes[nodeId];
        const option = document.createElement("option");
        option.value = nodeId;
        const num = nodeId.replace("node", "").padStart(2, "0");
        option.textContent = `${num} – ${node.areaName}`;
        select.appendChild(option);
    });
    
    select.value = currentVal;
}
