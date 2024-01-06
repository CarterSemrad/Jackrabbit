renderer.addUniform("res", "vec2", [window.innerWidth, window.innerHeight]);

renderer.addUniform("camPos", "vec3", [0,5,0]);
renderer.addUniform("camPos2", "vec3", [0,5,0]);

renderer.addUniform("camAngle", "vec2", [0,0]);
renderer.addUniform("camAngle2", "vec2", [0,0]);

renderer.addUniform("t", "float", 0);

renderer.addUniform("ballPos", "vec3", [0,0,0]);

renderer.addUniform("ballAngle", "vec2", [0,0]);

renderer.addUniform("playerPos", "vec3", [0,0,0]);

renderer.addUniform("playerAngle", "vec2", [0,0]);

renderer.addUniform("playerPos2", "vec3", [0,0,0]);

renderer.addUniform("playerAngle2", "vec2", [0,0]);

renderer.addUniform("ballRotMat", "mat3", I());

renderer.draw();

let t = performance.now()/1000;
let dt = 1/120;

let scores = [0, 0];

function update(){
    try{
        dt = performance.now() / 1000 - t;
        if(dt > 1/20){
            dt = 1/120;
        }
    
        t = performance.now()/1000;

        doInputs();

        player.update();
        player2.update();

        ball.update();

        if(ball.pos[2] - 2 * ball.size > 50){
            scores[1]++;
            initPos();
        }

        if(ball.pos[2] + 2 * ball.size < -50){
            scores[0]++;
            initPos();
        }


    
        renderer.setUni("t", t);
        renderer.draw();
    
        keyPressed = [];
        mousePressed = [];
    } catch(e) {
        console.log(e);
    }
    requestAnimationFrame(update);
}

function updateScores(){
    document.getElementById("scoreboard").innerHTML = `${scores[0]} - ${scores[1]}`;
}

function initPos(){
    ball.pos = [0,20,0];
    ball.velocity = [0,0,0];
    ball.rotMat = I();
    ball.rotVel = 0;
    ball.rotAxis = [0,0,0];
    updateScores();
    player.pos = [0, 5, 15];
    player.angle = [Math.PI, 0];
    player.bodyAngle = [Math.PI, 0];

    player2.pos = [0, 5, -15];
    player2.angle = [0, 0];
    player2.bodyAngle = [0,0];
    player.velocity = [0,0,0];
    player2.velocity = [0,0,0];
}

update();