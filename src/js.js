'use strict';

// Grafic Functions

const drawBorder = (ctx, sizes) => {
  ctx.fillStyle = 'Green';
  ctx.fillRect(0, 0, sizes.width, sizes.blockSize);
  ctx.fillRect(0, sizes.height - sizes.blockSize, sizes.width, sizes.blockSize);
  ctx.fillRect(0, 0, sizes.blockSize, sizes.height);
  ctx.fillRect(sizes.width - sizes.blockSize, 0, sizes.blockSize, sizes.height);
};

const drawScore = (ctx, sizes) => {
  ctx.font = '20px TimesNewRoman';
  ctx.fillStyle = 'Black';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Score: ' + sizes.score, sizes.blockSize, sizes.blockSize);
};

// Classes

class Block {
  constructor(collumn, row) {
    this.collumn = collumn;
    this.row = row;
  }

  // Метод, который вычисляет координаты относильно
  // декартовой системы координат.

  setCoors(sizes) {
    this.x = this.collumn * sizes.blockSize;
    this.y = this.row * sizes.blockSize;
  }

  // Рисуем квадрат, используя вычисления из прошлого метода
  drawSquare(colour, sizes, ctx) {
    this.setCoors(sizes);
    ctx.fillStyle = colour;
    ctx.fillRect(this.x, this.y, sizes.blockSize, sizes.blockSize);
  }

  // Рисуем круг, используя вычисления из прошлого метода
  drawCircle(colour, sizes, ctx) {
    this.setCoors(sizes);
    const centerX = this.x + sizes.blockSize /  2;
    const centerY = this.y + sizes.blockSize /  2;

    ctx.fillStyle = colour;

    ctx.beginPath();
    ctx.arc(centerX, centerY, sizes.blockSize / 2, 0, Math.PI * 2, false);
    ctx.fill();
  }

  // Проверяем коллизию с другими блоками
  equal(otherBlock) {
    return this.collumn === otherBlock.collumn && this.row === otherBlock.row;
  }
}

// Singletons

class Snake {

  constructor(direction, color) {
    this.direction = direction;
    this.color = color;
    this.segments = [];
  }
  // Метод, который включает блоки в змею, проверяя, нет ли колизии
  // со стеной при генерации змеи
  snakeConstruct(x, y, sizes, tail) {
    for (let i = 0; i < tail; i++) {
      if (this.wallCollision({ collumn: (x - i), row: y }, sizes) === false) {
        this.segments[i] = new Block(x - i, y, sizes);
      } else {
        break;
      }
    }
  }
  // Метод, рисующий змею по длинне массива сегментов
  snakeDraw(sizes, ctx) {
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].drawSquare(this.color, sizes, ctx);
    }
  }

  // Движение змеи
  move(ctx, sizes, apple) {

    let newHead;
    // Проверка направления
    if (this.direction === 'right') {
      newHead = new Block(this.segments[0].collumn + 1,
        this.segments[0].row);
    } else if (this.direction === 'down') {
      newHead = new Block(this.segments[0].collumn,
        this.segments[0].row + 1);
    } else if (this.direction === 'left') {
      newHead = new Block(this.segments[0].collumn - 1,
        this.segments[0].row);
    } else if (this.direction === 'up') {
      newHead = new Block(this.segments[0].collumn,
        this.segments[0].row - 1);
    }

    // Проверка коллизии головы со стеной и телом

    if (this.Collision(newHead, sizes)) {
      gameOver(ctx, sizes);
    }

    // Добавление нового блока в начало змеи

    this.addHead(sizes, apple, newHead);

  }

  // Метод, добавляющий новый блок в начало тела
  // и в зависимости от коллизии с яблоком
  // убирает или не убирает блок с конца тела
  addHead(sizes, apple, newHead) {
    this.segments.unshift(newHead);
    if (newHead.equal(apple.pos)) {
      sizes.score++;
      apple.spawn();
    } else {
      this.segments.pop();
    }
  }

  // Метод, который вызывается EE из index.html по
  // нажатию на клавиатуру, и не зависит от основого цикла
 
  setDirection(newDirection) {

    console.log(newDirection);
    if (newDirection !== undefined) {
      if (this.direction === 'up' && newDirection === 'down') {
        return;
      } else if (this.direction === 'right' && newDirection === 'left') {
        return;
      } else if (this.direction === 'left' && newDirection === 'right') {
        return;
      } else if (this.direction === 'down' && newDirection === 'up') {
        return;
      }
      this.direction = newDirection;
      console.log(this.direction);
    }
  }

  // Общая коллизия

  Collision(block, sizes) {
    return this.wallCollision(block, sizes) || this.snakeCollision(block);
  }

  // Коллизия со стеной

  wallCollision(block, sizes) {
    return (block.collumn === 0) || (block.row === 0) ||
  (block.row === sizes.height / sizes.blockSize - 1) ||
  (block.collumn === sizes.width / sizes.blockSize - 1);
  }

  // Коллизия со змеёй

  snakeCollision(block) {
    for (let i = 0; i < this.segments.length; i++) {
      if (block.equal(this.segments[i])) {
        return true;
      }
    }
  }

}

class Apple {
  constructor(x, y, sizes) {
    this.pos = new Block(x, y, sizes);
  }
  // Изменённое яблоко. Теперь используется одно и
  // то же яблоко, просто при "съедении" оно перемещается
  // а не создаёт новое
  spawn(snake, sizes, ctx) {
    while (snake.Collision(this.pos, sizes) === true) {
      this.pos.collumn = Math
        .floor(Math.random() * ((sizes.width / sizes.blockSize) - 2)) + 1;
      this.pos.row = Math
        .floor(Math.random() * ((sizes.height / sizes.blockSize) - 2)) + 1;
    }
    this.pos.setCoors(sizes);
    this.pos.drawCircle('Red', sizes, ctx);
  }

}

// Controll functions

function intervalId(snake, apple, ctx, sizes) {
  setInterval(() => {
    ctx.clearRect(0, 0, sizes.width, sizes.height);
    drawBorder(ctx, sizes);
    snake.move(ctx, sizes, apple);
    snake.snakeDraw(sizes, ctx);
    apple.spawn(snake, sizes, ctx);
    drawScore(ctx, sizes);
  }, 100);
}

function gameOver(ctx, sizes) {
  clearInterval(intervalId);
  ctx.font = '60px TimesNewRoman';
  ctx.fillStyle = 'Red';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Game Over', sizes.width / 2, sizes.height / 2);
  window.close();
}
