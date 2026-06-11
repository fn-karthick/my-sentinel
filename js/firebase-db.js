// Sentinel Dashboard - Firebase DB & Auth Operations Layer

let isDemoMode = true;
let fbApp = null;
let fbAuth = null;
let fbDatabase = null;

// Registry of database change listeners
const dbCallbacks = {
    allNodes: [],
    singleNode: {} // format: { node1: [callbacks...], node2: [...] }
};

// In-Memory Database for Demo Mode
let localDbState = {
    nodes: {
        node1: {
            areaName: "Agriculture Zone",
            status: "online",
            sensorData: {
                temperature: 24.5,
                humidity: 68.2,
                mq7: 12.4,
                mq135: 92.1,
                anomaly: "No Anomaly",
                gasStatus: "Normal",
                timestamp: Date.now()
            },
            history: [],
            pestData: {
                latest: {
                    pestName: "Brown Planthopper",
                    confidence: 85.6,
                    timestamp: Date.now() - 3600000 * 2 // 2 hours ago
                },
                summary: {
                    totalDetections: 142,
                    mostDetected: "Brown Planthopper",
                    avgConfidence: 82.4
                },
                recent: [
                    { pestName: "Brown Planthopper", confidence: 85.6, timestamp: Date.now() - 3600000 * 2 },
                    { pestName: "Aphid", confidence: 78.2, timestamp: Date.now() - 3600000 * 4 },
                    { pestName: "Leaf Miner", confidence: 81.5, timestamp: Date.now() - 3600000 * 6 },
                    { pestName: "Whitefly", confidence: 88.0, timestamp: Date.now() - 3600000 * 8 },
                    { pestName: "Thrips", confidence: 79.1, timestamp: Date.now() - 3600000 * 10 }
                ],
                frequency: {
                    "Brown Planthopper": 45,
                    "Aphid": 30,
                    "Leaf Miner": 25,
                    "Whitefly": 22,
                    "Thrips": 20
                },
                confidenceTrend: [
                    { confidence: 81.2, timestamp: Date.now() - 3600000 * 10 },
                    { confidence: 88.0, timestamp: Date.now() - 3600000 * 8 },
                    { confidence: 81.5, timestamp: Date.now() - 3600000 * 6 },
                    { confidence: 78.2, timestamp: Date.now() - 3600000 * 4 },
                    { confidence: 85.6, timestamp: Date.now() - 3600000 * 2 }
                ]
            }
        },
        node2: {
            areaName: "Industrial Sector",
            status: "online",
            sensorData: {
                temperature: 28.1,
                humidity: 55.4,
                mq7: 42.1,
                mq135: 145.8,
                anomaly: "No Anomaly",
                gasStatus: "Normal",
                timestamp: Date.now()
            },
            history: [],
            pestData: {
                latest: {
                    pestName: "Thrips",
                    confidence: 76.5,
                    timestamp: Date.now() - 3600000 * 3
                },
                summary: {
                    totalDetections: 68,
                    mostDetected: "Thrips",
                    avgConfidence: 78.9
                },
                recent: [
                    { pestName: "Thrips", confidence: 76.5, timestamp: Date.now() - 3600000 * 3 },
                    { pestName: "Whitefly", confidence: 82.1, timestamp: Date.now() - 3600000 * 7 },
                    { pestName: "Aphid", confidence: 79.0, timestamp: Date.now() - 3600000 * 12 }
                ],
                frequency: {
                    "Brown Planthopper": 10,
                    "Aphid": 15,
                    "Leaf Miner": 8,
                    "Whitefly": 13,
                    "Thrips": 22
                },
                confidenceTrend: [
                    { confidence: 79.0, timestamp: Date.now() - 3600000 * 12 },
                    { confidence: 82.1, timestamp: Date.now() - 3600000 * 7 },
                    { confidence: 76.5, timestamp: Date.now() - 3600000 * 3 }
                ]
            }
        },
        node3: {
            areaName: "Greenhouse Facility",
            status: "online",
            sensorData: {
                temperature: 26.2,
                humidity: 78.5,
                mq7: 8.5,
                mq135: 65.2,
                anomaly: "No Anomaly",
                gasStatus: "Normal",
                timestamp: Date.now()
            },
            history: [],
            pestData: {
                latest: {
                    pestName: "Aphid",
                    confidence: 91.2,
                    timestamp: Date.now() - 3600000 * 1
                },
                summary: {
                    totalDetections: 215,
                    mostDetected: "Aphid",
                    avgConfidence: 85.1
                },
                recent: [
                    { pestName: "Aphid", confidence: 91.2, timestamp: Date.now() - 3600000 * 1 },
                    { pestName: "Brown Planthopper", confidence: 84.4, timestamp: Date.now() - 3600000 * 3 },
                    { pestName: "Whitefly", confidence: 89.2, timestamp: Date.now() - 3600000 * 5 }
                ],
                frequency: {
                    "Brown Planthopper": 52,
                    "Aphid": 78,
                    "Leaf Miner": 34,
                    "Whitefly": 41,
                    "Thrips": 10
                },
                confidenceTrend: [
                    { confidence: 89.2, timestamp: Date.now() - 3600000 * 5 },
                    { confidence: 84.4, timestamp: Date.now() - 3600000 * 3 },
                    { confidence: 91.2, timestamp: Date.now() - 3600000 * 1 }
                ]
            }
        },
        node4: {
            areaName: "Warehouse Vault",
            status: "online",
            sensorData: {
                temperature: 20.8,
                humidity: 48.1,
                mq7: 15.2,
                mq135: 110.5,
                anomaly: "No Anomaly",
                gasStatus: "Normal",
                timestamp: Date.now()
            },
            history: [],
            pestData: {
                latest: {
                    pestName: "Leaf Miner",
                    confidence: 83.2,
                    timestamp: Date.now() - 3600000 * 5
                },
                summary: {
                    totalDetections: 32,
                    mostDetected: "Leaf Miner",
                    avgConfidence: 81.3
                },
                recent: [
                    { pestName: "Leaf Miner", confidence: 83.2, timestamp: Date.now() - 3600000 * 5 },
                    { pestName: "Thrips", confidence: 79.4, timestamp: Date.now() - 3600000 * 9 }
                ],
                frequency: {
                    "Brown Planthopper": 5,
                    "Aphid": 6,
                    "Leaf Miner": 14,
                    "Whitefly": 3,
                    "Thrips": 4
                },
                confidenceTrend: [
                    { confidence: 79.4, timestamp: Date.now() - 3600000 * 9 },
                    { confidence: 83.2, timestamp: Date.now() - 3600000 * 5 }
                ]
            }
        }
    }
};

// Seed historical database metrics array on initialization
Object.keys(localDbState.nodes).forEach(nodeKey => {
    const node = localDbState.nodes[nodeKey];
    const baseTime = Date.now() - 60000 * 20; // 20 minutes ago
    for (let i = 0; i < 15; i++) {
        const t = baseTime + i * 60000;
        node.history.push({
            temperature: parseFloat((node.sensorData.temperature + (Math.random() * 2 - 1)).toFixed(1)),
            humidity: parseFloat((node.sensorData.humidity + (Math.random() * 4 - 2)).toFixed(1)),
            mq7: parseFloat((node.sensorData.mq7 + (Math.random() * 2 - 1)).toFixed(1)),
            mq135: parseFloat((node.sensorData.mq135 + (Math.random() * 8 - 4)).toFixed(1)),
            timestamp: t
        });
    }
});

// INITIALIZE SERVICE
function initializeDatabase() {
    const toast = document.getElementById("status-toast");
    const toastMessage = document.getElementById("toast-message");

    if (isFirebaseConfigured()) {
        try {
            isDemoMode = false;
            // Initialize Firebase App
            fbApp = firebase.initializeApp(firebaseConfig);
            fbAuth = firebase.auth();
            fbDatabase = firebase.database();
            
            console.log("Firebase initialized successfully.");
            
            // Set up real time listeners to sync with Firebase
            setupFirebaseListeners();

            if (toast) {
                toastMessage.innerText = "Synchronized with Firebase Realtime Database";
                toast.classList.remove("hidden");
                // Auto hide after 4s
                setTimeout(() => closeToast(), 4000);
            }
        } catch (e) {
            console.error("Firebase init failed, booting Demo Mode instead:", e);
            enableDemoMode(toast, toastMessage);
        }
    } else {
        enableDemoMode(toast, toastMessage);
    }
}

function enableDemoMode(toast, toastMessage) {
    isDemoMode = true;
    console.log("Starting Sentinel Dashboard in Offline Demo Mode.");
    if (toast) {
        toastMessage.innerText = "Firebase Credentials Unconfigured. Running in offline Demo Mode.";
        toast.classList.remove("hidden");
    }
    
    // Simulate real-time Firebase listeners by running an event loop
    setInterval(() => {
        if (isDemoMode) {
            triggerDbChangeEvents();
        }
    }, 1000);
}

function closeToast() {
    const toast = document.getElementById("status-toast");
    if (toast) toast.classList.add("hidden");
}

/* =========================================
   AUTHENTICATION API
   ========================================= */
function authSignIn(email, password) {
    return new Promise((resolve, reject) => {
        if (isDemoMode) {
            // Simulated validation
            setTimeout(() => {
                if (email.length > 3 && password.length >= 6) {
                    localStorage.setItem("sentinel_logged_in", "true");
                    localStorage.setItem("sentinel_user_email", email);
                    resolve({ email: email, uid: "demo-user-100" });
                } else {
                    reject({ message: "Invalid email structure or password too short (min 6 chars)." });
                }
            }, 1000);
        } else {
            fbAuth.signInWithEmailAndPassword(email, password)
                .then(userCredential => resolve(userCredential.user))
                .catch(error => reject(error));
        }
    });
}

function authSignOut() {
    return new Promise((resolve, reject) => {
        if (isDemoMode) {
            localStorage.removeItem("sentinel_logged_in");
            localStorage.removeItem("sentinel_user_email");
            resolve();
        } else {
            fbAuth.signOut()
                .then(() => resolve())
                .catch(error => reject(error));
        }
    });
}

function authOnStateChanged(callback) {
    if (isDemoMode) {
        // Run immediately to check localStorage
        setTimeout(() => {
            const isLoggedIn = localStorage.getItem("sentinel_logged_in") === "true";
            if (isLoggedIn) {
                const email = localStorage.getItem("sentinel_user_email") || "demo@sentinel.io";
                callback({ email: email, uid: "demo-user-100" });
            } else {
                callback(null);
            }
        }, 100);
    } else {
        fbAuth.onAuthStateChanged(callback);
    }
}

/* =========================================
   DATABASE DATABASE SYNCHRONIZATION API
   ========================================= */

// Real Firebase listeners setup
function setupFirebaseListeners() {
    // 1. Listen for nodes data changes
    const nodesRef = fbDatabase.ref('nodes');
   nodesRef.on('value', (snapshot) => {
    const val = snapshot.val();

    if (!val) return;

    Object.keys(val).forEach(nodeId => {

        // Convert history object → array
        if (
            val[nodeId].history &&
            !Array.isArray(val[nodeId].history)
        ) {
            val[nodeId].history = Object.values(val[nodeId].history);
        }

        // Convert recent pest detections object → array
        if (
            val[nodeId].pestData &&
            val[nodeId].pestData.recent &&
            !Array.isArray(val[nodeId].pestData.recent)
        ) {
            val[nodeId].pestData.recent =
                Object.values(val[nodeId].pestData.recent);
        }

        // Convert confidenceTrend object → array
        if (
            val[nodeId].pestData &&
            val[nodeId].pestData.confidenceTrend &&
            !Array.isArray(val[nodeId].pestData.confidenceTrend)
        ) {
            val[nodeId].pestData.confidenceTrend =
                Object.values(val[nodeId].pestData.confidenceTrend);
        }
    });

    localDbState.nodes = val;
    triggerDbChangeEvents();
});
}

// Subscribe to database changes
function subscribeToAllNodes(callback) {
    dbCallbacks.allNodes.push(callback);
    // Trigger immediately with current state
    setTimeout(() => callback(localDbState.nodes), 50);
}

function subscribeToSingleNode(nodeId, callback) {
    if (!dbCallbacks.singleNode[nodeId]) {
        dbCallbacks.singleNode[nodeId] = [];
    }
    dbCallbacks.singleNode[nodeId].push(callback);
    // Trigger immediately with current state
    setTimeout(() => {
        if (localDbState.nodes[nodeId]) {
            callback(localDbState.nodes[nodeId]);
        }
    }, 50);
}

// Dispatches events to subscribers
function triggerDbChangeEvents() {
    // Notify all nodes subscribers
    dbCallbacks.allNodes.forEach(cb => {
        try { cb(localDbState.nodes); } catch (e) { console.error("Error in all-nodes callback", e); }
    });

    // Notify node-specific subscribers
    Object.keys(dbCallbacks.singleNode).forEach(nodeId => {
        if (localDbState.nodes[nodeId]) {
            dbCallbacks.singleNode[nodeId].forEach(cb => {
                try { cb(localDbState.nodes[nodeId]); } catch (e) { console.error(`Error in ${nodeId} callback`, e); }
            });
        }
    });
}

// Push local data modifications up (or triggers update triggers locally)
function updateNodeTelemetry(nodeId, updatedSensors) {
    const timestamp = Date.now();
    const node = localDbState.nodes[nodeId];
    if (!node) return;

    // Set sensors
    node.sensorData = {
        ...node.sensorData,
        ...updatedSensors,
        timestamp: timestamp
    };

    // Update historical telemetry array (keeping max 30 items)
    if (!Array.isArray(node.history)) {     node.history = Object.values(node.history || {}); }  node.history.push({
        temperature: node.sensorData.temperature,
        humidity: node.sensorData.humidity,
        mq7: node.sensorData.mq7,
        mq135: node.sensorData.mq135,
        timestamp: timestamp
    });

    if (node.history.length > 30) {
        node.history.shift();
    }

    if (!isDemoMode) {
        // Sync to Firebase DB
        fbDatabase.ref(`nodes/${nodeId}/sensorData`).set(node.sensorData);
        fbDatabase.ref(`nodes/${nodeId}/history`).set(node.history);
    } else {
        triggerDbChangeEvents();
    }
}

function injectPestDetectionEvent(nodeId, pestName, confidence) {
    const node = localDbState.nodes[nodeId];
    if (!node) return;

    const timestamp = Date.now();
    const newDetection = {
        pestName: pestName,
        confidence: parseFloat(confidence.toFixed(1)),
        timestamp: timestamp
    };

    // Update latest detection
    node.pestData.latest = newDetection;

    // Add to recent detections table
    node.pestData.recent.unshift(newDetection);
    if (node.pestData.recent.length > 25) {
        node.pestData.recent.pop();
    }

    // Add to confidence trend line chart
    node.pestData.confidenceTrend.push({
        confidence: newDetection.confidence,
        timestamp: timestamp
    });
    if (node.pestData.confidenceTrend.length > 15) {
        node.pestData.confidenceTrend.shift();
    }

    // Increment frequencies count
    if (node.pestData.frequency[pestName] !== undefined) {
        node.pestData.frequency[pestName]++;
    } else {
        node.pestData.frequency[pestName] = 1;
    }

    // Re-evaluate summaries
    let totalDetections = 0;
    let maxCount = 0;
    let mostDetected = "None";
    let sumConfidence = 0;

    Object.keys(node.pestData.frequency).forEach(name => {
        const count = node.pestData.frequency[name];
        totalDetections += count;
        if (count > maxCount) {
            maxCount = count;
            mostDetected = name;
        }
    });

    node.pestData.recent.forEach(det => {
        sumConfidence += det.confidence;
    });

    const avgConfidence = node.pestData.recent.length > 0 
        ? parseFloat((sumConfidence / node.pestData.recent.length).toFixed(1)) 
        : 0;

    node.pestData.summary = {
        totalDetections: totalDetections,
        mostDetected: mostDetected,
        avgConfidence: avgConfidence
    };

    if (!isDemoMode) {
        // Sync to Firebase DB
        fbDatabase.ref(`nodes/${nodeId}/pestData`).set(node.pestData);
    } else {
        triggerDbChangeEvents();
    }
}

function renameNode(nodeId, newName) {
    const node = localDbState.nodes[nodeId];
    if (!node) return;

    node.areaName = newName;

    if (!isDemoMode) {
        fbDatabase.ref(`nodes/${nodeId}/areaName`).set(newName);
    } else {
        triggerDbChangeEvents();
    }
}

// Bootstrap on file load
window.addEventListener("DOMContentLoaded", () => {
    initializeDatabase();
});

