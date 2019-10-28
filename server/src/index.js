
const canvas = document.getElementById('canvas');
const context = canvas.getContext("2d");
const killSound = new Audio('/static/assets/kill.wav');
const clipSound = new Audio('/static/assets/clip.wav');
const dieSound = new Audio('/static/assets/die.wav');
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

let isAlive = false;
let winner = false;
let kills = 0;

document.onkeypress = function(e){
    if(e.keyCode === 13){
        if(document.activeElement.id == "nameBox"){
            document.getElementById('inputBox').focus();
            return;
        }

        if(socket == null){
            connectionString = document.getElementById('inputBox').value;
            document.getElementById('inputBox').value = "";
            connectToSocket(connectionString);
        } else if(winner){
            socket.emit('reset');
        }
    }
}

document.onmousedown = function(e){
    if(!isAlive && !winner){return;}
    startX = e.x;
    startY = e.y;
    upDown = 1;
}

document.onmouseup = function(e){
    if(!isAlive && !winner){return;}
    upDown = 0;
    sendClip();
}

document.onmousemove = function(e){
    if(e.x > startX && e.x - startX > maxX){
        startX = e.x - maxX;
    } else if(e.x < startX && startX - e.x > maxX){
        startX = e.x + maxX;
    }

    if(e.y > startY && e.y - startY > maxY){
        startY = e.y - maxY;
    } else if(e.y < startY && startY - e.y > maxY){
        startY = e.y + maxY;
    }

    endX = e.x;
    endY = e.y;
}

function connectToSocket(room){
    socket = io('http://192.168.'+room, {
        reconnection: false,
        timeout: 2500
    });

    document.getElementById('lowerText').innerHTML = "Connecting...";

    socket.on('connect_error', (error) => {
        document.getElementById('body').classList.remove('dead');
        document.getElementById('body').classList.add('error');
        document.getElementById('lowerText').innerHTML = "Error connecting, please try again";
        socket = null;
    });
    socket.on('disconnect', () => {
        document.getElementById('body').classList.remove('dead');
        document.getElementById('body').classList.remove('success');
        document.getElementById('body').classList.add('error');
        document.getElementById('lowerText').innerHTML = "Error connecting, please try again";
        socket = null;
        window.open("https://www.multisoftvirtualacademy.com/blog/differentiating-between-ethical-and-unethical-hacking/");
    })
    socket.on('connect', () => {
        document.getElementById('body').classList.remove('error');
        document.getElementById('body').classList.remove('dead');
        document.getElementById('body').classList.add('success');
        isAlive = true;
        
        document.getElementById('lowerText').innerHTML = connectionString;
    });
    socket.on('die', (clipped) => {
        document.getElementById('lowerText').innerHTML = "Clipped By: "+clipped;
        dieSound.play();
        spectate();
    });
    socket.on('win', () => {
        document.getElementById('lowerText').innerHTML = "You win!<br>Press 'Enter' to start a new game";
        spectate();
        winner = true;
    });
    socket.on('cleanup', () => {
        cleanup();
    });
    socket.on('kill', () => {
        killSound.play();
        kills++;
    });
    socket.on('updateSquares', (squares) => {
        if(squares != null){
            squareList = squares;
        }
    });
}

function updateCanvas(){
    context.clearRect(0, 0, canvas.width, canvas.height);
    resizeCanvas()
    context.fillStyle = isAlive ? '#000' : '#fff';
    context.setLineDash([12, 8]);

    if(upDown == 1){
        context.strokeStyle = isAlive ? '#000' : '#fff';
        renderSquare(startX, startY, endX, endY, 1);
    }

    if(isAlive || socket == null || winner){
        context.fillRect(endX - 5, endY - 5, 10, 10);
    }

    document.getElementById('remainingB').innerHTML = squareList.length+" Remaining";
    document.getElementById('remainingW').innerHTML = squareList.length+" Remaining";

    document.getElementById('clipsB').innerHTML = kills+" Clips";
    document.getElementById('clipsW').innerHTML = kills+" Clips";

    for(let i = 0; i < squareList.length; i++){
        context.strokeStyle = '#F00';
        renderSquare(squareList[i].x, squareList[i].y, squareList[i].x2, squareList[i].y2, squareList[i].upDown);
    }
}

function renderSquare(x, y, x2, y2, upDown){
    if(upDown == 1){
        context.beginPath();
        context.moveTo(x,y);
        context.lineTo(x2, y);
        context.lineTo(x2, y2);
        context.lineTo(x, y2);
        context.lineTo(x, y);
        context.stroke();
    }

    if(!isAlive){
        context.strokeStyle = isAlive ? '#000' : '#fff';
        context.fillRect(x2 - 5, y2 - 5, 10, 10);
    }
}

function emitSquare(){
    if(socket != null){
        let name = document.getElementById('nameBox').value;
        socket.emit('position', {x: startX, y: startY, x2: endX, y2: endY, upDown: upDown, name: name});
    }
}

function sendClip(){
    if(socket != null){
        clipSound.play();
        socket.emit('clip');
    }
}

function spectate(){
    isAlive = false;
    upDown = 0;
    document.getElementById('body').classList.add('dead');
}

function cleanup(){
    isAlive = true;
    upDown = 0;
    winner = false;
    document.getElementById('body').classList.remove('dead');
    document.getElementById('lowerText').innerHTML = connectionString;
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

//canvas render clock
setInterval(updateCanvas, 1000/48);
setInterval(emitSquare, 1000/20);