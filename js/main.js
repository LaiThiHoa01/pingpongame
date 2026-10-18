const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.height = 650;
canvas.width = 600;
let isShieldActive = false;
let shieldEndTime = 0;
let fallingItems = [];
let lastItemSpawnTime = 0;
let currentLevel = 1;
let heart = 3;
let movingBrickSpeed = 1;
let isGameOver = false;
let brickList = [];
let animationId;


const levelConfigs = {
    1: { totalRow: 3, totalCol: 5, ballSpeed: 5, brickHits: 2 },
    2: { totalRow: 3, totalCol: 5, ballSpeed: 6, brickHits: 2 },
    3: { totalRow: 4, totalCol: 5, ballSpeed: 7, brickHits: 2 },
    4: { totalRow: 3, totalCol: 5, ballSpeed: 6, brickHits: 2 },
};

// img
const brickImage = new Image();
brickImage.src = "images/brick.png";
const brickBreakImage = new Image();
brickBreakImage.src = "images/brick_break.png";
const brickStoneImage = new Image();
brickStoneImage.src = "images/stone.png";
const boomImage = new Image();
boomImage.src = "images/boom.png";
const shieldImage = new Image();
shieldImage.src = "images/shield.png";
const redHeartImage = new Image();
redHeartImage.src = "images/red_heart.png";
const whiteHeartImage = new Image();
whiteHeartImage.src = "images/white_heart.png";

// sound
const breakBrick = new Audio("sounds/break_brick.mp3");
const brickDisappear = new Audio("sounds/brick_s.mp3");
const ballPaddle = new Audio("sounds/ball_paddle.mp3");
const ballBound = new Audio("sounds/ball_bound.mp3");

function playSound(audio) {
    audio.currentTime = 0;
    audio.play();
}

const paddle = {
    width: 100,
    height: 10,
    x: canvas.width / 2 - 50,
    y: canvas.height - 10,
    speed: 15,
    isMovingLeft: false,
    isMovingRight: false,
};

const ball = {
    x: canvas.width / 2,
    y: paddle.y - 10,
    dx: 7,
    dy: -7,
    radius: 10,
};

const brickConfig = {
    offsetX: 25,
    offsetY: 25,
    margin: 25,
    width: 90,
    height: 20,
};

function loadLevel(level) {
    currentLevel = level;
    const config = levelConfigs[currentLevel];
    ball.dx = config.ballSpeed;
    ball.dy = -config.ballSpeed;
    brickList = [];
    fallingItems = [];

    for (let i = 0; i < config.totalRow; i++) {
        for (let j = 0; j < config.totalCol; j++) {
            brickList.push({
                x: brickConfig.offsetX + j * (brickConfig.width + brickConfig.margin),
                y: brickConfig.offsetY + i * (brickConfig.height + brickConfig.margin),
                isBroken: false,
                timesCollision: config.brickHits
            });
        }
    }
    if (level === 2) {
        for (let j = 0; j < config.totalCol; j += 2) {
            brickList.push({
                x: brickConfig.offsetX + j * (brickConfig.width + brickConfig.margin),
                y: brickConfig.offsetY + config.totalRow * (brickConfig.height + brickConfig.margin),
                isBroken: false,
                isUnbreakable: true
            });
        }
    }
    if (level === 3) {
        movingBrickSpeed = 2;
        const groupWidth = 3 * brickConfig.width + 2 * brickConfig.margin;
        const startX = (canvas.width - groupWidth) / 2;

        for (let j = 0; j < 3; j++) {
            brickList.push({
                x: startX + j * (brickConfig.width + brickConfig.margin),
                y: brickConfig.offsetY + config.totalRow * (brickConfig.height + brickConfig.margin),
                isBroken: false,
                isUnbreakable: true,
                isMoving: true
            });
        }
    }
    if(level === 4) {
        lastItemSpawnTime = Date.now();

        // Thêm 2 viên gạch không vỡ ở chính giữa (ngay dưới 3 hàng gạch ban đầu)
        const rowBelow = 3; // Nằm ở hàng thứ 4 (index 3)
        const centerX = canvas.width / 2;
        const spacing = 15; // Khoảng cách giữa 2 viên gạch

        // Viên gạch không vỡ 1 (Lệch sang trái)
        brickList.push({
            x: centerX - brickConfig.width - (spacing / 2),
            y: brickConfig.offsetY + rowBelow * (brickConfig.height + brickConfig.margin),
            isBroken: false,
            isUnbreakable: true // Thuộc tính làm cho gạch không thể vỡ
        });

        // Viên gạch không vỡ 2 (Lệch sang phải)
        brickList.push({
            x: centerX + (spacing / 2),
            y: brickConfig.offsetY + rowBelow * (brickConfig.height + brickConfig.margin),
            isBroken: false,
            isUnbreakable: true
        });
    }
}

function resetBallAndPaddle() {
    ball.x = canvas.width / 2;
    ball.y = paddle.y - 10;
    paddle.x = canvas.width / 2 - paddle.width / 2;
}

for (let i = 1; i <= 4; i++) {
    document.getElementById(`level_${i}`).addEventListener('click', function() {
        cancelAnimationFrame(animationId);
        heart = 3;
        loadLevel(i);
        resetBallAndPaddle();
        isGameOver = false;
        draw();
    });
}
document.addEventListener('keyup', function(event){
    if(event.key === 'ArrowRight'){
        paddle.isMovingRight = false;
    } else if(event.key === 'ArrowLeft'){
        paddle.isMovingLeft = false;
    }
});

document.addEventListener('keydown', function(event){
    if(event.key === 'ArrowRight'){
        paddle.isMovingRight = true;
    } else if(event.key === 'ArrowLeft'){
        paddle.isMovingLeft = true;
    }
});

function handelBallCollideBounds(){
    if( ball.x < ball.radius || ball.x > canvas.width - ball.radius ){
        ball.dx = -ball.dx;
        playSound(ballBound);
    }
    if( ball.y < ball.radius){
        ball.dy = -ball.dy;
        playSound(ballBound);
    }
}

function handelBallCollidePaddle(){
    if (
        ball.dy > 0 &&
        ball.x + ball.radius >= paddle.x &&
        ball.x - ball.radius <= paddle.x + paddle.width &&
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.height
    ) {
        ball.y = paddle.y - ball.radius;
        ball.dy = -ball.dy;
        playSound(ballPaddle);
    }
}

function handelBallCollideBrick(){
    brickList.forEach(function(brick){
        if(!brick.isBroken){
            if(ball.x >= brick.x && ball.x <= brick.x + brickConfig.width && ball.y + ball.radius >= brick.y && ball.y - ball.radius <= brick.y + brickConfig.height){
                ball.dy = -ball.dy;
                if (brick.isUnbreakable) {
                    playSound(ballPaddle);
                    return;
                }
                brick.timesCollision -= 1;
                if(brick.timesCollision <= 0) {
                    brick.isBroken = true;
                    playSound(brickDisappear);
                } else {
                    playSound(breakBrick);
                }
            }
        }
    });
}

function updateBallPosition(){
    ball.x += ball.dx;
    ball.y += ball.dy;
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = "gray";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.closePath();
}

function drawPaddle(){
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = isShieldActive ? '#00FFFF' : '#ffffff';
    ctx.fill();
    if (isShieldActive) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0000FF';
        ctx.stroke();
    }
    ctx.closePath();
}

function drawBricks(){
    brickList.forEach(function(brick){
        if(!brick.isBroken){
            if(brick.isUnbreakable){
                ctx.drawImage(brickStoneImage, brick.x, brick.y, brickConfig.width, brickConfig.height);
                return;
            }
            ctx.beginPath();
            const currentBrick = (brick.timesCollision === 1) ? brickBreakImage : brickImage;
            ctx.drawImage(currentBrick, brick.x, brick.y, brickConfig.width, brickConfig.height);
            ctx.closePath();
        }
    });
}

function drawHeart(){
    const heartHeight = 25;
    const heartWidth = 25;
    const spacing = 5;
    const startX = canvas.width - (3 * heartWidth) - (2 * spacing) - 10;
    const startY = 10;

    for (let i = 0; i < 3; i++) {
        const img = (i < heart) ? redHeartImage : whiteHeartImage;
        ctx.drawImage(img, startX + i * (heartWidth + spacing), startY, heartWidth, heartHeight);
    }
}
function drawShieldTimer() {
    if (!isShieldActive) return;

    const currentTime = Date.now();
    const remainingTime = shieldEndTime - currentTime;

    if (remainingTime <= 0) return;

    // Tính số giây còn lại và làm tròn lên
    const secondsLeft = Math.ceil(remainingTime / 1000);

    // Vẽ văn bản đếm ngược ở góc trên bên trái
    ctx.fillStyle = "#00FFFF"; // Màu xanh lơ cùng màu với khiên
    ctx.font = "bold 20px Arial";
    ctx.fillText("Shield: " + secondsLeft + "s", 20, 30);
}
function updatePaddlePosition(){
    if (paddle.isMovingLeft) {
        paddle.x -= paddle.speed;
    } else if (paddle.isMovingRight) {
        paddle.x += paddle.speed;
    }

    if (paddle.x < 0) {
        paddle.x = 0;
    } else if (paddle.x > canvas.width - paddle.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

function updateMovingBricks() {
    const movingBricks = brickList.filter(function(brick) {
        return brick.isMoving;
    });
    if (movingBricks.length === 0) {
        return;
    }

    const hitBoundary = movingBricks.some(function(brick) {
        const nextX = brick.x + movingBrickSpeed;
        return nextX < brickConfig.offsetX || nextX + brickConfig.width > canvas.width - brickConfig.offsetX;
    });

    if (hitBoundary) {
        movingBrickSpeed = -movingBrickSpeed;
    }

    movingBricks.forEach(function(brick) {
        brick.x += movingBrickSpeed;
    });
}

function handleFallingItems() {
    const currentTime = Date.now();

    if (currentTime - lastItemSpawnTime > 5000) {
        const randomX = Math.random() * (canvas.width - 40) + 20;
        const itemType = Math.random() < 0.5 ? 'bomb' : 'shield';

        fallingItems.push({
            x: randomX,
            y: -20,
            type: itemType,
            radius: 15,
            speed: 3
        });
        lastItemSpawnTime = currentTime;
    }

    for (let i = 0; i < fallingItems.length; i++) {
        const item = fallingItems[i];
        item.y += item.speed;

        const currentImg = item.type === 'bomb' ? boomImage : shieldImage;

        ctx.drawImage(
            currentImg,
            item.x - item.radius,
            item.y - item.radius,
            item.radius * 2,
            item.radius * 2
        );

        if (
            item.y + item.radius >= paddle.y &&
            item.y - item.radius <= paddle.y + paddle.height &&
            item.x + item.radius >= paddle.x &&
            item.x - item.radius <= paddle.x + paddle.width
        ) {
            if(item.type === 'bomb'){
                if(!isShieldActive){
                    heart -= 1;
                    if(heart <= 0) {
                        isGameOver = true;
                    }
                }
            }else if(item.type === 'shield'){
                isShieldActive = true;
                shieldEndTime = Date.now() + 10000;
            }
            fallingItems.splice(i, 1);
            i--;
        }
    }
    fallingItems = fallingItems.filter(item => item.y - item.radius < canvas.height);
}
function updateShieldStatus() {
    if (isShieldActive && Date.now() > shieldEndTime) {
        isShieldActive = false;
    }
}

function checkGameOver(){
    if(ball.y > canvas.height - ball.radius){
        if(!isShieldActive ) {
            heart -= 1;
            if(heart <= 0){
                isGameOver = true;
            } else {
                resetBallAndPaddle();
            }
        }
        else
            resetBallAndPaddle();
    }
}

function handleGameOver(){
    console.log("Game Over");
    ctx.fillStyle = "black";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", canvas.width/2 - 120, canvas.height/2);
}

function draw(){
    if(!isGameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        updateMovingBricks();
        updateShieldStatus();
        if (currentLevel === 4) {
            handleFallingItems();
        }
        drawBall();
        drawPaddle();
        drawBricks();
        drawHeart();
        drawShieldTimer();
        updatePaddlePosition();
        handelBallCollideBounds();
        handelBallCollidePaddle();
        handelBallCollideBrick();
        updateBallPosition();
        checkGameOver();


       animationId= requestAnimationFrame(draw);
    } else {
        handleGameOver();
    }
}

// Khởi chạy
loadLevel(4);
draw();

const btn = document.getElementById('levelBtn');
const content = document.getElementById('levelContent');

btn.addEventListener('click', function() {
    content.classList.toggle('show');
});

window.addEventListener('click', function(e) {
    if (!e.target.matches('.dropdown-btn')) {
        if (content.classList.contains('show')) {
            content.classList.remove('show');
        }
    }
});