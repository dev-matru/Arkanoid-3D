function playGame() {
    
    closeNav();
    document.getElementById("mainArea").style.display = "none";
    document.getElementById("legend").style.display = "block";
    document.getElementById("score").style.display = "block";
    buildArena();
    main();

}

function setDifficulty(value){
    game.mode = value;
}

function openNav() {
    document.getElementById("mySidenav").style.width = "400px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}
 
function setRowsNumber(value) {
    arena.numOfRows = value;
}

function setColumnsNumber(value) {
    arena.numOfColumns = value;
}

function keyFunction(e){

    switch(e.keyCode) {
        case 38:
            camera.elevation+=2.0;
            break;
        case 40:
            camera.elevation-=2.0;
            break;
        case 37:
            camera.angle-=2.0;
            break;
        case 39:
            camera.angle+=2.0;
            break;
        case 81:
            camera.cy-=.25;
            break;
        case 69:
            camera.cy+=.25;
            break;
        case 65:
            camera.cx-=.25;
            break;
        case 68:
            camera.cx+=.25;
            break;
        case 87:
            camera.cz-=.25;
            break;
        case 83:
            camera.cz+=.25;
            break;
    }
} 

var ratio = 2.0;

function doMouseMove(event) {

    normX = (2 * event.pageX / gl.canvas.width) - 1;
    x = (normX * ratio) * arena.width/2 + arena.width/2;

    if(x > 0 + paddle.width/2 && x < arena.width - paddle.width/2)
    setPaddle(x); 
}

function doMouseWheel(event) {

    amount = event.wheelDelta / 100.0;

    if(perspective.fieldOfViewDeg - amount < 180 && perspective.fieldOfViewDeg - amount > 0)
    perspective.fieldOfViewDeg -= amount;

} 

function launchBall() {

    if(game.status == 'end')
        window.location.reload();
    else game.status = 'play';

}

function updateScore(){
    game.score++;
    document.getElementById("score").innerText = "SCORE: " + game.score + "/" + game.maxScore;
}

function setPaddle(amount){
    paddle.x = amount;
}

function playSound(path, volume) {
    var audio = new Audio(path);
    audio.volume = volume;
    audio.play();
}

function breakObject(object) {
    if('broken' in object) {
        object.broken = true;
        playSound('assets/break.wav', 0.2);
        updateScore();
    } //else playSound('assets/bounce.wav', 0.2);
}

function randomBallAngle() {
    if (Math.random() > 0.5)
        return Math.random() * 30 + 50;
    else    
        return Math.random() * 30 + 100;
}

function moveBall() {
    ball.x = ball.x + ball.speed * Math.cos(utils.degToRad(ball.angle));
    ball.y = ball.y + ball.speed * Math.sin(utils.degToRad(ball.angle));
}

function changeBallDirection(bounceDirection) {

    if (bounceDirection == 'vertical')
        //Bounce on a vertical surface
        ball.angle = 180.0 - ball.angle;

    else if (bounceDirection == 'horizontal')
        //Bounce on an horizontal surface
        ball.angle = 360.0 - ball.angle;

}

function between(x, base, range) {
    return (x >= base - range) && (x <= base + range);
}

function detectCollision(object){
    
    const epsilon = 0.1;

    ball.points.every(point => {  

        if(between(ball.x + point.x, object.x, object.width/2) &&
            (between(ball.y + point.y, object.y + object.height/2, epsilon) || between(ball.y + point.y, object.y - object.height/2, epsilon))) {
            changeBallDirection('horizontal');
            breakObject(object);
            return false;
        }
        
        if(between(ball.y + point.y, object.y, object.height/2) &&
            (between(ball.x + point.x, object.x + object.width/2, epsilon)|| between(ball.x + point.x, object.x - object.width/2, epsilon))) {
            changeBallDirection('vertical');
            breakObject(object);
            return false;
        }
    });

}

function iteration(){

    if(game.status == 'play'){
        
        //Check all possible collisions
        detectCollision(paddle);

        for (const [key, value] of Object.entries(walls)) {
            detectCollision(value); 
        }

        blocks.filter(block => block.broken == false).forEach(block => {
            detectCollision(block);    
        });

        moveBall();
        
        if(ball.y < -3)
            gameOver();
        
        if(game.score == game.maxScore)
            winGame();

    } else if (game.status == 'start') {

        ball.x = paddle.x - arena.wallSize;
    } 
}

function gameOver() {
    playSound('assets/death.wav', 0.2);
    document.getElementById("result").innerText = "GAME OVER";
    game.status = 'end';
}

function winGame() {
    playSound('assets/win.wav', 0.2);
    document.getElementById("result").innerText = "VICTORY";
    game.status = 'end';
}

