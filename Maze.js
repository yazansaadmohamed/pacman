// Maze class handles the grid layout, wall rendering, and collision checks
class Maze extends GameObject {
  constructor(offsetX, offsetY, cellSize) {
    // The maze layout: 0=empty, 1=wall, 2=pellet, 3=power pellet, 4=ghost house
    // 21 columns x 23 rows classic-inspired layout
    const layout = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
      [1,3,1,1,2,1,1,1,2,2,1,2,2,1,1,1,2,1,1,3,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,1,2,1],
      [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
      [1,1,1,1,2,1,1,1,0,0,1,0,0,1,1,1,2,1,1,1,1],
      [0,0,0,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,0,0,0],
      [1,1,1,1,2,1,0,1,1,4,4,4,1,1,0,1,2,1,1,1,1],
      [0,0,0,0,2,0,0,1,4,4,4,4,4,1,0,0,2,0,0,0,0],
      [1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
      [0,0,0,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,0,0,0],
      [1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,2,1,1,1,2,2,1,2,2,1,1,1,2,1,1,2,1],
      [1,3,2,1,2,2,2,2,2,2,0,2,2,2,2,2,2,1,2,3,1],
      [1,1,2,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,2,1,1],
      [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
      [1,2,1,1,1,1,1,1,2,2,1,2,2,1,1,1,1,1,1,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    const cols = layout[0].length;
    const rows = layout.length;

    super(offsetX, offsetY, cols * cellSize, rows * cellSize);
    this.name = 'Maze';
    this.layout = layout;
    this.cellSize = cellSize;
    this.cols = cols;
    this.rows = rows;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  // Check if a given grid cell is a wall
  isWall(col, row) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      // Wrap around for tunnel
      if (row === 9 && (col < 0 || col >= this.cols)) return false;
      return true;
    }
    return this.layout[row][col] === 1;
  }

  // Check if cell is ghost house
  isGhostHouse(col, row) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return false;
    return this.layout[row][col] === 4;
  }

  // Convert pixel to grid coordinates
  pixelToGrid(px, py) {
    return {
      col: Math.floor((px - this.offsetX) / this.cellSize),
      row: Math.floor((py - this.offsetY) / this.cellSize)
    };
  }

  // Convert grid to pixel (center of cell)
  gridToPixel(col, row) {
    return {
      x: this.offsetX + col * this.cellSize + this.cellSize / 2,
      y: this.offsetY + row * this.cellSize + this.cellSize / 2
    };
  }

  // Draw the maze walls
  draw(ctx) {
    const cs = this.cellSize;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.layout[r][c];
        const px = this.offsetX + c * cs;
        const py = this.offsetY + r * cs;

        if (cell === 1) {
          // Draw wall with a blue style
          ctx.fillStyle = '#1a1a6e';
          ctx.fillRect(px, py, cs, cs);

          // Draw wall border for depth
          ctx.strokeStyle = '#3333cc';
          ctx.lineWidth = 2;

          // Check neighbors to draw inner borders
          const top = r > 0 && this.layout[r-1][c] !== 1;
          const bottom = r < this.rows-1 && this.layout[r+1][c] !== 1;
          const left = c > 0 && this.layout[r][c-1] !== 1;
          const right = c < this.cols-1 && this.layout[r][c+1] !== 1;

          if (top) { ctx.beginPath(); ctx.moveTo(px, py+1); ctx.lineTo(px+cs, py+1); ctx.stroke(); }
          if (bottom) { ctx.beginPath(); ctx.moveTo(px, py+cs-1); ctx.lineTo(px+cs, py+cs-1); ctx.stroke(); }
          if (left) { ctx.beginPath(); ctx.moveTo(px+1, py); ctx.lineTo(px+1, py+cs); ctx.stroke(); }
          if (right) { ctx.beginPath(); ctx.moveTo(px+cs-1, py); ctx.lineTo(px+cs-1, py+cs); ctx.stroke(); }
        } else if (cell === 4) {
          // Ghost house - slightly different background
          ctx.fillStyle = '#0a0a2e';
          ctx.fillRect(px, py, cs, cs);
        }
      }
    }
  }

  update(dt) { }
}
