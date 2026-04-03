// Ghost enemy that roams the maze
class Ghost extends GameObject {
  constructor(x, y, size, maze, color, name) {
    super(x, y, size, size);
    this.name = name || 'Ghost';
    this.maze = maze;
    this.size = size;
    this.color = color;

    // Grid position
    this.gridCol = 0;
    this.gridRow = 0;

    // Movement
    this.direction = { x: 0, y: 0 };
    this.speed = 150;
    this.targetX = x + size / 2;
    this.targetY = y + size / 2;

    // State
    this.frightened = false;
    this.frightenedTimer = 0;
    this.inHouse = true;
    this.houseTimer = 0;
    this.houseDelay = 0; // set externally
    this.eaten = false;

    // Animation
    this.eyeDir = 0;
    this.wobble = 0;
  }

  setGridPosition(col, row) {
    this.gridCol = col;
    this.gridRow = row;
    const pos = this.maze.gridToPixel(col, row);
    this.x = pos.x - this.size / 2;
    this.y = pos.y - this.size / 2;
    this.targetX = pos.x;
    this.targetY = pos.y;
  }

  // Make ghost frightened (when pac-man eats power pellet)
  setFrightened(duration) {
    if (!this.eaten) {
      this.frightened = true;
      this.frightenedTimer = duration;
      this.speed = 100;
      // Reverse direction
      this.direction.x *= -1;
      this.direction.y *= -1;
    }
  }

  // Choose a random valid direction (preferring not reversing)
  chooseDirection() {
    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 }
    ];

    // Filter valid directions
    const valid = dirs.filter(d => {
      const nc = this.gridCol + d.x;
      const nr = this.gridRow + d.y;
      // Can't go through walls
      if (this.maze.isWall(nc, nr)) return false;
      // Can't re-enter ghost house once out
      if (!this.inHouse && this.maze.isGhostHouse(nc, nr)) return false;
      // Prefer not reversing (unless it's the only option)
      return true;
    });

    // Filter out reverse direction if there are other options
    const nonReverse = valid.filter(d => 
      !(d.x === -this.direction.x && d.y === -this.direction.y)
    );

    const choices = nonReverse.length > 0 ? nonReverse : valid;

    if (choices.length === 0) {
      this.direction = { x: 0, y: 0 };
      return;
    }

    // Pick random direction
    const pick = choices[Math.floor(Math.random() * choices.length)];
    this.direction = pick;
  }

  update(dt) {
    this.wobble += dt * 8;

    // Frightened timer
    if (this.frightened) {
      this.frightenedTimer -= dt;
      if (this.frightenedTimer <= 0) {
        this.frightened = false;
        this.speed = 150;
      }
    }

    // Ghost house delay
    if (this.inHouse) {
      this.houseTimer += dt;
      if (this.houseTimer >= this.houseDelay) {
        this.inHouse = false;
        // Move ghost to the house exit (row 7, col 10)
        this.setGridPosition(10, 7);
        this.direction = { x: 0, y: -1 };
        const newPos = this.maze.gridToPixel(10, 6);
        this.targetX = newPos.x;
        this.targetY = newPos.y;
      }
      return;
    }

    if (this.eaten) return;

    // Move toward target
    const cx = this.x + this.size / 2;
    const cy = this.y + this.size / 2;
    const dx = this.targetX - cx;
    const dy = this.targetY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 2) {
      this.x = this.targetX - this.size / 2;
      this.y = this.targetY - this.size / 2;

      const grid = this.maze.pixelToGrid(this.targetX, this.targetY);
      this.gridCol = grid.col;
      this.gridRow = grid.row;

      // Tunnel wrapping
      if (this.gridRow === 9) {
        if (this.gridCol < 0) {
          this.gridCol = this.maze.cols - 1;
          const pos = this.maze.gridToPixel(this.gridCol, this.gridRow);
          this.x = pos.x - this.size / 2;
          this.y = pos.y - this.size / 2;
        } else if (this.gridCol >= this.maze.cols) {
          this.gridCol = 0;
          const pos = this.maze.gridToPixel(this.gridCol, this.gridRow);
          this.x = pos.x - this.size / 2;
          this.y = pos.y - this.size / 2;
        }
      }

      // Choose next direction
      this.chooseDirection();

      // Set new target
      if (this.direction.x !== 0 || this.direction.y !== 0) {
        const newCol = this.gridCol + this.direction.x;
        const newRow = this.gridRow + this.direction.y;
        const newPos = this.maze.gridToPixel(newCol, newRow);
        this.targetX = newPos.x;
        this.targetY = newPos.y;
      }
    } else {
      const moveX = (dx / dist) * this.speed * dt;
      const moveY = (dy / dist) * this.speed * dt;

      if (Math.abs(moveX) > Math.abs(dx)) {
        this.x = this.targetX - this.size / 2;
      } else {
        this.x += moveX;
      }
      if (Math.abs(moveY) > Math.abs(dy)) {
        this.y = this.targetY - this.size / 2;
      } else {
        this.y += moveY;
      }
    }
  }

  draw(ctx) {
    if (this.eaten) return;
    if (this.inHouse) {
      // Draw in-house ghost dimly
      this.drawGhostBody(ctx, 0.5);
      return;
    }
    this.drawGhostBody(ctx, 1.0);
  }

  drawGhostBody(ctx, alpha) {
    const cx = this.x + this.size / 2;
    const cy = this.y + this.size / 2;
    const r = this.size / 2 - 2;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Body color
    if (this.frightened) {
      // Flashing when about to end
      if (this.frightenedTimer < 2) {
        ctx.fillStyle = Math.floor(this.frightenedTimer * 5) % 2 === 0 ? '#2121DE' : '#FFFFFF';
      } else {
        ctx.fillStyle = '#2121DE';
      }
    } else {
      ctx.fillStyle = this.color;
    }

    // Ghost body (rounded top, wavy bottom)
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.15, r, Math.PI, 0, false);

    // Wavy bottom
    const waveCount = 3;
    const waveWidth = (r * 2) / waveCount;
    const bottomY = cy + r * 0.85;
    for (let i = 0; i < waveCount; i++) {
      const wx = cx + r - i * waveWidth;
      const waveOffset = Math.sin(this.wobble + i) * 3;
      ctx.lineTo(wx, bottomY + waveOffset);
      ctx.lineTo(wx - waveWidth / 2, bottomY - 4 + waveOffset);
    }

    ctx.closePath();
    ctx.fill();

    // Eyes
    if (!this.frightened) {
      // White of eyes
      const eyeR = r * 0.28;
      const eyeY = cy - r * 0.2;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.3, eyeY, eyeR, eyeR * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + r * 0.3, eyeY, eyeR, eyeR * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupils - look in movement direction
      const pupilR = eyeR * 0.55;
      const pox = this.direction.x * eyeR * 0.35;
      const poy = this.direction.y * eyeR * 0.35;
      ctx.fillStyle = '#21209C';
      ctx.beginPath();
      ctx.arc(cx - r * 0.3 + pox, eyeY + poy, pupilR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r * 0.3 + pox, eyeY + poy, pupilR, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Frightened face
      ctx.fillStyle = '#fff';
      const eyeY = cy - r * 0.15;
      ctx.beginPath();
      ctx.arc(cx - r * 0.3, eyeY, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r * 0.3, eyeY, r * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // Wavy mouth
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const mouthY = cy + r * 0.3;
      for (let i = 0; i <= 4; i++) {
        const mx = cx - r * 0.5 + (r * i / 4);
        const my = mouthY + (i % 2 === 0 ? 0 : 4);
        if (i === 0) ctx.moveTo(mx, my);
        else ctx.lineTo(mx, my);
      }
      ctx.stroke();
    }

    ctx.restore();
  }
}
