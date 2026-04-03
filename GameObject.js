// Base class for all game entities
class GameObject {
  constructor(x, y, width, height) {
    this.name = this.constructor.name;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.active = true;
  }

  update(dt) { }
  draw(ctx) { }

  // Returns bounding box for selection system
  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}
