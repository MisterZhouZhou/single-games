// 游戏常量
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    'transparent', // 空白区域
    '#FF0D72', // I
    '#0DC2FF', // J
    '#0DFF72', // L
    '#F538FF', // O
    '#FF8E0D', // S
    '#FFE138', // T
    '#3877FF'  // Z
];

// 方块形状定义，每个方块由一个 4x4 数组表示
const SHAPES = [
    [], // 空白
    // I 方块
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // J 方块
    [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ],
    // L 方块
    [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ],
    // O 方块
    [
        [4, 4],
        [4, 4]
    ],
    // S 方块
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    // T 方块
    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    // Z 方块
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
];

// 游戏状态
let gameOver = false;
let paused = false;
let score = 0;
let level = 1;
let lines = 0;
let dropCounter = 0;
let dropInterval = 1000; // 开始每秒下落一格
let lastTime = 0;
let requestId = null;

// 画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

// 设置画布大小
ctx.canvas.width = COLS * BLOCK_SIZE;
ctx.canvas.height = ROWS * BLOCK_SIZE;
ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

// 游戏面板和当前方块
let board = createBoard();
let piece = null;
let nextPiece = null;

// 元素
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');

// 创建游戏面板
function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// 获取随机方块
function getRandomPiece() {
    const pieceType = Math.floor(Math.random() * 7) + 1; // 1-7
    const shape = SHAPES[pieceType];
    return {
        position: { x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 },
        shape: shape,
        type: pieceType
    };
}

// 绘制单个方块
function drawBlock(x, y, colorIndex, contextParam = null) {
    const context = contextParam || ctx;
    context.fillStyle = COLORS[colorIndex];
    context.fillRect(x, y, 1, 1);
    
    if (colorIndex > 0) {
        context.strokeStyle = '#000';
        context.lineWidth = 0.05;
        context.strokeRect(x, y, 1, 1);
        
        // 亮边
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + 1, y);
        context.lineTo(x + 1, y + 1);
        context.lineTo(x, y + 1);
        context.lineTo(x, y);
        context.fill();
    }
}

// 绘制当前方块
function drawPiece() {
    if (!piece) return;
    
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawBlock(piece.position.x + x, piece.position.y + y, piece.type);
            }
        });
    });
}

// 绘制下一个方块
function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextCtx.save();
    nextCtx.scale(BLOCK_SIZE / 2, BLOCK_SIZE / 2);
    
    if (nextPiece) {
        const offsetX = 2;
        const offsetY = 2;
        
        nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    drawBlock(offsetX + x, offsetY + y, nextPiece.type, nextCtx);
                }
            });
        });
    }
    
    nextCtx.restore();
}

// 绘制游戏面板
function drawBoard() {
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            drawBlock(x, y, value);
        });
    });
}

// 绘制网格线
function drawGrid() {
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.02;
    
    // 竖线
    for (let i = 1; i < COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, ROWS);
        ctx.stroke();
    }
    
    // 横线
    for (let i = 1; i < ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(COLS, i);
        ctx.stroke();
    }
}

// 绘制游戏
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawGrid();
    drawPiece();
    drawNextPiece();
}

// 碰撞检测
function collide() {
    if (!piece) return false;
    
    const shape = piece.shape;
    const pos = piece.position;
    
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] !== 0 &&
                (board[y + pos.y] === undefined || 
                 board[y + pos.y][x + pos.x] === undefined ||
                 board[y + pos.y][x + pos.x] !== 0)) {
                return true;
            }
        }
    }
    
    return false;
}

// 将方块固定到面板上
function merge() {
    if (!piece) return;
    
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + piece.position.y][x + piece.position.x] = value;
            }
        });
    });
}

// 旋转方块
function rotate() {
    if (!piece) return;
    
    // 创建旋转后的新方块形状（顺时针旋转90度）
    const newShape = [];
    for (let i = 0; i < piece.shape[0].length; i++) {
        newShape.push([]);
        for (let j = piece.shape.length - 1; j >= 0; j--) {
            newShape[i].push(piece.shape[j][i]);
        }
    }
    
    // 保存原来的形状，以便在碰撞时恢复
    const originalShape = piece.shape;
    
    // 应用新的形状
    piece.shape = newShape;
    
    // 如果旋转后发生碰撞，尝试调整位置
    if (collide()) {
        // 尝试左移
        piece.position.x--;
        if (collide()) {
            // 尝试右移
            piece.position.x += 2;
            if (collide()) {
                // 尝试上移
                piece.position.x -= 2;
                piece.position.y--;
                if (collide()) {
                    // 如果仍然碰撞，恢复原来的形状
                    piece.position.y++;
                    piece.shape = originalShape;
                }
            }
        }
    }
}

// 向左移动
function moveLeft() {
    if (gameOver || paused) return;
    piece.position.x--;
    if (collide()) {
        piece.position.x++;
    }
}

// 向右移动
function moveRight() {
    if (gameOver || paused) return;
    piece.position.x++;
    if (collide()) {
        piece.position.x--;
    }
}

// 向下移动
function moveDown() {
    if (gameOver || paused) return;
    piece.position.y++;
    if (collide()) {
        piece.position.y--;
        merge();
        checkLines();
        resetPiece();
        
        // 检查游戏是否结束
        if (collide()) {
            gameOver = true;
            cancelAnimationFrame(requestId);
            requestId = null;
        }
    }
    dropCounter = 0;
}

// 立即落到底部
function hardDrop() {
    if (gameOver || paused) return;
    
    while (!collide()) {
        piece.position.y++;
    }
    
    piece.position.y--;
    merge();
    checkLines();
    resetPiece();
    
    // 检查游戏是否结束
    if (collide()) {
        gameOver = true;
        cancelAnimationFrame(requestId);
        requestId = null;
    }
    
    dropCounter = 0;
}

// 检查并清除完整的行
function checkLines() {
    let linesCleared = 0;
    
    outer: for (let y = board.length - 1; y >= 0; y--) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        
        // 移除完整的行
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        y++; // 重新检查当前行，因为现在有一个新行在这个位置
        
        linesCleared++;
    }
    
    if (linesCleared > 0) {
        // 更新分数和行数
        lines += linesCleared;
        
        // 计算分数 (原始俄罗斯方块记分系统)
        const points = [0, 40, 100, 300, 1200]; // 0, 1, 2, 3, 4行的分数
        score += points[linesCleared] * level;
        
        // 更新等级 (每10行升一级)
        level = Math.floor(lines / 10) + 1;
        
        // 更新下落速度
        dropInterval = 1000 * Math.pow(0.8 - ((level - 1) * 0.007), level - 1);
        
        // 更新显示
        scoreElement.textContent = score;
        levelElement.textContent = level;
        linesElement.textContent = lines;
    }
}

// 重置当前方块
function resetPiece() {
    // 使用下一个方块
    piece = nextPiece || getRandomPiece();
    nextPiece = getRandomPiece();
}

// 游戏主循环
function update(time = 0) {
    if (gameOver || paused) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        moveDown();
    }
    
    draw();
    requestId = requestAnimationFrame(update);
}

// 开始游戏
function startGame() {
    if (requestId) {
        cancelAnimationFrame(requestId);
    }
    
    // 重置游戏状态
    board = createBoard();
    score = 0;
    lines = 0;
    level = 1;
    gameOver = false;
    paused = false;
    dropCounter = 0;
    dropInterval = 1000;
    
    // 更新显示
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
    
    // 创建初始方块
    piece = getRandomPiece();
    nextPiece = getRandomPiece();
    
    pauseBtn.textContent = '暂停';
    startBtn.textContent = '重新开始';
    
    // 开始游戏循环
    lastTime = performance.now();
    update();
}

// 暂停/继续游戏
function togglePause() {
    if (gameOver) return;
    
    paused = !paused;
    
    if (paused) {
        cancelAnimationFrame(requestId);
        requestId = null;
        pauseBtn.textContent = '继续';
        
        // 在画布上显示暂停文字
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, COLS, ROWS);
        
        ctx.font = '1px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('已暂停', COLS / 2, ROWS / 2);
    } else {
        pauseBtn.textContent = '暂停';
        lastTime = performance.now();
        requestId = requestAnimationFrame(update);
    }
}

// 键盘事件监听
document.addEventListener('keydown', event => {
    if (gameOver) return;
    
    switch (event.keyCode) {
        case 37: // 左箭头
            moveLeft();
            break;
        case 39: // 右箭头
            moveRight();
            break;
        case 40: // 下箭头
            moveDown();
            break;
        case 38: // 上箭头
            rotate();
            break;
        case 32: // 空格
            hardDrop();
            break;
        case 80: // P键
            togglePause();
            break;
    }
});

// 按钮事件监听
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);

// 初始绘制
draw(); 