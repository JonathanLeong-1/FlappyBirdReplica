const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');

// Set canvas size to window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Initial resize
resizeCanvas();

// Handle window resize
window.addEventListener('resize', resizeCanvas);

// Game variables
const bird = {
    x: canvas.width * 0.2,
    y: canvas.height / 2,
    width: 60,
    height: 45,
    gravity: 0.5,
    velocity: 0,
    jump: -8,
    rotation: 0,
    wingAngle: 0,
    isDead: false,
    deathRotation: 0
};

const pipes = [];
const pipeWidth = 80;
const pipeGap = canvas.height * 0.25;
let score = 0;
let highScore = localStorage.getItem('flappyBirdHighScore') || 0;
let gameOver = false;
let frameCount = 0;

// Cloud class
class Cloud {
    constructor() {
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height * 0.4);
        this.width = 100 + Math.random() * 100;
        this.height = 60 + Math.random() * 40;
        this.speed = 0.2 + Math.random() * 0.3;
    }

    update() {
        this.x -= this.speed;
        if (this.x + this.width < 0) {
            this.x = canvas.width;
            this.y = Math.random() * (canvas.height * 0.4);
        }
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.2, this.y + this.height * 0.5, this.height * 0.4, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.5, this.y + this.height * 0.3, this.height * 0.5, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.8, this.y + this.height * 0.5, this.height * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Create clouds
const clouds = Array(5).fill().map(() => new Cloud());

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameOver) {
            resetGame();
        } else {
            bird.velocity = bird.jump;
            bird.wingAngle = Math.PI * 0.5; // Start wing flap
        }
    }
});

// Game functions
function createPipe() {
    const minHeight = canvas.height * 0.1;
    const maxHeight = canvas.height - pipeGap - minHeight;
    const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    // Ensure the gap is not too difficult
    const minGap = canvas.height * 0.2; // Minimum gap size
    const maxGap = canvas.height * 0.3; // Maximum gap size
    const adjustedGap = Math.min(Math.max(pipeGap, minGap), maxGap);

    pipes.push({
        x: canvas.width,
        topHeight: height,
        bottomY: height + adjustedGap,
        passed: false
    });
}

function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.rotation = 0;
    bird.wingAngle = 0;
    bird.isDead = false;
    bird.deathRotation = 0;
    pipes.length = 0;
    score = 0;
    gameOver = false;
    frameCount = 0;
    scoreElement.textContent = `Score: ${score}`;
    gameOverElement.classList.add('hidden');
}

function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width * 0.5, bird.y + bird.height * 0.5);
    ctx.rotate(bird.rotation);

    // Bird body
    ctx.fillStyle = '#f8e71c';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width * 0.5, bird.height * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bird eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(bird.width * 0.2, -bird.height * 0.2, bird.width * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Bird pupil
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(bird.width * 0.25, -bird.height * 0.2, bird.width * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Bird beak
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(bird.width * 0.3, -bird.height * 0.1);
    ctx.lineTo(bird.width * 0.6, 0);
    ctx.lineTo(bird.width * 0.3, bird.height * 0.1);
    ctx.fill();

    // Bird wing
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.ellipse(-bird.width * 0.2, bird.height * 0.1,
                bird.width * 0.3, bird.height * 0.2, 
                bird.wingAngle, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

function update() {
    if (gameOver) {
        if (bird.isDead) {
            bird.deathRotation += 0.1;
            bird.rotation = Math.min(bird.deathRotation, Math.PI * 0.5);
            bird.y += 5;
        }
        return;
    }

    // Update bird
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    
    // Update bird rotation based on velocity
    bird.rotation = Math.min(Math.max(bird.velocity * 0.05, -Math.PI * 0.25), Math.PI * 0.25);
    
    // Update wing animation
    if (bird.wingAngle > 0) {
        bird.wingAngle -= 0.2;
    }

    // Check collisions with ground and ceiling
    if (bird.y + bird.height >= canvas.height || bird.y <= 0) {
        gameOver = true;
        bird.isDead = true;
        gameOverElement.classList.remove('hidden');
        updateHighScore();
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
                bird.isDead = true;
                gameOverElement.classList.remove('hidden');
                updateHighScore();
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

    // Update clouds
    clouds.forEach(cloud => cloud.update());

    frameCount++;
}

function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyBirdHighScore', highScore);
    }
    gameOverElement.innerHTML = `Game Over!<br>Score: ${score}<br>High Score: ${highScore}<br>Press Space to Restart`;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds
    clouds.forEach(cloud => cloud.draw());

    // Draw pipes
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    pipes.forEach(pipe => {
        // Top pipe
        ctx.fillStyle = '#73bf2e';
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY);
        ctx.strokeRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY);
    });

    // Draw bird
    drawBird();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop(); 