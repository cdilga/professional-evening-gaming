const button = document.getElementById("bounce-toggle");
const stage = document.querySelector(".stage");
const ball = document.getElementById("ball");
const shadow = document.querySelector(".shadow");

let running = false;
let rafId = 0;
let lastFrame = 0;

const state = {
  x: 96,
  y: 84,
  vx: 170,
  vy: 126,
  z: 0,
  vz: 0,
};

function layoutBall() {
  const size = 58;
  const shadowX = state.x - 13;
  const floorY = state.y + 42;
  const zLift = state.z;

  ball.style.transform = `translate(${state.x}px, ${state.y - zLift}px) scale(${1 + zLift / 360})`;
  shadow.style.transform = `translate(${shadowX}px, ${floorY}px) scale(${1 + zLift / 440})`;
  shadow.style.opacity = `${Math.max(0.16, 0.52 - zLift / 220)}`;

  if (state.x > stage.clientWidth - size || state.y > stage.clientHeight - size) {
    state.x = Math.min(state.x, stage.clientWidth - size);
    state.y = Math.min(state.y, stage.clientHeight - size);
  }
}

function animate(now) {
  if (!running) {
    return;
  }

  if (!lastFrame) {
    lastFrame = now;
  }

  const dt = Math.min((now - lastFrame) / 1000, 0.035);
  lastFrame = now;

  const width = stage.clientWidth - 58;
  const height = stage.clientHeight - 74;

  state.x += state.vx * dt;
  state.y += state.vy * dt;

  if (state.x <= 0 || state.x >= width) {
    state.vx *= -1;
    state.x = Math.max(0, Math.min(state.x, width));
  }

  if (state.y <= 0 || state.y >= height) {
    state.vy *= -1;
    state.y = Math.max(0, Math.min(state.y, height));
    state.vz = 220;
  }

  state.vz -= 420 * dt;
  state.z += state.vz * dt;
  if (state.z <= 0) {
    state.z = 0;
    state.vz *= -0.52;
    if (Math.abs(state.vz) < 42) {
      state.vz = 0;
    }
  }

  layoutBall();
  rafId = requestAnimationFrame(animate);
}

function toggle() {
  running = !running;
  button.textContent = running ? "Pause bounce" : "Start bouncing";

  if (running) {
    lastFrame = 0;
    rafId = requestAnimationFrame(animate);
  } else if (rafId) {
    cancelAnimationFrame(rafId);
  }
}

button.addEventListener("click", toggle);
window.addEventListener("resize", layoutBall);

layoutBall();
