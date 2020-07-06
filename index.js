const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cells = 5;
const width = 600;
const height = 600;
const unitLength = width / cells;

const engine = Engine.create();
//disable gravity
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height,
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);

//border walls

const walls = [
  Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }),
];

World.add(world, walls);

//Maze generation

const shuffle = (arr) => {
  let count = arr.length;

  while (count > 0) {
    const idx = Math.floor(Math.random() * count);
    count--;

    const temp = arr[count];
    arr[count] = arr[idx];
    arr[idx] = temp;
  }
  return arr;
};

const grid = Array(cells)
  .fill(null)
  .map(() => Array(cells).fill(false));

const verticals = Array(cells)
  .fill(null)
  .map(() => Array(cells - 1).fill(false));

const horizontals = Array(cells - 1)
  .fill(null)
  .map(() => Array(cells).fill(false));

const startRow = Math.floor(Math.random() * cells);
const startColumn = Math.floor(Math.random() * cells);

const stepThroughCell = (row, column) => {
  //If i have visited cell at [row,column] return
  if (grid[row][column]) return;
  //mark this cell as being visited
  grid[row][column] = true;
  //assemble randomly-ordered list neighbours
  const neighbours = shuffle([
    [row - 1, column, "up"],
    [row, column + 1, "right"],
    [row + 1, column, "down"],
    [row, column - 1, "left"],
  ]);

  //for each neighbour...
  for (let neighbour of neighbours) {
    const [nextRow, nextColumn, direction] = neighbour;
    //see if that neighbour is out of bounds
    if (
      nextRow < 0 ||
      nextRow >= cells ||
      nextColumn < 0 ||
      nextColumn >= cells
    )
      continue;

    //if we have visited that neighbour continue to next neighbour
    if (grid[nextRow][nextColumn]) continue;

    //remove a wall from either horizontal or verticals array
    switch (direction) {
      case "up":
        horizontals[row - 1][column] = true;
        break;
      case "down":
        horizontals[row][column] = true;
        break;
      case "left":
        verticals[row][column - 1] = true;
        break;
      case "right":
        verticals[row][column] = true;
        break;
      default:
        break;
    }
    //visit that next cell
    stepThroughCell(nextRow, nextColumn);
  }
};

stepThroughCell(startRow, startColumn);

//Code to generatue GUI
//horizontal walls
horizontals.forEach((row, rowIdx) => {
  row.forEach((open, colIdx) => {
    if (open) return;
    const x = colIdx * unitLength + unitLength / 2;
    const y = rowIdx * unitLength + unitLength;
    const w = unitLength;
    const h = 5;
    const wall = Bodies.rectangle(x, y, w, h, {
      isStatic: true,
      label: "wall",
    });

    World.add(world, wall);
  });
});

//vertical walls
verticals.forEach((row, rowIdx) => {
  row.forEach((open, colIdx) => {
    if (open) return;
    const x = colIdx * unitLength + unitLength;
    const y = rowIdx * unitLength + unitLength / 2;
    const h = unitLength;
    const w = 5;
    const wall = Bodies.rectangle(x, y, w, h, {
      isStatic: true,
      label: "wall",
    });

    World.add(world, wall);
  });
});

//Goal
const goal = Bodies.rectangle(
  width - unitLength / 2,
  height - unitLength / 2,
  unitLength * 0.7,
  unitLength * 0.7,
  { isStatic: true, label: "goal" }
);
World.add(world, goal);

//Ball
const ball = Bodies.circle(unitLength / 2, unitLength / 2, unitLength / 4, {
  label: "ball",
});
World.add(world, ball);

//Keyboard controls

document.addEventListener("keydown", (event) => {
  const { x, y } = ball.velocity;
  //move up ->W or UpArrow
  if (event.keyCode === 87 || event.keyCode === 38) {
    Body.setVelocity(ball, { x, y: y - 5 });
  }
  //move right->D or RightArrow
  if (event.keyCode === 68 || event.keyCode === 39) {
    Body.setVelocity(ball, { x: x + 5, y });
  }
  //move down->S or DownArrow
  if (event.keyCode === 83 || event.keyCode === 40) {
    Body.setVelocity(ball, { x, y: y + 5 });
  }
  //move left->A or LeftArrow
  if (event.keyCode === 65 || event.keyCode === 37) {
    Body.setVelocity(ball, { x: x - 5, y });
  }
});
// Win condition

Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    const labels = ["ball", "goal"];

    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      //win animation
      world.gravity.y = 1;
      world.bodies.forEach((body) => {
        if (body.label === "wall") {
          Body.setStatic(body, false);
        }
      });
    }
  });
});
