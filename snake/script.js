document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const finalScoreElement = document.getElementById('final-score');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const restartBtn = document.getElementById('restart-btn');
    const speedSelect = document.getElementById('speed');
    const gameOverScreen = document.getElementById('game-over');
    
    // 确保游戏结束界面在页面加载时就是隐藏的
    gameOverScreen.classList.add('hidden');
    
    // 为移动端控制按钮添加事件监听
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    
    // 游戏参数
    const gridSize = 20; // 网格大小
    const initialSpeed = 150; // 初始速度 (毫秒)
    let gameSpeed = initialSpeed; // 当前游戏速度
    
    // 游戏状态
    let snake = []; // 蛇的身体部分
    let food = {}; // 食物位置
    let direction = ''; // 当前移动方向
    let nextDirection = ''; // 下一个移动方向
    let score = 0; // 当前得分
    let highScore = localStorage.getItem('snakeHighScore') || 0; // 最高分
    let gameInterval; // 游戏循环间隔
    let isPaused = false; // 游戏是否暂停
    let isGameOver = false; // 游戏是否结束
    let gameStarted = false; // 游戏是否已开始
    
    // 更新高分显示
    highScoreElement.textContent = highScore;
    
    // 速度设置
    const speeds = {
        slow: initialSpeed,
        medium: initialSpeed * 0.7,
        fast: initialSpeed * 0.4
    };
    
    // 颜色设置
    const colors = {
        background: '#e8f5e9',
        snake: '#388e3c',
        snakeHead: '#1b5e20',
        food: '#d32f2f',
        border: '#388e3c'
    };
    
    // 初始化游戏
    function initGame() {
        // 重置游戏状态
        snake = [
            {x: 10, y: 10}, // 蛇头
            {x: 9, y: 10},  // 蛇身
            {x: 8, y: 10}   // 蛇尾
        ];
        
        direction = 'right';
        nextDirection = 'right';
        score = 0;
        scoreElement.textContent = score;
        isPaused = false;
        isGameOver = false;
        
        // 确保游戏结束界面是隐藏的
        gameOverScreen.classList.add('hidden');
        
        // 生成食物
        generateFood();
        
        // 绘制初始画面
        drawGame();
    }
    
    // 生成食物
    function generateFood() {
        // 随机生成食物位置
        const gridWidth = canvas.width / gridSize;
        const gridHeight = canvas.height / gridSize;
        
        let foodPosition;
        let isOnSnake;
        
        // 确保食物不会出现在蛇身上
        do {
            isOnSnake = false;
            foodPosition = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };
            
            // 检查食物是否与蛇身重叠
            for (let segment of snake) {
                if (segment.x === foodPosition.x && segment.y === foodPosition.y) {
                    isOnSnake = true;
                    break;
                }
            }
        } while (isOnSnake);
        
        food = foodPosition;
    }
    
    // 绘制游戏
    function drawGame() {
        // 清空画布
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制边框
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        // 绘制蛇
        snake.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? colors.snakeHead : colors.snake;
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
            
            // 绘制蛇身轮廓
            ctx.strokeStyle = '#2e7d32';
            ctx.lineWidth = 1;
            ctx.strokeRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
        });
        
        // 绘制食物
        ctx.fillStyle = colors.food;
        ctx.beginPath();
        const centerX = food.x * gridSize + gridSize / 2;
        const centerY = food.y * gridSize + gridSize / 2;
        const radius = gridSize / 2 * 0.8;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 更新游戏状态
    function updateGame() {
        if (isPaused || isGameOver) {
            return;
        }
        
        // 更新方向
        direction = nextDirection;
        
        // 获取蛇头位置
        const head = {...snake[0]};
        
        // 根据方向移动蛇头
        switch(direction) {
            case 'up': 
                head.y -= 1;
                break;
            case 'down': 
                head.y += 1;
                break;
            case 'left': 
                head.x -= 1;
                break;
            case 'right': 
                head.x += 1;
                break;
        }
        
        // 检查游戏结束条件：撞墙或自己
        const gridWidth = canvas.width / gridSize;
        const gridHeight = canvas.height / gridSize;
        
        if (
            head.x < 0 || head.x >= gridWidth || 
            head.y < 0 || head.y >= gridHeight ||
            checkCollision(head, snake.slice(1))
        ) {
            gameOver();
            return;
        }
        
        // 将新头部添加到蛇身
        snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            // 增加分数
            score += 10;
            scoreElement.textContent = score;
            
            // 更新最高分
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // 生成新食物
            generateFood();
            
            // 注意：不移除尾部，让蛇变长
        } else {
            // 如果没吃到食物，移除尾部
            snake.pop();
        }
        
        // 重新绘制游戏
        drawGame();
    }
    
    // 检查碰撞
    function checkCollision(position, bodyParts) {
        return bodyParts.some(segment => 
            segment.x === position.x && segment.y === position.y
        );
    }
    
    // 游戏结束
    function gameOver() {
        isGameOver = true;
        clearInterval(gameInterval);
        gameStarted = false;
        
        // 显示游戏结束画面
        finalScoreElement.textContent = score;
        gameOverScreen.classList.remove('hidden');
    }
    
    // 开始游戏
    function startGame() {
        if (gameStarted) return;
        
        initGame();
        gameStarted = true;
        gameOverScreen.classList.add('hidden');
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        gameSpeed = speeds[speedSelect.value];
        
        // 设置游戏循环
        gameInterval = setInterval(updateGame, gameSpeed);
    }
    
    // 暂停/继续游戏
    function togglePause() {
        if (!gameStarted) return;
        
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? '继续' : '暂停';
    }
    
    // 重新开始游戏
    function restartGame() {
        gameOverScreen.classList.add('hidden');
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        pauseBtn.textContent = '暂停';
        startGame();
    }
    
    // 改变方向
    function changeDirection(newDirection) {
        // 防止180度转弯
        if (
            (newDirection === 'up' && direction === 'down') ||
            (newDirection === 'down' && direction === 'up') ||
            (newDirection === 'left' && direction === 'right') ||
            (newDirection === 'right' && direction === 'left')
        ) {
            return;
        }
        
        nextDirection = newDirection;
    }
    
    // 键盘事件监听
    document.addEventListener('keydown', (event) => {
        if (!gameStarted || isGameOver) return;
        
        switch(event.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                changeDirection('up');
                event.preventDefault();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                changeDirection('down');
                event.preventDefault();
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                changeDirection('left');
                event.preventDefault();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                changeDirection('right');
                event.preventDefault();
                break;
            case ' ':
                // 空格键暂停/继续游戏
                togglePause();
                event.preventDefault();
                break;
        }
    });
    
    // 移动端控制
    upBtn.addEventListener('click', () => changeDirection('up'));
    downBtn.addEventListener('click', () => changeDirection('down'));
    leftBtn.addEventListener('click', () => changeDirection('left'));
    rightBtn.addEventListener('click', () => changeDirection('right'));
    
    // 按钮事件监听
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', restartGame);
    
    // 速度选择监听
    speedSelect.addEventListener('change', () => {
        if (!gameStarted) return;
        
        gameSpeed = speeds[speedSelect.value];
        clearInterval(gameInterval);
        gameInterval = setInterval(updateGame, gameSpeed);
    });
    
    // 初始状态设置
    pauseBtn.disabled = true;
    
    // 初始化游戏
    initGame();
}); 