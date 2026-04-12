const chart = document.getElementById('barrel-chart');
const refreshButton = document.getElementById('barrel-refresh');
const totalEl = document.getElementById('barrel-total');
const chaosEl = document.getElementById('chaos-score');
const vibesEl = document.getElementById('vibes-score');
const approvalEl = document.getElementById('approval-count');
const eventsEl = document.getElementById('barrel-events');

const vibeWords = ['Mint', 'Cooked', 'Suspiciously fine', 'Certified elite', 'Held together by zip ties'];
const eventTemplates = [
  'Night shift found another 1.2M pretend barrels behind the ute.',
  'Refinery dashboard turned green after someone hit refresh aggressively.',
  'Discord approvals achieved with a powerful double “send it”.',
  'Logistics team confirmed the pipeline is made of optimism and kebab wrappers.',
  'Cloud throughput stabilised after rotating the imaginary valve 14 degrees.'
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function generateSeries() {
  return Array.from({ length: 12 }, (_, index) => ({
    label: `H${index + 1}`,
    value: Math.round(randomBetween(12.8, 22.4) * 10) / 10
  }));
}

function renderChart(series) {
  if (!chart) return;
  const ctx = chart.getContext('2d');
  const width = chart.width;
  const height = chart.height;
  const padding = 36;
  const maxValue = Math.max(...series.map((point) => point.value)) + 2;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#faf7f0';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(92, 64, 51, 0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding + ((height - padding * 2) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#3d2b1f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  series.forEach((point, index) => {
    const x = padding + ((width - padding * 2) / (series.length - 1)) * index;
    const y = height - padding - (point.value / maxValue) * (height - padding * 2);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = '#7df9c1';
  series.forEach((point, index) => {
    const x = padding + ((width - padding * 2) / (series.length - 1)) * index;
    const y = height - padding - (point.value / maxValue) * (height - padding * 2);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#5c4033';
  ctx.font = '16px Kalam';
  series.forEach((point, index) => {
    const x = padding + ((width - padding * 2) / (series.length - 1)) * index;
    ctx.fillText(point.label, x - 10, height - 10);
  });
}

function renderEvents() {
  if (!eventsEl) return;
  const picks = [...eventTemplates].sort(() => Math.random() - 0.5).slice(0, 4);
  eventsEl.innerHTML = picks.map((event) => `<li>${event}</li>`).join('');
}

function refreshDashboard() {
  const series = generateSeries();
  const avg = series.reduce((sum, point) => sum + point.value, 0) / series.length;
  totalEl.textContent = `${avg.toFixed(1)}M`;
  chaosEl.textContent = `${Math.round(randomBetween(61, 93))}%`;
  vibesEl.textContent = vibeWords[Math.floor(Math.random() * vibeWords.length)];
  approvalEl.textContent = `${Math.round(randomBetween(2, 5))}/2`;
  renderChart(series);
  renderEvents();
}

refreshButton?.addEventListener('click', refreshDashboard);
refreshDashboard();
