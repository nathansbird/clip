
const canvas = document.getElementById('canvas');
const context = canvas.getContext("2d");
const clipSound = new Audio('/static/assets/clip.wav');
let socket;
let connectionString;

let squareList = [];

connectToSocket();
function connectToSocket(){
    socket = io({
        reconnection: false,
        timeout: 2500,
    });

    document.getElementById('lowerText').innerHTML = "Connecting...";

    socket.on('connect_error', (error) => {
        document.getElementById('body').classList.remove('dead');
        document.getElementById('body').classList.add('error');
        document.getElementById('lowerText').innerHTML = "Error connecting, please try again";
        socket = null;
    });
    socket.on('connect', () => {
        document.getElementById('body').classList.remove('error');
        document.getElementById('body').classList.add('dead');
        
        document.getElementById('lowerText').innerHTML = "";
    });
    socket.on('updateSquares', (squares) => {
        if(squares != null){
            squareList = squares;
        }
    });
    socket.on('winner', (winner) => {
        document.getElementById('lowerText').innerHTML = winner+" is the winner!";
    });
    socket.on('cleanup', () => {
        cleanup();
    });
}


function updateCanvas(){
    context.clearRect(0, 0, canvas.width, canvas.height);
    resizeCanvas();
    context.fillStyle = '#fff';
    context.setLineDash([12, 8]);

    for(let i = 0; i < squareList.length; i++){
        renderSquare(squareList[i].x, squareList[i].y, squareList[i].x2, squareList[i].y2, squareList[i].upDown, squareList[i].name);
    }
}

function renderSquare(x, y, x2, y2, upDown, name){
    if(upDown == 1){
        context.beginPath();
        context.moveTo(x,y);
        context.lineTo(x2, y);
        context.lineTo(x2, y2);
        context.lineTo(x, y2);
        context.lineTo(x, y);
        context.strokeStyle = '#fff';
        context.stroke();
    }

    context.fillText(name, x2-10, y2+20);

    context.fillRect(x2 - 5, y2 - 5, 10, 10);
}

function cleanup(){
    document.getElementById('lowerText').innerHTML = "";
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

//canvas render clock
setInterval(updateCanvas, 1000/48);
