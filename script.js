const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiOverlay = document.getElementById('uiOverlay');
const startBtn = document.getElementById('startBtn');
const menuTitle = document.getElementById('menuTitle');
const menuSubtitle = document.getElementById('menuSubtitle');

let gameState = 'START'; 
let score = 0;
let highScore = 0;
let gameSpeed = 3;

let isBoosting = false;

const player = {
    x: 100,
    y: 200,
    width: 50,
    height: 30,
    velocity: 0,
    gravity: 0.35,      
    jumpForce: -5.5,    
    maxSpeed: 6,        
    tilt: 0
};

let stars = [];      
let obstacles = [];  
let collectibles = []; 
let lasers = [];

function initBackgroundStars() {
    stars = [];
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

function resetGame() {
    player.y = 200;
    player.velocity = 0;
    player.tilt = 0;
    score = 0;
    gameSpeed = 3.5;
    obstacles = [];
    collectibles = [];
    lasers = [];
    initBackgroundStars();
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (!isBoosting && gameState === 'PLAYING') {
            player.velocity = player.jumpForce; 
        }
        isBoosting = true;
        if (gameState === 'PLAYING') e.preventDefault();
    }
    if (e.code === 'KeyF') {
        if (gameState === 'PLAYING') {
            lasers.push({
                x: player.x + player.width,
                y: player.y + player.height / 2,
                width: 15,
                height: 4,
                speed: 10
            });
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        isBoosting = false;
    }
});

startBtn.addEventListener('click', () => {
    resetGame();
    gameState = 'PLAYING';
    uiOverlay.classList.add('hidden');
});

let spawnTimer = 0;
function handleSpawning() {
    spawnTimer++;
    if (spawnTimer % 90 === 0) { 
        const obsY = Math.random() * (canvas.height - 60) + 20;
        const obsSize = Math.random() * 20 + 20;
        obstacles.push({
            x: canvas.width,
            y: obsY,
            size: obsSize,
            speed: gameSpeed + (Math.random() * 1.5)
        });

        if (Math.random() > 0.4) {
            const colY = Math.random() * (canvas.height - 40) + 20;
            collectibles.push({
                x: canvas.width + 40,
                y: colY,
                size: 12,
                collected: false
            });
        }
    }
}

function update() {
    if (gameState !== 'PLAYING') return;

    gameSpeed += 0.0005;

    if (isBoosting) {
        player.velocity -= 0.5; 
        player.tilt = -0.15; 
    } else {
        player.velocity += player.gravity;
        player.tilt = 0.15; 
    }

    if (player.velocity > player.maxSpeed) player.velocity = player.maxSpeed;
    if (player.velocity < -player.maxSpeed) player.velocity = -player.maxSpeed;

    player.y += player.velocity;

    if (player.y < 0) {
        player.y = 0;
        player.velocity = 0;
    }
    if (player.y + player.height > canvas.height) {
        gameOver();
    }

    stars.forEach(star => {
        star.x -= star.speed;
        if (star.x < 0) star.x = canvas.width;
    });

    for (let i = lasers.length - 1; i >= 0; i--) {
        lasers[i].x += lasers[i].speed;
        if (lasers[i].x > canvas.width) {
            lasers.splice(i, 1);
        }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= obstacles[i].speed;

        let obs = obstacles[i];
        let closestX = Math.max(player.x, Math.min(obs.x, player.x + player.width));
        let closestY = Math.max(player.y, Math.min(obs.y, player.y + player.height));
        let distanceX = obs.x - closestX;
        let distanceY = obs.y - closestY;
        let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

        if (distanceSquared < (obs.size / 2) * (obs.size / 2)) {
            gameOver();
            return;
        }

        for (let j = lasers.length - 1; j >= 0; j--) {
            let laser = lasers[j];
            let lClosestX = Math.max(laser.x, Math.min(obs.x, laser.x + laser.width));
            let lClosestY = Math.max(laser.y, Math.min(obs.y, laser.y + laser.height));
            let lDistanceX = obs.x - lClosestX;
            let lDistanceY = obs.y - lClosestY;
            let lDistanceSquared = (lDistanceX * lDistanceX) + (lDistanceY * lDistanceY);

            if (lDistanceSquared < (obs.size / 2) * (obs.size / 2)) {
                obstacles.splice(i, 1);
                lasers.splice(j, 1);
                score += 10;
                break;
            }
        }

        if (obstacles[i] && obstacles[i].x + obstacles[i].size < 0) {
            obstacles.splice(i, 1);
            score += 5; 
        }
    }

    for (let i = collectibles.length - 1; i >= 0; i--) {
        collectibles[i].x -= gameSpeed;

        let col = collectibles[i];
        let pCenterX = player.x + player.width / 2;
        let pCenterY = player.y + player.height / 2;
        let dist = Math.hypot(col.x - pCenterX, col.y - pCenterY);

        if (dist < (player.width / 2 + col.size) && !col.collected) {
            col.collected = true;
            score += 25; 
            collectibles.splice(i, 1);
            continue;
        }

        if (collectibles[i].x + col.size < 0) {
            collectibles.splice(i, 1);
        }
    }

    handleSpawning();
}

function gameOver() {
    gameState = 'GAMEOVER';
    if (score > highScore) highScore = score;
    
    menuTitle.innerText = "GAME OVER";
    menuSubtitle.innerHTML = `Skor Anda: <b style="color:#fff">${Math.floor(score)}</b> | Tertinggi: <b style="color:#fff">${Math.floor(highScore)}</b>`;
    startBtn.innerText = "COBA LAGI";
    uiOverlay.classList.remove('hidden');
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    collectibles.forEach(col => {
        ctx.save();
        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(col.x, col.y - col.size);
        ctx.lineTo(col.x + col.size/3, col.y - col.size/3);
        ctx.lineTo(col.x + col.size, col.y);
        ctx.lineTo(col.x + col.size/3, col.y + col.size/3);
        ctx.lineTo(col.x, col.y + col.size);
        ctx.lineTo(col.x - col.size/3, col.y + col.size/3);
        ctx.lineTo(col.x - col.size, col.y);
        ctx.lineTo(col.x - col.size/3, col.y - col.size/3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });

    ctx.fillStyle = '#00ffcc';
    lasers.forEach(laser => {
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
    });

    obstacles.forEach(obs => {
        ctx.save();
        let gradient = ctx.createRadialGradient(obs.x, obs.y, 2, obs.x, obs.y, obs.size/2);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.8, '#4a3737');
        gradient.addColorStop(1, '#2b1d1d');
        
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff3333';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.tilt);

    if (isBoosting && gameState === 'PLAYING') {
        ctx.fillStyle = Math.random() > 0.5 ? '#ff9900' : '#ff3300';
        ctx.beginPath();
        ctx.moveTo(-player.width/2, -5);
        ctx.lineTo(-player.width/2 - (Math.random() * 20 + 10), 0);
        ctx.lineTo(-player.width/2, 5);
        ctx.closePath();
        ctx.fill();
    }

    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(-player.width / 2, -5, player.width - 10, 10);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.width / 2 - 15, -5);
    ctx.lineTo(player.width / 2 - 5, -20);
    ctx.lineTo(player.width / 2 - 12, -20);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.strokeStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(0, -10, 12, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.fillRect(-player.width/2 + 5, 5, 10, 6);
    ctx.fillRect(player.width/2 - 20, 5, 10, 6);
    
    ctx.restore();

    if (gameState === 'PLAYING') {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px "Segoe UI"';
        ctx.fillText(`SKOR: ${Math.floor(score)}`, 20, 35);
        
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '14px "Segoe UI"';
        ctx.fillText(`TERTINGGI: ${Math.floor(highScore)}`, 20, 55);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

initBackgroundStars();
gameLoop();
