const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const tensionInput = document.getElementById("tension");
const dampingInput = document.getElementById("damping");
const spreadInput = document.getElementById("spread");
const tensionValue = document.getElementById("tensionValue");
const dampingValue = document.getElementById("dampingValue");
const spreadValue = document.getElementById("spreadValue");
const waveIntensityInput = document.getElementById("waveIntensity");
const waveButton = document.getElementById("waveButton");

function syncControls() {
    tensionValue.textContent = Number(tensionInput.value).toFixed(3);
    dampingValue.textContent = Number(dampingInput.value).toFixed(3);
    spreadValue.textContent = Number(spreadInput.value).toFixed(2);
}

[tensionInput, dampingInput, spreadInput].forEach(input => 
    input.addEventListener("input", syncControls)
);
syncControls();

const seaLevel = canvas.height / 2;
const columnWidth = 4;
const columns = [];

for (let i = 0; i < canvas.width / columnWidth; i++) {
    columns.push({ y: seaLevel, velocity: 0 });
}
const balls = [];

const GRAVITY = 0.4;
const FLOATABILITY = 0.08;
const WATER_DRAG = 0.92;
const AIR_DRAG = 0.99;

canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    balls.push({
        x: x,
        y: y,
        vy: 0,
        radius: 15 + Math.random() * 10,
        mass: 1.5
    });
});

waveButton.addEventListener("click", () => {
    const intensity = Number(waveIntensityInput.value)/5.0;
    const middleIdx = Math.floor(columns.length / 2);
    const waveRadius = 15;
    
    for (let i = -waveRadius; i <= waveRadius; i++) {
        const ratio = i / waveRadius;
        const amount = Math.cos(ratio * Math.PI / 2);
        
        const targetIdx = middleIdx + i;
        if (targetIdx >= 0 && targetIdx < columns.length) {
            columns[targetIdx].velocity -= amount * intensity;
        }
    }
});

function update() {
    const tension = Number(tensionInput.value);
    const fluidDamping = Number(dampingInput.value);
    const spread = Number(spreadInput.value);

    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const b1 = balls[i];
            const b2 = balls[j];
        
            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = b1.radius + b2.radius;

            if (distance < minDistance) {
                const overlap = minDistance - distance;
                const forceX = (dx / distance) * overlap * 0.1;

                b1.x -= forceX;
                b2.x += forceX;
                b1.vx -= forceX * 0.5;
                b2.vx += forceX * 0.5;
            }
        }
        
        balls[i].x += balls[i].vx || 0;
        balls[i].vx *= 0.95; 

        if (balls[i].x - balls[i].radius < 0) {
            balls[i].x = balls[i].radius; 
            balls[i].vx *= -0.6;
        } else if (balls[i].x + balls[i].radius > canvas.width) {
            balls[i].x = canvas.width - balls[i].radius;
            balls[i].vx *= -0.6;
        }
    }

    for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        b.vy += GRAVITY;
        b.y += b.vy;

        const colIdx = Math.floor(b.x / columnWidth);
        if (colIdx >= 0 && colIdx < columns.length) {
            const surfaceY = columns[colIdx].y;
            if (b.y + b.radius > surfaceY) {
                const depth = (b.y + b.radius) - surfaceY;
                const force = depth * FLOATABILITY;
                b.vy -= force / b.mass;
                columns[colIdx].velocity += force * 0.5; 
                b.vy *= WATER_DRAG;
            } else {
                b.vy *= AIR_DRAG;
            }
        }
        if (b.y > canvas.height + 100) {
            balls.splice(i, 1);
        }
    }

    for (let i = 0; i < columns.length; i++) {
        const c = columns[i];
        const displacement = seaLevel - c.y; 
        c.velocity += tension * displacement - c.velocity * fluidDamping;
        c.y += c.velocity;
    }

    const leftVariations = new Array(columns.length).fill(0);
    const rightVariations = new Array(columns.length).fill(0);
    const p = spread

    for (let pass = 0; pass < 8; pass++) { 
        for (let i = 0; i < columns.length; i++) {
            if (i > 0) {
                leftVariations[i] = p * (columns[i].y - columns[i - 1].y);
                columns[i - 1].velocity += leftVariations[i];
            }
            if (i < columns.length - 1) {
                rightVariations[i] = p * (columns[i].y - columns[i + 1].y);
                columns[i + 1].velocity += rightVariations[i];
            }
        }
        for (let i = 0; i < columns.length; i++) {
            if (i > 0) columns[i - 1].y += leftVariations[i];
            if (i < columns.length - 1) columns[i + 1].y += rightVariations[i];
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111827"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const b of balls) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#fb923c";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#fff";
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(0, canvas.height); 
    
    for (let i = 0; i < columns.length; i++) {
        ctx.lineTo(i * columnWidth, columns[i].y);
    }
    
    ctx.lineTo(canvas.width, columns[columns.length - 1].y);
    ctx.lineTo(canvas.width, canvas.height); 
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "rgba(56, 189, 248, 0.75)");
    gradient.addColorStop(1, "rgba(2, 132, 199, 0.95)");  
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < columns.length; i++) {
        ctx.lineTo(i * columnWidth, columns[i].y);
    }
    ctx.lineTo(canvas.width, columns[columns.length-1].y); 
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(186, 230, 253, 0.9)";
    ctx.stroke();
}

function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
}

animate();