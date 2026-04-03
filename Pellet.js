// Pellet class represents collectible dots on the maze
class Pellet extends GameObject {
  constructor(x, y, size, isPower) {
    super(x, y, size, size);
    this.name = isPower ? 'PowerPellet' : 'Pellet';
    this.isPower = isPower;
    this.size = size;
    this.eaten = false;
    // Animation for power pellets
    this.pulseTime = 0;
  }

  update(dt) {
    if (this.isPower) {
      this.pulseTime += dt * 4;
    }
  }

  draw(ctx) {
    if (this.eaten) return;

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    if (this.isPower) {
      // Power pellet: larger, pulsing
      const pulse = 1 + Math.sin(this.pulseTime) * 0.25;
      const radius = (this.size / 2) * pulse;
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Regular pellet: small dot
      ctx.fillStyle = '#FFB8AE';
      ctx.beginPath();
      ctx.arc(cx, cy, this.size / 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
