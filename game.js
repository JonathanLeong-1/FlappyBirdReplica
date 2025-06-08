const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const gameOverElement = document.getElementById('gameOver');
const menuElement = document.getElementById('menu');
const startButton = document.getElementById('startButton');
const menuBackground = document.getElementById('menuBackground');
const menuCtx = menuBackground.getContext('2d');

// Set canvas size to window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    menuBackground.width = window.innerWidth;
    menuBackground.height = window.innerHeight;
    
    // Clear both canvases
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    menuCtx.clearRect(0, 0, canvas.width, canvas.height);
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
let highScore = parseInt(localStorage.getItem('flappyBirdHighScore')) || 0;
let gameOver = false;
let gameStarted = false;
let frameCount = 0;
let lastPipeCenter = null; // Track the center point of the last pipe's gap

// Menu background variables
let menuPipes = [];
let menuLastPipeTime = 0;
const menuPipeInterval = 2000; // Slower pipe generation for menu
const menuPipeSpeed = 1; // Slower pipe movement for menu

// Update high score display
function updateHighScoreDisplay() {
    highScoreElement.textContent = `High Score: ${highScore}`;
}

// Initial high score display
updateHighScoreDisplay();

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
const clouds = Array(8).fill().map(() => new Cloud());

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!gameStarted) return;
        if (gameOver) {
            resetGame();
        } else {
            bird.velocity = bird.jump;
            bird.wingAngle = Math.PI * 0.5;
        }
    }
});

startButton.addEventListener('click', () => {
    gameStarted = true;
    menuElement.classList.add('hidden');
    scoreElement.classList.remove('hidden');
    resetGame();
});

// Game functions
function createPipe() {
    // Calculate safe height range for pipes
    const minHeight = canvas.height * 0.15; // Minimum height from top
    const maxHeight = canvas.height * 0.65; // Maximum height from top
    
    // Calculate the target center point for the new pipe
    let targetCenter;
    if (lastPipeCenter === null) {
        // First pipe - place it in the middle of the screen
        targetCenter = canvas.height * 0.4;
    } else {
        // Calculate maximum allowed vertical movement
        const maxVerticalMovement = canvas.height * 0.28; // Balanced between previous 0.2 and current 0.35
        
        // Add some randomness to the movement
        let movement;
        if (Math.random() < 0.2) { // Reduced from 0.3 to 0.2 for less extreme movements
            movement = (Math.random() * 2 - 1) * maxVerticalMovement * 1.3; // Reduced from 1.5 to 1.3
        } else {
            movement = (Math.random() * 2 - 1) * maxVerticalMovement;
        }
        
        // Add a slight bias towards the center of the screen
        const centerBias = (canvas.height * 0.5 - lastPipeCenter) * 0.15; // Increased from 0.1 to 0.15 for more stability
        targetCenter = lastPipeCenter + movement + centerBias;
        
        // Ensure the target center stays within reasonable bounds
        targetCenter = Math.max(canvas.height * 0.28, Math.min(canvas.height * 0.72, targetCenter)); // Tighter bounds
    }
    
    // Calculate the gap size with some variation
    const minGap = canvas.height * 0.24; // Increased from 0.22 to 0.24 for slightly easier gaps
    const maxGap = canvas.height * 0.29; // Increased from 0.28 to 0.29
    const adjustedGap = Math.min(Math.max(pipeGap, minGap), maxGap);
    
    // Calculate the top pipe height based on the target center
    const topHeight = targetCenter - (adjustedGap / 2);
    
    // Ensure the top height stays within bounds
    const finalTopHeight = Math.max(minHeight, Math.min(maxHeight, topHeight));
    const finalBottomY = finalTopHeight + adjustedGap;
    
    // Update the last pipe center for the next pipe
    lastPipeCenter = (finalTopHeight + finalBottomY) / 2;
    
    pipes.push({
        x: canvas.width,
        topHeight: finalTopHeight,
        bottomY: finalBottomY,
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
    lastPipeCenter = null;
    score = 0;
    gameOver = false;
    frameCount = 0;
    scoreElement.textContent = `Score: ${score}`;
    scoreElement.classList.remove('hidden');
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

function drawPipe(x, topHeight, bottomY) {
    // Draw top pipe
    ctx.fillStyle = '#73bf2e';
    ctx.strokeStyle = '#2d4a1e';
    ctx.lineWidth = 3;
    
    // Pipe body
    ctx.fillRect(x, 0, pipeWidth, topHeight);
    ctx.strokeRect(x, 0, pipeWidth, topHeight);
    
    // Pipe cap
    ctx.fillStyle = '#8cd93f';
    ctx.fillRect(x - 5, topHeight - 20, pipeWidth + 10, 20);
    ctx.strokeRect(x - 5, topHeight - 20, pipeWidth + 10, 20);
    
    // Pipe details
    ctx.fillStyle = '#2d4a1e';
    ctx.fillRect(x + 10, 10, 10, topHeight - 30);
    ctx.fillRect(x + pipeWidth - 20, 10, 10, topHeight - 30);
    
    // Draw bottom pipe
    ctx.fillStyle = '#73bf2e';
    ctx.fillRect(x, bottomY, pipeWidth, canvas.height - bottomY);
    ctx.strokeRect(x, bottomY, pipeWidth, canvas.height - bottomY);
    
    // Bottom pipe cap
    ctx.fillStyle = '#8cd93f';
    ctx.fillRect(x - 5, bottomY, pipeWidth + 10, 20);
    ctx.strokeRect(x - 5, bottomY, pipeWidth + 10, 20);
    
    // Bottom pipe details
    ctx.fillStyle = '#2d4a1e';
    ctx.fillRect(x + 10, bottomY + 30, 10, canvas.height - bottomY - 40);
    ctx.fillRect(x + pipeWidth - 20, bottomY + 30, 10, canvas.height - bottomY - 40);
}

function update() {
    if (!gameStarted || gameOver) {
        if (gameOver && bird.isDead) {
            bird.deathRotation += 0.1;
            bird.rotation = Math.min(bird.deathRotation, Math.PI * 0.5);
            bird.y += 5;
        }
        return;
    }

    // Update bird
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    
    bird.rotation = Math.min(Math.max(bird.velocity * 0.05, -Math.PI * 0.25), Math.PI * 0.25);
    
    if (bird.wingAngle > 0) {
        bird.wingAngle -= 0.2;
    }

    if (bird.y + bird.height >= canvas.height || bird.y <= 0) {
        gameOver = true;
        bird.isDead = true;
        gameOverElement.classList.remove('hidden');
        updateHighScore();
    }

    if (frameCount % 100 === 0) {
        createPipe();
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= 2;

        if (bird.x + bird.width > pipe.x && bird.x < pipe.x + pipeWidth) {
            if (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY) {
                gameOver = true;
                bird.isDead = true;
                gameOverElement.classList.remove('hidden');
                updateHighScore();
            }
        }

        if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
            pipe.passed = true;
            score++;
            scoreElement.textContent = `Score: ${score}`;
        }

        if (pipe.x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
    }

    clouds.forEach(cloud => cloud.update());

    frameCount++;
}

function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyBirdHighScore', highScore);
        updateHighScoreDisplay();
    }
    gameOverElement.innerHTML = `Game Over!<br>Score: ${score}<br>High Score: ${highScore}<br>Press Space to Restart`;
}

function draw() {
    if (gameStarted) {
        // Draw game elements
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        clouds.forEach(cloud => cloud.draw());

        pipes.forEach(pipe => {
            drawPipe(pipe.x, pipe.topHeight, pipe.bottomY);
        });
        drawBird();
    } else {
        // Make game canvas completely transparent when menu is showing
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();

// Initialize menu background
function initMenuBackground() {
    menuPipes = [];
    menuLastPipeTime = 0;
    
    // Reset cloud positions
    clouds.forEach(cloud => {
        cloud.x = Math.random() * canvas.width;
        cloud.y = Math.random() * (canvas.height * 0.4);
    });
    
    // Create initial pipes
    for (let i = 0; i < 3; i++) {
        createMenuPipe(canvas.width + (i * (canvas.width / 2)));
    }
    
    // Initial draw of menu background
    drawMenuBackground();
}

// Create a pipe for the menu background
function createMenuPipe(x) {
    const gap = canvas.height * 0.25;
    const minHeight = canvas.height * 0.15;
    const maxHeight = canvas.height * 0.65;
    const center = minHeight + Math.random() * (maxHeight - minHeight);
    
    menuPipes.push({
        x: x,
        topHeight: center - gap/2,
        bottomY: center + gap/2,
        passed: false
    });
}

// Draw menu background
function drawMenuBackground() {
    // Clear the background
    menuCtx.fillStyle = '#70c5ce';
    menuCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds
    clouds.forEach(cloud => {
        menuCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        menuCtx.beginPath();
        menuCtx.arc(cloud.x + cloud.width * 0.2, cloud.y + cloud.height * 0.5, cloud.height * 0.4, 0, Math.PI * 2);
        menuCtx.arc(cloud.x + cloud.width * 0.5, cloud.y + cloud.height * 0.3, cloud.height * 0.5, 0, Math.PI * 2);
        menuCtx.arc(cloud.x + cloud.width * 0.8, cloud.y + cloud.height * 0.5, cloud.height * 0.4, 0, Math.PI * 2);
        menuCtx.fill();
    });
    
    // Draw pipes
    menuPipes.forEach(pipe => {
        // Top pipe
        menuCtx.fillStyle = '#73bf2e';
        menuCtx.strokeStyle = '#2d4a1e';
        menuCtx.lineWidth = 3;
        
        // Pipe body
        menuCtx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        menuCtx.strokeRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        
        // Pipe cap
        menuCtx.fillStyle = '#8cd93f';
        menuCtx.fillRect(pipe.x - 5, pipe.topHeight - 20, pipeWidth + 10, 20);
        menuCtx.strokeRect(pipe.x - 5, pipe.topHeight - 20, pipeWidth + 10, 20);
        
        // Pipe details
        menuCtx.fillStyle = '#2d4a1e';
        menuCtx.fillRect(pipe.x + 10, 10, 10, pipe.topHeight - 30);
        menuCtx.fillRect(pipe.x + pipeWidth - 20, 10, 10, pipe.topHeight - 30);
        
        // Bottom pipe
        menuCtx.fillStyle = '#73bf2e';
        menuCtx.fillRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY);
        menuCtx.strokeRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY);
        
        // Bottom pipe cap
        menuCtx.fillStyle = '#8cd93f';
        menuCtx.fillRect(pipe.x - 5, pipe.bottomY, pipeWidth + 10, 20);
        menuCtx.strokeRect(pipe.x - 5, pipe.bottomY, pipeWidth + 10, 20);
        
        // Bottom pipe details
        menuCtx.fillStyle = '#2d4a1e';
        menuCtx.fillRect(pipe.x + 10, pipe.bottomY + 30, 10, canvas.height - pipe.bottomY - 40);
        menuCtx.fillRect(pipe.x + pipeWidth - 20, pipe.bottomY + 30, 10, canvas.height - pipe.bottomY - 40);
    });
}

// Update menu background
function updateMenuBackground() {
    const currentTime = Date.now();
    
    // Create new pipes
    if (currentTime - menuLastPipeTime > menuPipeInterval) {
        createMenuPipe(canvas.width);
        menuLastPipeTime = currentTime;
    }
    
    // Update pipe positions
    menuPipes.forEach(pipe => {
        pipe.x -= menuPipeSpeed;
    });
    
    // Remove off-screen pipes
    menuPipes = menuPipes.filter(pipe => pipe.x > -pipeWidth);
    
    // Update clouds
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width;
            cloud.y = Math.random() * (canvas.height * 0.4);
        }
    });
}

// Menu background animation loop
function animateMenuBackground() {
    if (!gameStarted) {
        updateMenuBackground();
        drawMenuBackground();
        requestAnimationFrame(animateMenuBackground);
    }
}

// Start menu background animation when the page loads
window.addEventListener('load', () => {
    resizeCanvas();
    initMenuBackground();
    animateMenuBackground();
});

// Update the startGame function to stop the menu background animation
function startGame() {
    console.log('Starting game...');
    if (!speedSelected) {
        console.log('No speed selected, defaulting to normal');
        currentSpeed = 'normal';
    }
    gameStarted = true;
    menuElement.classList.add('hidden');
    scoreElement.classList.remove('hidden');
    resetGame();
} 