// ============================================================
// charts.js — Tạo và quản lý biểu đồ Chart.js
// ============================================================

import { state } from './state.js';

export function createChart(canvasId, type, labels, data, colors, centerText = '') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (state.chartInstances[canvasId]) {
        state.chartInstances[canvasId].destroy();
    }

    const chartPlugins = [];
    if (centerText && type === 'doughnut') {
        chartPlugins.push({
            id: 'centerText',
            beforeDraw: function(chart) {
                const width = chart.width, height = chart.height, ctx = chart.ctx;
                ctx.restore();
                const fontSize = (height / 110).toFixed(2);
                ctx.font = `bold ${fontSize}em Inter, sans-serif`;
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#374151';
                const text = centerText;
                const textX = Math.round((width - ctx.measureText(text).width) / 2);
                const textY = height / 2;
                ctx.fillText(text, textX, textY);
                ctx.save();
            }
        });
    }

    state.chartInstances[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: 'Số lượng',
                data: data,
                backgroundColor: colors,
                borderWidth: type === 'doughnut' ? 0 : 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { enabled: true }
            },
            cutout: type === 'doughnut' ? '70%' : '0%'
        },
        plugins: chartPlugins
    });
}
