// Main Game controller - manages all entities, input, and game state
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.entities = [];
    this.scrollX = 0;
    this.scrollY = 0;
    this.lastTime = 0;

    // Game state
    this.score = 0;
    this.lives = 3;
    this.totalPellets = 0;
    this.pelletsEaten = 0;
    this.state = 'menu'; // menu, playing, gameover, win
    this.ghostEatCombo = 0;

    // Cell size for the maze
    this.cellSize = 56;

    // UI references
    this.scoreDisplay = document.getElementById('scoreDisplay');
    this.livesDisplay = document.getElementById('livesDisplay');
    this.startScreen = document.getElementById('startScreen');
    this.gameOverScreen = document.getElementById('gameOverScreen');
    this.gameOverTitle = document.getElementById('gameOverTitle');
    this.finalScoreEl = document.getElementById('finalScore');

    // Ghost references
    this.ghosts = [];
    this.pellets = [];

    this.setupInput();
    this.setupResize();
    this.resizeCanvas();
  }

  // Handle keyboard and button input
  setupInput() {
    this.keys = {};

    document.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;

      if (this.state !== 'playing') return;

      // Set pac-man direction based on arrow keys or WASD
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          this.pacman.setDirection(0, -1);
          e.preventDefault();
          break;
        case 'ArrowDown': case 's': case 'S':
          this.pacman.setDirection(0, 1);
          e.preventDefault();
          break;
        case 'ArrowLeft': case 'a': case 'A':
          this.pacman.setDirection(-1, 0);
          e.preventDefault();
          break;
        case 'ArrowRight': case 'd': case 'D':
          this.pacman.setDirection(1, 0);
          e.preventDefault();
          break;
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    // Button listeners
    document.getElementById('startBtn').addEventListener('click', () => {
      this.startGame();
    });

    document.getElementById('restartBtn').addEventListener('click', () => {
      this.startGame();
    });
  }

  // Handle canvas resizing
  setupResize() {
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    // Canvas internal resolution stays fixed; CSS handles display scaling
  }

  // Initialize/reset the game state
  reset() {
    this.entities = [];
    this.ghosts = [];
    this.pellets = [];
    this.score = 0;
    this.lives = 3;
    this.pelletsEaten = 0;
    this.totalPellets = 0;
    this.ghostEatCombo = 0;

    // Calculate offset to center the maze on canvas
    const mazeWidth = 21 * this.cellSize;
    const mazeHeight = 21 * this.cellSize;
    const offsetX = (this.canvas.width - mazeWidth) / 2;
    const offsetY = (this.canvas.height - mazeHeight) / 2 + 30;

    // Create maze
    this.maze = new Maze(offsetX, offsetY, this.cellSize);
    this.entities.push(this.maze);

    // Create pellets from maze layout
    for (let r = 0; r < this.maze.rows; r++) {
      for (let c = 0; c < this.maze.cols; c++) {
        const cell = this.maze.layout[r][c];
        if (cell === 2 || cell === 3) {
          const pos = this.maze.gridToPixel(c, r);
          const isPower = cell === 3;
          const pelletSize = isPower ? this.cellSize * 0.6 : this.cellSize * 0.4;
          const pellet = new Pellet(
            pos.x - pelletSize / 2,
            pos.y - pelletSize / 2,
            pelletSize,
            isPower
          );
          pellet.gridCol = c;
          pellet.gridRow = r;
          this.pellets.push(pellet);
          this.entities.push(pellet);
          this.totalPellets++;
        }
      }
    }

    // Create Pac-Man (start at bottom center area)
    this.pacman = new PacMan(0, 0, this.cellSize * 0.85, this.maze);
    this.pacman.setGridPosition(10, 15);
    this.entities.push(this.pacman);

    // Create ghosts with different colors
    const ghostDefs = [
      { color: '#FF0000', name: 'Blinky', col: 10, row: 9, delay: 0 },
      { color: '#FFB8FF', name: 'Pinky', col: 9, row: 9, delay: 3 },
      { color: '#00FFFF', name: 'Inky', col: 11, row: 9, delay: 6 },
      { color: '#FFB852', name: 'Clyde', col: 10, row: 10, delay: 9 }
    ];

    ghostDefs.forEach(def => {
      const ghost = new Ghost(0, 0, this.cellSize * 0.85, this.maze, def.color, def.name);
      ghost.setGridPosition(def.col, def.row);
      ghost.houseDelay = def.delay;
      this.ghosts.push(ghost);
      this.entities.push(ghost);
    });

    // Blinky starts outside the house
    this.ghosts[0].inHouse = false;
    this.ghosts[0].setGridPosition(10, 7);
    this.ghosts[0].direction = { x: -1, y: 0 };

    this.updateHUD();
  }

  // Start the game
  startGame() {
    this.startScreen.style.display = 'none';
    this.gameOverScreen.style.display = 'none';
    this.state = 'playing';
    this.reset();
  }

  // Coordinate conversion for selection system
  screenToWorld(canvasX, canvasY) {
    return { x: canvasX + this.scrollX, y: canvasY + this.scrollY };
  }

  worldToScreen(worldX, worldY) {
    return { x: worldX - this.scrollX, y: worldY - this.scrollY };
  }

  getObjectAt(canvasX, canvasY) {
    const world = this.screenToWorld(canvasX, canvasY);
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      const b = entity.getBounds();
      if (world.x >= b.x && world.x <= b.x + b.width &&
          world.y >= b.y && world.y <= b.y + b.height) {
        return entity;
      }
    }
    return null;
  }

  // Update HUD display
  updateHUD() {
    this.scoreDisplay.textContent = 'Score: ' + this.score;
    this.livesDisplay.textContent = 'Lives: ' + this.lives;
  }

  // Check if pac-man collides with a ghost
  checkGhostCollision() {
    const pcx = this.pacman.x + this.pacman.size / 2;
    const pcy = this.pacman.y + this.pacman.size / 2;
    const hitDist = this.cellSize * 0.6;

    for (const ghost of this.ghosts) {
      if (ghost.inHouse || ghost.eaten) continue;

      const gcx = ghost.x + ghost.size / 2;
      const gcy = ghost.y + ghost.size / 2;
      const dx = pcx - gcx;
      const dy = pcy - gcy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < hitDist) {
        if (ghost.frightened) {
          // Eat the ghost!
          ghost.eaten = true;
          this.ghostEatCombo++;
          this.score += 200 * this.ghostEatCombo;
          this.updateHUD();

          // Respawn ghost after a delay
          setTimeout(() => {
            ghost.eaten = false;
            ghost.frightened = false;
            ghost.speed = 150;
            ghost.setGridPosition(10, 9);
            ghost.inHouse = true;
            ghost.houseTimer = 0;
            ghost.houseDelay = 3;
          }, 3000);
        } else {
          // Pac-man dies
          this.pacmanDeath();
          return;
        }
      }
    }
  }

  // Handle pac-man death
  pacmanDeath() {
    this.pacman.alive = false;
    this.lives--;
    this.updateHUD();

    if (this.lives <= 0) {
      // Game over
      setTimeout(async () => {
        this.state = 'gameover';
        this.gameOverTitle.textContent = 'GAME OVER';
        this.gameOverTitle.style.color = '#FF4444';
        this.finalScoreEl.textContent = 'Final Score: ' + this.score;
        this.gameOverScreen.style.display = 'flex';
        if (this.score > this.playerData.highScore) {
          this.playerData.highScore = this.score;
          await SaveData.setPlayerData(this.playerData);
        }
      }, 1500);
    } else {
      // Respawn after brief delay
      setTimeout(() => {
        this.pacman.alive = true;
        this.pacman.deathTimer = 0;
        this.pacman.setGridPosition(10, 15);
        this.pacman.direction = { x: 0, y: 0 };
        this.pacman.nextDirection = { x: 0, y: 0 };

        // Reset ghost positions
        this.ghosts.forEach((ghost, i) => {
          ghost.eaten = false;
          ghost.frightened = false;
          ghost.speed = 150;
          ghost.inHouse = i > 0;
          ghost.houseTimer = 0;
          if (i === 0) {
            ghost.setGridPosition(10, 7);
            ghost.direction = { x: -1, y: 0 };
          } else {
            ghost.setGridPosition(9 + i, 9);
          }
        });
      }, 2000);
    }
  }

  // Check pellet eating
  checkPelletCollision() {
    const pcol = this.pacman.gridCol;
    const prow = this.pacman.gridRow;

    for (const pellet of this.pellets) {
      if (pellet.eaten) continue;
      if (pellet.gridCol === pcol && pellet.gridRow === prow) {
        pellet.eaten = true;
        pellet.active = false;
        this.pelletsEaten++;

        if (pellet.isPower) {
          // Power pellet: frighten all ghosts
          this.score += 50;
          this.ghostEatCombo = 0;
          this.ghosts.forEach(g => g.setFrightened(8));
        } else {
          this.score += 10;
        }

        this.updateHUD();

        // Check win
        if (this.pelletsEaten >= this.totalPellets) {
          this.state = 'win';
          this.gameOverTitle.textContent = 'YOU WIN!';
          this.gameOverTitle.style.color = '#FFD700';
          this.finalScoreEl.textContent = 'Final Score: ' + this.score;
          this.gameOverScreen.style.display = 'flex';
          if (this.score > this.playerData.highScore) {
            this.playerData.highScore = this.score;
            SaveData.setPlayerData(this.playerData);
          }
        }
      }
    }
  }

  // Main update loop
  update(dt) {
    if (this.state !== 'playing') return;

    // Update all entities
    for (const entity of this.entities) {
      entity.update(dt);
    }

    // Collision detection
    if (this.pacman.alive) {
      this.checkPelletCollision();
      this.checkGhostCollision();
    }
  }

  // Main draw loop
  draw() {
    // Clear canvas with dark background
    this.ctx.fillStyle = '#000011';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === 'menu') {
      this.drawMenuBackground();
      return;
    }

    // Draw all entities
    // Draw maze first
    this.maze.draw(this.ctx);

    // Draw pellets
    for (const pellet of this.pellets) {
      if (!pellet.eaten) pellet.draw(this.ctx);
    }

    // Draw ghosts
    for (const ghost of this.ghosts) {
      ghost.draw(this.ctx);
    }

    // Draw pac-man
    this.pacman.draw(this.ctx);

    // Draw top bar
    this.drawTopBar();
  }

  // Draw a simple animated background for the menu
  drawMenuBackground() {
    this.ctx.fillStyle = '#000011';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw some decorative dots
    const time = Date.now() / 1000;
    this.ctx.fillStyle = '#FFB8AE';
    for (let i = 0; i < 50; i++) {
      const x = ((i * 137) % this.canvas.width);
      const y = ((i * 191) % this.canvas.height);
      const alpha = 0.3 + 0.3 * Math.sin(time + i);
      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  // Draw score bar at top
  drawTopBar() {
    // Title
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAC-MAN', this.canvas.width / 2, 50);
    this.ctx.textAlign = 'left';
  }

  // Start the game loop
  async start() {
    // Load player data for leaderboard
    this.playerData = await SaveData.getPlayerData(PLAYER_DATA_DEFAULTS);
    this.updateHUD();

    const gameLoop = (timestamp) => {
      // Cap delta time to prevent huge jumps
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
      this.lastTime = timestamp;

      this.update(dt);
      this.draw();

      requestAnimationFrame(gameLoop);
    };
    requestAnimationFrame((timestamp) => {
      this.lastTime = timestamp;
      requestAnimationFrame(gameLoop);
    });
  }
}

const PLAYER_DATA_DEFAULTS = {
  highScore: 0,
  leaderboard: [
    { field: 'highScore', label: 'High Score' }
  ]
};
