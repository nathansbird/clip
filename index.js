
const canvas = document.getElementById('canvas');
const context = canvas.getContext("2d");
let socket;
let connectionString;

const maxX = 150;
const maxY = 150;

let squareList = [];

let startX;
let startY;

let upDown = 0;

let endX;
let endY;

let isAlive = true;

document.onkeypress = function(e){
    if(e.keyCode === 13){
        if(socket == null){
            connectionString = document.getElementById('inputBox').value;
            document.getElementById('inputBox').value = "";
            connectToSocket(connectionString);
        } else if(isAlive){
            socket.emit('reset');
        }
    }
}

document.onmousedown = function(e){
    if(!isAlive){return;}
    startX = e.x;
    startY = e.y;
    upDown = 1;
}

document.onmouseup = function(e){
    if(!isAlive){return;}
    upDown = 0;
    sendClip();
}

document.onmousemove = function(e){
    if(!isAlive){return;}

    endX = e.x;
    endY = e.y;

    if(endX > startX && endX - startX > maxX){
        startX = endX - maxX;
    } else if(endX < startX && startX - endX > maxX){
        startX = endX + maxX;
    }

    if(endY > startY && endY - startY > maxY){
        startY = endY - maxY;
    } else if(endY < startY && startY - endY > maxY){
        startY = endY + maxY;
    }
}

function connectToSocket(ip){
    socket = io('http://192.168.'+ip+':3000', {
        reconnection: false,
        timeout: 5000
    });

    document.getElementById('inputBox').style.display = "none";
    document.getElementById('lowerText').innerHTML = "Connecting...";

    socket.on('connect_error', (error) => {
        document.getElementById('body').classList.remove('dead');
        document.getElementById('body').classList.add('error');
        document.getElementById('inputBox').style.display = "block";
        document.getElementById('lowerText').innerHTML = "Error connecting, please try again";
        socket = null;
    });
    socket.on('connect', () => {
        document.getElementById('body').classList.remove('error');
        document.getElementById('body').classList.remove('dead');
        document.getElementById('lowerText').classList.remove('dead');
        document.getElementById('body').classList.add('success');
        
        document.getElementById('lowerText').innerHTML = connectionString;
    });
    socket.on('die', (placement) => {
        document.getElementById('lowerText').innerHTML = "You placed "+placementString(placement);
        spectate();
    });
    socket.on('win', () => {
        document.getElementById('lowerText').innerHTML = "You win!<br>Press 'Enter' to start a new game";
        spectate();
        isAlive = true;
    });
    socket.on('cleanup', () => {
        cleanup();
    });
    socket.on('updateSquares', (squares) => {
        if(squares != null){
            squareList = squares;
        }
    });
}

function placementString(number){
    let digit = number % 10;
    let suffix;
    if(digit == 1){
        suffix = "st";
    }else if(digit == 2){
        suffix = "nd";
    }else if(digit == 3){
        suffix = "rd";
    }else{
        suffix = "th";
    }

    return number+suffix;
}

function updateCanvas(){
    context.clearRect(0, 0, canvas.width, canvas.height);
    resizeCanvas();
    context.setLineDash([12, 8]);

    if(upDown == 1){
        renderSquare(startX, startY, endX, endY);
    }

    context.fillRect(endX - 5, endY - 5, 10, 10);

    for(let i = 0; i < squareList.length; i++){
        if(squareList[i].upDown == 1){
            renderSquare(squareList[i].x, squareList[i].y, squareList[i].x2, squareList[i].y2);
        }
    }
}

function renderSquare(x, y, x2, y2){
    context.beginPath();
    context.moveTo(x,y);
    context.lineTo(x2, y);
    context.lineTo(x2, y2);
    context.lineTo(x, y2);
    context.lineTo(x, y);
    context.strokeStyle = isAlive ? '#000' : '#fff';
    context.stroke();
}

function emitSquare(){
    if(socket != null){
        socket.emit('position', {x: startX, y: startY, x2: endX, y2: endY, upDown: upDown});
    }
}

function sendClip(){
    if(socket != null){
        socket.emit('clip');
    }
}

function spectate(){
    isAlive = false;
    upDown = 0;
    document.getElementById('body').classList.add('dead');
    document.getElementById('lowerText').classList.add('dead');
}

function cleanup(){
    isAlive = true;
    upDown = 0;
    document.getElementById('body').classList.remove('dead');
    document.getElementById('lowerText').classList.remove('dead');
    document.getElementById('lowerText').innerHTML = connectionString;
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

//canvas render clock
setInterval(updateCanvas, 1000/48);
setInterval(emitSquare, 1000/20);