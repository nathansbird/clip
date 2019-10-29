for(let i = 0; i < (1000/200)*(1000/200); i += 1){
    socket.emit('position', {x: i*200 % 1000, y: (i*200 - (i*200 % 1000)) / 1000 * 200, x2: (i*200 % 1000)+200, y2: ((i*200 - (i*200 % 1000)) / 1000 * 200)+200, upDown: true, name: "HXR"});
    sendClip();
}

setInterval(function(){endX = Math.random()*1000; endY = Math.random()*1000;}, 10);