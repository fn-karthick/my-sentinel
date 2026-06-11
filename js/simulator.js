// Sentinel Dashboard - IoT Telemetry Data Simulator

let simulatorInterval = null;

// Normal operational baselines for each node
const nodeBaselines = {
    node1: { temp: 24.5, humi: 68.2, mq7: 12.4, mq135: 92.1, pests: ["Brown Planthopper", "Whitefly", "Leaf Miner"] },
    node2: { temp: 28.1, humi: 55.4, mq7: 42.1, mq135: 145.8, pests: ["Thrips", "Whitefly", "Aphid"] },
    node3: { temp: 26.2, humi: 78.5, mq7: 8.5, mq135: 65.2, pests: ["Aphid", "Brown Planthopper", "Whitefly"] },
    node4: { temp: 20.8, humi: 48.1, mq7: 15.2, mq135: 110.5, pests: ["Leaf Miner", "Thrips", "Aphid"] }
};

// Start the simulator loop
function startSimulator() {
    if (simulatorInterval) clearInterval(simulatorInterval);
    
    simulatorInterval = setInterval(() => {
        const autoCheck = document.getElementById("sim-auto-ticks");
        if (autoCheck && autoCheck.checked) {
            tickSimulator();
        }
    }, 3000);
    
    console.log("Telemetry simulation background loop started (3s interval).");
}

function stopSimulator() {
    if (simulatorInterval) {
        clearInterval(simulatorInterval);
        simulatorInterval = null;
    }
}

// Generate a tick of simulated data for all nodes
function tickSimulator() {
    Object.keys(nodeBaselines).forEach(nodeId => {
        // Skip updating active node if the user is dragging the sliders (check if panel is open and node matches)
        const isCurrentlyAdjusting = isUserAdjustingNode(nodeId);
        if (isCurrentlyAdjusting) return;
        
        const node = localDbState.nodes[nodeId];
        if (!node || node.status === "offline") return;
        
        // Minor walk of values
        let tempDiff = (Math.random() * 0.4 - 0.2);
        let humiDiff = (Math.random() * 0.8 - 0.4);
        let mq7Diff = (Math.random() * 0.6 - 0.3);
        let mq135Diff = (Math.random() * 1.5 - 0.75);

        // Gradually push back towards baseline if drifting too far
        const baseline = nodeBaselines[nodeId];
        if (node.sensorData.temperature > baseline.temp + 4) tempDiff -= 0.15;
        if (node.sensorData.temperature < baseline.temp - 4) tempDiff += 0.15;
        if (node.sensorData.humidity > baseline.humi + 8) humiDiff -= 0.4;
        if (node.sensorData.humidity < baseline.humi - 8) humiDiff += 0.4;

        let newTemp = parseFloat((node.sensorData.temperature + tempDiff).toFixed(1));
        let newHumi = parseFloat((node.sensorData.humidity + humiDiff).toFixed(1));
        let newMq7 = parseFloat((node.sensorData.mq7 + mq7Diff).toFixed(1));
        let newMq135 = parseFloat((node.sensorData.mq135 + mq135Diff).toFixed(1));

        // Enforce boundary limits
        if (newTemp < 5) newTemp = 5;
        if (newTemp > 50) newTemp = 50;
        if (newHumi < 10) newHumi = 10;
        if (newHumi > 98) newHumi = 98;
        if (newMq7 < 0) newMq7 = 0;
        if (newMq135 < 0) newMq135 = 0;

        // Auto determine statuses based on metrics
        const gasStatus = evaluateGasStatus(newMq7, newMq135);
        const anomaly = evaluateAnomalyStatus(newTemp, newMq7, newMq135);

        // Update local database (triggers listeners)
        updateNodeTelemetry(nodeId, {
            temperature: newTemp,
            humidity: newHumi,
            mq7: newMq7,
            mq135: newMq135,
            gasStatus: gasStatus,
            anomaly: anomaly
        });

        // 1 in 15 chance to trigger a random pest detection tick for each node
        if (Math.random() < 0.07) {
            triggerRandomPest(nodeId);
        }
    });
}

function evaluateGasStatus(mq7, mq135) {
    if (mq7 > 60 || mq135 > 200) {
        return "DANGER";
    } else if (mq7 > 30 || mq135 > 130) {
        return "WARNING";
    }
    return "OPTIMAL";
}

function evaluateAnomalyStatus(temp, mq7, mq135) {
    let alerts = [];
    if (temp > 38) alerts.push("TEMP OVERHEAT");
    if (temp < 12) alerts.push("FREEZE RISK");
    if (mq7 > 50) alerts.push("HIGH CO ALERT");
    if (mq135 > 180) alerts.push("VOC CONCENTRATION");
    
    return alerts.length > 0 ? alerts.join(" & ") : "No Anomaly";
}

function triggerRandomPest(nodeId) {
    const baseline = nodeBaselines[nodeId];
    if (!baseline) return;
    
    // Choose a pest from node baseline
    const pestsList = baseline.pests;
    const pestName = pestsList[Math.floor(Math.random() * pestsList.length)];
    const confidence = parseFloat((75 + Math.random() * 23).toFixed(1)); // 75% to 98%
    
    injectPestDetectionEvent(nodeId, pestName, confidence);
    console.log(`[Simulator] Simulated insect detection on ${nodeId}: ${pestName} (${confidence}%)`);
}

// Check if simulator control panel is active for this node
function isUserAdjustingNode(nodeId) {
    const activeNodeSelect = document.getElementById("node-selector");
    const panel = document.getElementById("sim-control-panel");
    if (!panel || panel.classList.contains("collapsed") || !activeNodeSelect) return false;
    
    return activeNodeSelect.value === nodeId;
}

/* =========================================
   SIMULATOR SLIDERS & ACTION LISTENERS
   ========================================= */
function setupSimulatorUiListeners() {
    const simPanel = document.getElementById("sim-control-panel");
    const toggleBtn = document.getElementById("sim-panel-toggle");
    
    const sliderTemp = document.getElementById("sim-temp");
    const sliderHumi = document.getElementById("sim-humi");
    const sliderMq7 = document.getElementById("sim-mq7");
    const sliderMq135 = document.getElementById("sim-mq135");

    const valTemp = document.getElementById("sim-val-temp");
    const valHumi = document.getElementById("sim-val-humi");
    const valMq7 = document.getElementById("sim-val-mq7");
    const valMq135 = document.getElementById("sim-val-mq135");

    const btnAnomaly = document.getElementById("sim-trigger-anomaly");
    const btnResolve = document.getElementById("sim-clear-anomaly");
    const btnPest = document.getElementById("sim-trigger-pest");
    
    const nodeNameLabel = document.getElementById("sim-active-node-name");
    const nodeSelector = document.getElementById("node-selector");

    // Toggle simulator drawer open/close
    if (toggleBtn && simPanel) {
        toggleBtn.addEventListener("click", () => {
            simPanel.classList.toggle("collapsed");
            
            // Sync current node selector value to the simulator label
            if (nodeSelector && nodeNameLabel) {
                nodeNameLabel.innerText = nodeSelector.value;
                syncSlidersToActiveNode(nodeSelector.value);
            }
        });
    }

    // Sync sliders to sliders displays
    function syncTelemetryChange() {
        if (!nodeSelector) return;
        const nodeId = nodeSelector.value;
        const temp = parseFloat(sliderTemp.value);
        const humi = parseFloat(sliderHumi.value);
        const mq7 = parseFloat(sliderMq7.value);
        const mq135 = parseFloat(sliderMq135.value);

        valTemp.innerText = `${temp}°C`;
        valHumi.innerText = `${humi}%`;
        valMq7.innerText = `${mq7} ppm`;
        valMq135.innerText = `${mq135} ppm`;

        const gasStatus = evaluateGasStatus(mq7, mq135);
        const anomaly = evaluateAnomalyStatus(temp, mq7, mq135);

        updateNodeTelemetry(nodeId, {
            temperature: temp,
            humidity: humi,
            mq7: mq7,
            mq135: mq135,
            gasStatus: gasStatus,
            anomaly: anomaly
        });
    }

    if (sliderTemp) sliderTemp.addEventListener("input", syncTelemetryChange);
    if (sliderHumi) sliderHumi.addEventListener("input", syncTelemetryChange);
    if (sliderMq7) sliderMq7.addEventListener("input", syncTelemetryChange);
    if (sliderMq135) sliderMq135.addEventListener("input", syncTelemetryChange);

    // Sync Node Selector with Simulator Label
    if (nodeSelector) {
        nodeSelector.addEventListener("change", () => {
            if (nodeNameLabel) nodeNameLabel.innerText = nodeSelector.value;
            syncSlidersToActiveNode(nodeSelector.value);
        });
    }

    // Action Triggers
    if (btnAnomaly) {
        btnAnomaly.addEventListener("click", () => {
            sliderTemp.value = 42.0;
            sliderMq7.value = 85.0;
            sliderMq135.value = 240.0;
            syncTelemetryChange();
        });
    }

    if (btnResolve) {
        btnResolve.addEventListener("click", () => {
            if (!nodeSelector) return;
            const baseline = nodeBaselines[nodeSelector.value];
            if (baseline) {
                sliderTemp.value = baseline.temp;
                sliderHumi.value = baseline.humi;
                sliderMq7.value = baseline.mq7;
                sliderMq135.value = baseline.mq135;
                syncTelemetryChange();
            }
        });
    }

    if (btnPest) {
        btnPest.addEventListener("click", () => {
            if (!nodeSelector) return;
            const pests = ["Brown Planthopper", "Aphid", "Leaf Miner", "Whitefly", "Thrips"];
            const pestName = pests[Math.floor(Math.random() * pests.length)];
            const confidence = parseFloat((80 + Math.random() * 18).toFixed(1));
            
            injectPestDetectionEvent(nodeSelector.value, pestName, confidence);
            console.log(`[Simulator] Manual insect detection injection: ${pestName} (${confidence}%)`);
        });
    }
}

// Sync slider handles when active node changes
function syncSlidersToActiveNode(nodeId) {
    const sliderTemp = document.getElementById("sim-temp");
    const sliderHumi = document.getElementById("sim-humi");
    const sliderMq7 = document.getElementById("sim-mq7");
    const sliderMq135 = document.getElementById("sim-mq135");

    const valTemp = document.getElementById("sim-val-temp");
    const valHumi = document.getElementById("sim-val-humi");
    const valMq7 = document.getElementById("sim-val-mq7");
    const valMq135 = document.getElementById("sim-val-mq135");

    const node = localDbState.nodes[nodeId];
    if (!node) return;

    if (sliderTemp) {
        sliderTemp.value = node.sensorData.temperature;
        valTemp.innerText = `${node.sensorData.temperature}°C`;
    }
    if (sliderHumi) {
        sliderHumi.value = node.sensorData.humidity;
        valHumi.innerText = `${node.sensorData.humidity}%`;
    }
    if (sliderMq7) {
        sliderMq7.value = node.sensorData.mq7;
        valMq7.innerText = `${node.sensorData.mq7} ppm`;
    }
    if (sliderMq135) {
        sliderMq135.value = node.sensorData.mq135;
        valMq135.innerText = `${node.sensorData.mq135} ppm`;
    }
}

// Initialise Simulator Script
window.addEventListener("DOMContentLoaded", () => {
    setupSimulatorUiListeners();
    startSimulator();
});
