// Sentinel Dashboard - Chart.js Telemetry Visualization Engine

let tempChartInstance = null;
let mq7ChartInstance = null;
let mq135ChartInstance = null;
let pestFreqChartInstance = null;
let pestConfChartInstance = null;

// Helper to create neon gradient under charts
function createChartGradient(ctx, colorGlow) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, colorGlow);
    gradient.addColorStop(1, 'rgba(6, 16, 27, 0)');
    return gradient;
}

// Chart.js Default Dark Theme Grid Config
const getChartConfig = (labelColor, gridColor, fontFace) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: 'rgba(8, 23, 38, 0.9)',
            titleFont: { family: fontFace, size: 11, weight: 'bold' },
            bodyFont: { family: fontFace, size: 12 },
            borderColor: 'rgba(0, 212, 255, 0.25)',
            borderWidth: 1,
            displayColors: false,
            callbacks: {
                title: (items) => {
                    const t = new Date(items[0].parsed.x);
                    return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                }
            }
        }
    },
    scales: {
        x: {
            type: 'linear',
            position: 'bottom',
            grid: { color: gridColor, drawTicks: false },
            ticks: {
                color: labelColor,
                font: { family: fontFace, size: 9 },
                callback: (val) => {
                    const d = new Date(val);
                    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
            }
        },
        y: {
            grid: { color: gridColor, drawTicks: false },
            ticks: {
                color: labelColor,
                font: { family: fontFace, size: 10 }
            }
        }
    }
});

/* =========================================
   INITIALIZE CHARTS
   ========================================= */
function initDashboardCharts() {
    const fontFace = "'Share Tech Mono', monospace";
    const labelColor = '#9fb6cc';
    const gridColor = 'rgba(255, 255, 255, 0.04)';

    // 1. Temperature Chart
    const tempCanvas = document.getElementById('chart-temp-history');
    if (tempCanvas) {
        const ctx = tempCanvas.getContext('2d');
        tempChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Temperature',
                    borderColor: '#00d4ff',
                    borderWidth: 2,
                    pointBackgroundColor: '#00d4ff',
                    pointBorderColor: 'rgba(255,255,255,0.8)',
                    pointHoverRadius: 5,
                    pointRadius: 2,
                    fill: true,
                    backgroundColor: createChartGradient(ctx, 'rgba(0, 212, 255, 0.15)'),
                    data: []
                }]
            },
            options: getChartConfig(labelColor, gridColor, fontFace)
        });
    }

    // 2. MQ7 CO Chart
    const mq7Canvas = document.getElementById('chart-mq7-history');
    if (mq7Canvas) {
        const ctx = mq7Canvas.getContext('2d');
        mq7ChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'CO (MQ7)',
                    borderColor: '#bf55ec',
                    borderWidth: 2,
                    pointBackgroundColor: '#bf55ec',
                    pointBorderColor: 'rgba(255,255,255,0.8)',
                    pointHoverRadius: 5,
                    pointRadius: 2,
                    fill: true,
                    backgroundColor: createChartGradient(ctx, 'rgba(191, 85, 236, 0.15)'),
                    data: []
                }]
            },
            options: getChartConfig(labelColor, gridColor, fontFace)
        });
    }

    // 3. MQ135 Air Quality Chart
    const mq135Canvas = document.getElementById('chart-mq135-history');
    if (mq135Canvas) {
        const ctx = mq135Canvas.getContext('2d');
        mq135ChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Air Quality (MQ135)',
                    borderColor: '#20d67b',
                    borderWidth: 2,
                    pointBackgroundColor: '#20d67b',
                    pointBorderColor: 'rgba(255,255,255,0.8)',
                    pointHoverRadius: 5,
                    pointRadius: 2,
                    fill: true,
                    backgroundColor: createChartGradient(ctx, 'rgba(32, 214, 123, 0.15)'),
                    data: []
                }]
            },
            options: getChartConfig(labelColor, gridColor, fontFace)
        });
    }
}

/* =========================================
   MODAL CHARTS INITIALIZATION
   ========================================= */
function initModalCharts(frequencyData, confidenceTrendData) {
    const fontFace = "'Share Tech Mono', monospace";
    const labelColor = '#9fb6cc';
    const gridColor = 'rgba(255, 255, 255, 0.04)';

    // Pest Frequency Bar Chart
    const freqCanvas = document.getElementById('chart-pest-frequency');
    if (freqCanvas) {
        const ctx = freqCanvas.getContext('2d');
        
        // Extract species keys and values
        const labels = Object.keys(frequencyData);
        const data = Object.values(frequencyData);

        if (pestFreqChartInstance) {
            pestFreqChartInstance.destroy();
        }

        pestFreqChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Detections',
                    backgroundColor: 'rgba(0, 212, 255, 0.25)',
                    borderColor: '#00d4ff',
                    borderWidth: 1.5,
                    hoverBackgroundColor: '#00d4ff',
                    data: data
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: labelColor, font: { family: fontFace, size: 9 } }
                    },
                    y: {
                        grid: { color: gridColor, drawTicks: false },
                        ticks: { color: labelColor, font: { family: fontFace, size: 9 }, stepSize: 5 }
                    }
                }
            }
        });
    }

    // Pest Confidence Trend Chart (Line)
    const confCanvas = document.getElementById('chart-pest-confidence');
    if (confCanvas) {
        const ctx = confCanvas.getContext('2d');
        const dataPoints = confidenceTrendData.map((pt, idx) => ({ x: idx + 1, y: pt.confidence }));

        if (pestConfChartInstance) {
            pestConfChartInstance.destroy();
        }

        pestConfChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Confidence %',
                    borderColor: '#ff5f6d',
                    borderWidth: 2,
                    pointBackgroundColor: '#ff5f6d',
                    pointRadius: 3,
                    fill: false,
                    tension: 0.2,
                    data: dataPoints
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: labelColor,
                            font: { family: fontFace, size: 9 },
                            callback: (val) => `D-${val}`
                        }
                    },
                    y: {
                        min: 50,
                        max: 100,
                        grid: { color: gridColor, drawTicks: false },
                        ticks: { color: labelColor, font: { family: fontFace, size: 9 } }
                    }
                }
            }
        });
    }
}

/* =========================================
   UPDATE CHARTS DATA
   ========================================= */
function updateTelemetryCharts(historyArray) {
    if (!historyArray || historyArray.length === 0) return;

    // Convert timestamps and fields to chart data coordinates
    const tempPoints = historyArray.map(item => ({ x: item.timestamp, y: item.temperature }));
    const mq7Points = historyArray.map(item => ({ x: item.timestamp, y: item.mq7 }));
    const mq135Points = historyArray.map(item => ({ x: item.timestamp, y: item.mq135 }));

    if (tempChartInstance) {
        tempChartInstance.data.datasets[0].data = tempPoints;
        tempChartInstance.update('none'); // Update without animation loops for efficiency
    }

    if (mq7ChartInstance) {
        mq7ChartInstance.data.datasets[0].data = mq7Points;
        mq7ChartInstance.update('none');
    }

    if (mq135ChartInstance) {
        mq135ChartInstance.data.datasets[0].data = mq135Points;
        mq135ChartInstance.update('none');
    }

    // Update canvas sparklines in summary cards
    const tempsOnly = historyArray.map(item => item.temperature).slice(-10);
    const humisOnly = historyArray.map(item => item.humidity).slice(-10);
    
    drawSparkline('spark-temp', tempsOnly, '#00d4ff');
    drawSparkline('spark-humi', humisOnly, '#00d4ff');
}

/* =========================================
   CANVAS SPARKLINE DRAWER (LIGHTWEIGHT)
   ========================================= */
function drawSparkline(canvasId, dataPoints, strokeColor) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!dataPoints || dataPoints.length < 2) return;
    
    const maxVal = Math.max(...dataPoints);
    const minVal = Math.min(...dataPoints);
    const valRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;
    
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Smooth grid lines
    ctx.shadowBlur = 4;
    ctx.shadowColor = strokeColor;
    
    for (let i = 0; i < dataPoints.length; i++) {
        const x = (i / (dataPoints.length - 1)) * canvas.width;
        const y = canvas.height - ((dataPoints[i] - minVal) / valRange) * (canvas.height - 8) - 4;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // reset
}

// Initialize on script load
window.addEventListener("DOMContentLoaded", () => {
    initDashboardCharts();
});
