// 游戏设置
const DIFFICULTY = {
    beginner: { rows: 9, cols: 9, mines: 10 },
    intermediate: { rows: 16, cols: 16, mines: 40 },
    expert: { rows: 16, cols: 30, mines: 99 }
};

// 游戏状态
let gameState = {
    board: [],
    mineLocations: new Set(),
    rows: DIFFICULTY.beginner.rows,
    cols: DIFFICULTY.beginner.cols,
    mines: DIFFICULTY.beginner.mines,
    flagsPlaced: 0,
    revealedCells: 0,
    timer: 0,
    timerInterval: null,
    gameOver: false,
    firstClick: true
};

// DOM 元素
const gameBoard = document.getElementById('game-board');
const flagsCount = document.getElementById('flags-count');
const timerElement = document.getElementById('timer');
const restartBtn = document.getElementById('restart-btn');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');

// 初始化游戏
function initGame(difficulty = 'beginner') {
    // 重置游戏状态
    clearInterval(gameState.timerInterval);
    gameState = {
        board: [],
        mineLocations: new Set(),
        rows: DIFFICULTY[difficulty].rows,
        cols: DIFFICULTY[difficulty].cols,
        mines: DIFFICULTY[difficulty].mines,
        flagsPlaced: 0,
        revealedCells: 0,
        timer: 0,
        timerInterval: null,
        gameOver: false,
        firstClick: true
    };

    // 更新 DOM
    flagsCount.textContent = gameState.mines;
    timerElement.textContent = '0';
    
    // 设置游戏板的列和行
    gameBoard.style.setProperty('--cols', gameState.cols);
    gameBoard.style.setProperty('--rows', gameState.rows);
    
    // 清空游戏板
    gameBoard.innerHTML = '';
    
    // 初始化游戏板
    createBoard();
    
    // 高亮当前难度按钮
    difficultyBtns.forEach(btn => {
        if (btn.dataset.difficulty === difficulty) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 移除可能存在的游戏结束覆盖层
    const gameOverlay = document.querySelector('.game-over');
    if (gameOverlay) {
        gameOverlay.remove();
    }
}

// 创建游戏板
function createBoard() {
    gameState.board = [];
    
    // 初始化空游戏板
    for (let row = 0; row < gameState.rows; row++) {
        const rowArray = [];
        for (let col = 0; col < gameState.cols; col++) {
            rowArray.push({
                row,
                col,
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            });
            
            // 创建单元格 DOM 元素
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // 添加事件监听器
            cell.addEventListener('click', handleCellClick);
            cell.addEventListener('contextmenu', handleCellRightClick);
            
            gameBoard.appendChild(cell);
        }
        gameState.board.push(rowArray);
    }
}

// 生成地雷
function generateMines(firstClickRow, firstClickCol) {
    let minesPlaced = 0;
    gameState.mineLocations.clear();
    
    while (minesPlaced < gameState.mines) {
        const row = Math.floor(Math.random() * gameState.rows);
        const col = Math.floor(Math.random() * gameState.cols);
        
        // 确保不在首次点击的位置及其周围放置地雷
        const isSafeZone = Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1;
        const position = `${row},${col}`;
        
        if (!isSafeZone && !gameState.mineLocations.has(position)) {
            gameState.mineLocations.add(position);
            gameState.board[row][col].isMine = true;
            minesPlaced++;
        }
    }
    
    // 计算每个单元格周围的地雷数量
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (!gameState.board[row][col].isMine) {
                gameState.board[row][col].neighborMines = countNeighborMines(row, col);
            }
        }
    }
}

// 计算指定单元格周围的地雷数量
function countNeighborMines(row, col) {
    let count = 0;
    
    // 检查周围 8 个单元格
    for (let r = Math.max(0, row - 1); r <= Math.min(gameState.rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(gameState.cols - 1, col + 1); c++) {
            if (r === row && c === col) continue;
            if (gameState.board[r][c].isMine) count++;
        }
    }
    
    return count;
}

// 处理单元格点击事件
function handleCellClick(event) {
    if (gameState.gameOver) return;
    
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    const cell = gameState.board[row][col];
    
    // 如果是标记的单元格或已经揭示的单元格，不执行任何操作
    if (cell.isFlagged || cell.isRevealed) return;
    
    // 第一次点击时生成地雷并开始计时
    if (gameState.firstClick) {
        generateMines(row, col);
        startTimer();
        gameState.firstClick = false;
    }
    
    // 如果点击到地雷，游戏结束
    if (cell.isMine) {
        revealCell(row, col);
        endGame(false);
        return;
    }
    
    // 揭示点击的单元格
    revealCell(row, col);
    
    // 如果单元格周围没有地雷，自动揭示周围的单元格
    if (cell.neighborMines === 0) {
        revealNeighbors(row, col);
    }
    
    // 检查是否胜利
    checkWin();
}

// 处理单元格右键点击事件（标记）
function handleCellRightClick(event) {
    event.preventDefault();
    
    if (gameState.gameOver) return;
    
    // 如果是第一次点击，生成地雷并开始计时
    if (gameState.firstClick) {
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        generateMines(row, col);
        startTimer();
        gameState.firstClick = false;
    }
    
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    const cell = gameState.board[row][col];
    
    // 如果单元格已经揭示，不执行任何操作
    if (cell.isRevealed) return;
    
    // 切换标记状态
    cell.isFlagged = !cell.isFlagged;
    
    // 更新标记计数
    gameState.flagsPlaced += cell.isFlagged ? 1 : -1;
    flagsCount.textContent = gameState.mines - gameState.flagsPlaced;
    
    // 更新 DOM
    const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (cell.isFlagged) {
        cellElement.classList.add('flagged');
        cellElement.textContent = '🚩';
    } else {
        cellElement.classList.remove('flagged');
        cellElement.textContent = '';
    }
}

// 揭示单元格
function revealCell(row, col) {
    const cell = gameState.board[row][col];
    
    // 如果单元格已经揭示或已标记，不执行任何操作
    if (cell.isRevealed || cell.isFlagged) return;
    
    // 标记为已揭示
    cell.isRevealed = true;
    gameState.revealedCells++;
    
    // 更新 DOM
    const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    cellElement.classList.add('revealed');
    
    if (cell.isMine) {
        cellElement.classList.add('mine');
        cellElement.textContent = '💣';
    } else if (cell.neighborMines > 0) {
        cellElement.textContent = cell.neighborMines;
        cellElement.dataset.count = cell.neighborMines;
    }
}

// 揭示周围的单元格
function revealNeighbors(row, col) {
    // 检查周围 8 个单元格
    for (let r = Math.max(0, row - 1); r <= Math.min(gameState.rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(gameState.cols - 1, col + 1); c++) {
            if (r === row && c === col) continue;
            
            const neighbor = gameState.board[r][c];
            
            // 如果邻居单元格未揭示且未标记，揭示它
            if (!neighbor.isRevealed && !neighbor.isFlagged) {
                revealCell(r, c);
                
                // 如果邻居单元格周围也没有地雷，递归揭示其邻居
                if (neighbor.neighborMines === 0) {
                    revealNeighbors(r, c);
                }
            }
        }
    }
}

// 检查是否获胜
function checkWin() {
    const totalCells = gameState.rows * gameState.cols;
    const nonMineCells = totalCells - gameState.mines;
    
    if (gameState.revealedCells === nonMineCells) {
        endGame(true);
    }
}

// 结束游戏
function endGame(isWin) {
    gameState.gameOver = true;
    clearInterval(gameState.timerInterval);
    
    // 如果输了，揭示所有地雷
    if (!isWin) {
        revealAllMines();
    } else {
        // 如果赢了，标记所有地雷
        flagAllMines();
    }
    
    // 创建游戏结束覆盖层
    const gameOver = document.createElement('div');
    gameOver.classList.add('game-over');
    
    const content = document.createElement('div');
    content.classList.add('game-over-content');
    
    const title = document.createElement('h2');
    title.textContent = isWin ? '恭喜你赢了！' : '游戏结束！';
    
    const message = document.createElement('p');
    message.textContent = isWin ? 
        `你用了 ${gameState.timer} 秒完成了 ${gameState.mines} 个地雷的扫除！` : 
        '很遗憾，你踩到地雷了！';
    
    const resetButton = document.createElement('button');
    resetButton.textContent = '再来一局';
    resetButton.addEventListener('click', () => {
        gameOver.remove();
        initGame(getCurrentDifficulty());
    });
    
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(resetButton);
    gameOver.appendChild(content);
    
    document.body.appendChild(gameOver);
}

// 揭示所有地雷
function revealAllMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const cell = gameState.board[row][col];
            if (cell.isMine && !cell.isRevealed) {
                const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cellElement.classList.add('revealed');
                cellElement.textContent = '💣';
                
                // 如果错误标记了非地雷单元格
                if (cell.isFlagged && !cell.isMine) {
                    cellElement.textContent = '❌';
                }
            }
        }
    }
}

// 标记所有地雷
function flagAllMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const cell = gameState.board[row][col];
            if (cell.isMine && !cell.isFlagged) {
                cell.isFlagged = true;
                const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cellElement.classList.add('flagged');
                cellElement.textContent = '🚩';
            }
        }
    }
    
    // 更新旗帜计数
    gameState.flagsPlaced = gameState.mines;
    flagsCount.textContent = '0';
}

// 启动计时器
function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timer = 0;
    timerElement.textContent = '0';
    
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        timerElement.textContent = gameState.timer;
    }, 1000);
}

// 获取当前难度
function getCurrentDifficulty() {
    for (const btn of difficultyBtns) {
        if (btn.classList.contains('active')) {
            return btn.dataset.difficulty;
        }
    }
    return 'beginner';
}

// 事件监听器
restartBtn.addEventListener('click', () => {
    initGame(getCurrentDifficulty());
});

difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        initGame(btn.dataset.difficulty);
    });
});

// 防止右键菜单出现
gameBoard.addEventListener('contextmenu', e => {
    e.preventDefault();
    return false;
});

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    initGame('beginner');
}); 