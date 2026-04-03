// PacMan player character - yellow circle with animated mouth
class PacMan extends GameObject {
  constructor(x, y, size, maze) {
    super(x, y, size, size);
    this.name = 'PacMan';
    this.maze = maze;
    this.size = size;

    // Grid position
    this.gridCol = 0;
    this.gridRow = 0;

    // Movement
    this.direction = { x: 0, y: 0 };    // Current movement direction
    this.nextDirection = { x: 0, y: 0 }; // Buffered input direction
    this.speed = 220; // pixels per second
    this.moving = false;

    // Target position (center of the cell we're moving toward)
    this.targetX = x + size / 2;
    this.targetY = y + size / 2;

    // Animation
    this.mouthAngle = 0;
    this.mouthSpeed = 10;
    this.mouthOpen = true;
    this.facingAngle = 0; // radians, for rendering direction

    // State
    this.alive = true;
    this.deathTimer = 0;
  }

  // Set starting grid position
  setGridPosition(col, row) {
    this.gridCol = col;
    this.gridRow = row;
    const pos = this.maze.gridToPixel(col, row);
    this.x = pos.x - this.size / 2;
    this.y = pos.y - this.size / 2;
    this.targetX = pos.x;
    this.targetY = pos.y;
  }

  // Buffer the next direction from input
  setDirection(dx, dy) {
    this.nextDirection = { x: dx, y: dy };
  }

  // Check if pac-man can move in a given direction from a grid cell
  canMove(col, row, dx, dy) {
    const newCol = col + dx;
    const newRow = row + dy;
    // Allow tunnel wrapping on row 9
    if (newRow === 9 && (newCol < 0 || newCol >= this.maze.cols)) return true;
    return !this.maze.isWall(newCol, newRow) && !this.maze.isGhostHouse(newCol, newRow);
  }

  update(dt) {
    if (!this.alive) {
      this.deathTimer += dt;
      return;
    }

    // Animate mouth
    if (this.mouthOpen) {
      this.mouthAngle += this.mouthSpeed * dt;
      if (this.mouthAngle >= 0.4) this.mouthOpen = false;
    } else {
      this.mouthAngle -= this.mouthSpeed * dt;
      if (this.mouthAngle <= 0.02) this.mouthOpen = true;
    }
    this.mouthAngle = Math.max(0.02, Math.min(0.4, this.mouthAngle));

    // Calculate center position
    const cx = this.x + this.size / 2;
    const cy = this.y + this.size / 2;

    // Determine distance to current target cell center
    const dx = this.targetX - cx;
    const dy = this.targetY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If close enough to target, snap and decide next cell
    if (dist < 2) {
      // Snap to target
      this.x = this.targetX - this.size / 2;
      this.y = this.targetY - this.size / 2;

      // Update grid position
      const grid = this.maze.pixelToGrid(this.targetX, this.targetY);
      this.gridCol = grid.col;
      this.gridRow = grid.row;

      // Handle tunnel wrapping
      if (this.gridRow === 9) {
        if (this.gridCol < 0) {
          this.gridCol = this.maze.cols - 1;
          const pos = this.maze.gridToPixel(this.gridCol, this.gridRow);
          this.x = pos.x - this.size / 2;
          this.y = pos.y - this.size / 2;
          this.targetX = pos.x;
          this.targetY = pos.y;
        } else if (this.gridCol >= this.maze.cols) {
          this.gridCol = 0;
          const pos = this.maze.gridToPixel(this.gridCol, this.gridRow);
          this.x = pos.x - this.size / 2;
          this.y = pos.y - this.size / 2;
          this.targetX = pos.x;
          this.targetY = pos.y;
        }
      }

      // Try buffered direction first
      if (this.nextDirection.x !== 0 || this.nextDirection.y !== 0) {
        if (this.canMove(this.gridCol, this.gridRow, this.nextDirection.x, this.nextDirection.y)) {
          this.direction = { ...this.nextDirection };
        }
      }

      // Try to continue in current direction
      if (this.canMove(this.gridCol, this.gridRow, this.direction.x, this.direction.y)) {
        const newCol = this.gridCol + this.direction.x;
        const newRow = this.gridRow + this.direction.y;
        const newPos = this.maze.gridToPixel(newCol, newRow);
        this.targetX = newPos.x;
        this.targetY = newPos.y;
        this.moving = true;
      } else {
        this.moving = false;
        this.direction = { x: 0, y: 0 };
      }
    } else {
      // Move toward target
      const moveX = (dx / dist) * this.speed * dt;
      const moveY = (dy / dist) * this.speed * dt;

      // Don't overshoot
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

    // Update facing angle for rendering
    if (this.direction.x === 1) this.facingAngle = 0;
    else if (this.direction.x === -1) this.facingAngle = Math.PI;
    else if (this.direction.y === -1) this.facingAngle = -Math.PI / 2;
    else if (this.direction.y === 1) this.facingAngle = Math.PI / 2;
  }

  draw(ctx) {
    const cx = this.x + this.size / 2;
    const cy = this.y + this.size / 2;
    const radius = this.size / 2 - 2;

    if (!this.alive) {
      // Death animation: pac-man shrinks
      const t = Math.min(this.deathTimer / 1.0, 1);
      const startAngle = this.facingAngle + t * Math.PI;
      const endAngle = this.facingAngle + Math.PI * 2 - t * Math.PI;
      if (startAngle < endAngle) {
        ctx.fillStyle = '#FFE000';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius * (1 - t * 0.3), startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
      }
      return;
    }

    // Draw pac-man with mouth
    const mouth = this.mouthAngle * Math.PI;
    ctx.fillStyle = '#FFE000';
    ctx.shadowColor = '#FFE000';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, this.facingAngle + mouth, this.facingAngle + Math.PI * 2 - mouth);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Eye
    const eyeOffsetX = Math.cos(this.facingAngle - 0.5) * radius * 0.4;
    const eyeOffsetY = Math.sin(this.facingAngle - 0.5) * radius * 0.4;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(cx + eyeOffsetX, cy + eyeOffsetY, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
}
