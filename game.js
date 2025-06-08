const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');

// Set canvas size
canvas.width = 320;
canvas.height = 480;

// Game variables
const bird = {
    x: 50,
    y: canvas.height / 2,
    width: 34,
    height: 24,
    gravity: 0.5,
    velocity: 0,
    jump: -8
};

const pipes = [];
const pipeWidth = 52;
const pipeGap = 150;
let score = 0;
let gameOver = false;
let frameCount = 0;

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameOver) {
            resetGame();
        } else {
            bird.velocity = bird.jump;
        }
    }
});

// Game functions
function createPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - pipeGap - minHeight;
    const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    pipes.push({
        x: canvas.width,
        topHeight: height,
        bottomY: height + pipeGap,
        passed: false
    });
}

function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes.length = 0;
    score = 0;
    gameOver = false;
    frameCount = 0;
    scoreElement.textContent = `Score: ${score}`;
    gameOverElement.classList.add('hidden');
}

function update() {
    if (gameOver) return;

    // Update bird
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // Check collisions with ground and ceiling
    if (bird.y + bird.height >= canvas.height || bird.y <= 0) {
        gameOver = true;
        gameOverElement.classList.remove('hidden');
    }

    // Update pipes
    if (frameCount % 100 === 0) {
        createPipe();
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= 2;

        // Check collision with pipes
        if (bird.x + bird.width > pipe.x && bird.x < pipe.x + pipeWidth) {
            if (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY) {
                gameOver = true;
                gameOverElement.classList.remove('hidden');
            }
        }

        // Update score
        if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
            pipe.passed = true;
            score++;
            scoreElement.textContent = `Score: ${score}`;
        }

        // Remove off-screen pipes
        if (pipe.x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
    }

    frameCount++;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw bird
    ctx.fillStyle = '#f8e71c';
    ctx.fillRect(bird.x, bird.y, bird.width, bird.height);

    // Draw pipes
    ctx.fillStyle = '#73bf2e';
    pipes.forEach(pipe => {
        // Top pipe
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY);
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop(); 