let mouseDown = [];
let mousePressed = [];
let keyDown = [];
let keyPressed = [];

onmousemove = (e) => {
    let sens = [1/900, 1/900];
    player.angle[0] += e.movementX * sens[0];
    player.angle[1] -= e.movementY * sens[1];

    if(player.angle[1] >= Math.PI/2){
        player.angle[1] = Math.PI/2;
    }
    if(player.angle[1] <= -Math.PI/2){
        player.angle[1] = -Math.PI/2;
    }
}

onmousedown = (e) => {
    mouseDown[e.button] = true;
    mousePressed[e.button] = true;
}

onmouseup = (e) => {
    mouseDown[e.button] = false;
}

onkeydown = (e) => {
    keyDown[e.key.toLowerCase()] = true;
    keyPressed[e.key.toLowerCase()] = true;
}

onkeyup = (e) => {
    keyDown[e.key.toLowerCase()] = false;
}

function Player(){
    this.pos = [0,1.5,0];

    this.camPos = [0,0,0];

    this.angle = [0,0];

    this.bodyAngle = [0,0];

    this.gravity = 50;
    this.jumpVel = 15;
    this.terminalYVel = 30;
    this.speed = 7.5;

    this.velocity = [0,0,0];
    this.jumpSpeed = 50;
    this.xFriction = 0.5;
    
    this.coyoteTime = 0.1;

    this.body2 = 0.5; //radius of body collision

    this.kickState = false;
    this.kickPos = undefined;
    this.kickPower = 50; //going to make kick more powerful w/ longer hold? idk controls but power should be a control
    
    this.update = () => {
        this.kick();
        this.jump();
        this.move();

        this.legAnimator.update();
        this.updateUniforms();
    }

    this.jump = () => {
        if(mouseDown[2] && this.coyoteTime > 0){
            this.coyoteTime = -1;
            let upOffset = [0, 0.5, 0];
            let dir = dirFromAngle(...this.angle);

            dir = normalize(plus(dir, upOffset));
            dir[0] /= 2;
            dir[2] /= 2;
            this.velocity = times(dir, this.jumpSpeed);
        }
    }

    this.kick = () => {
        let kickRange = 7;
        if(mouseDown[0] && ball.de(this.pos) < kickRange){
            this.kickState = true;
            dt /= 10;
            let dir = dirFromAngle(...this.angle);
            let p = this.camPos;
            let marchRes = march(ball.de, p, dir);
            if(marchRes){
                this.kickPos = marchRes;
            } else {
                this.kickPos = undefined;
            }

        } else if(this.kickState){
            this.kickState = false;
            if(this.kickPos != undefined){
                let upOffset = [0, -1, 0];
                let kickDir = normalize(plus(ball.pos, times(plus(this.kickPos, upOffset), -1)));
                ball.velocity = times(kickDir, this.kickPower);

                ball.rotVel = -Math.hypot(ball.velocity[0], ball.velocity[2])/ball.size;
                ball.rotAxis = (cross(normalize([ball.velocity[0], 0, ball.velocity[2]]), [0, 1, 0]));
            }
        }
    }

    this.move = () => {
        let vel = [0,0,0];

        if(keyDown["w"]){
            vel[2] += cos(this.angle[0]);
            vel[0] += sin(this.angle[0]);
        }
        if(keyDown["s"]){
            vel[2] -= cos(this.angle[0]);
            vel[0] -= sin(this.angle[0]);
        }
        if(keyDown["a"]){
            vel[2] += sin(this.angle[0]);
            vel[0] -= cos(this.angle[0]);
        }
        if(keyDown["d"]){
            vel[2] -= sin(this.angle[0]);
            vel[0] += cos(this.angle[0]);
        }

        if(len(vel) > 0){
            this.bodyAngle[0] = aLerp(this.bodyAngle[0], Math.atan2(vel[0], vel[2]), 0.1 * (dt/(1/120)));
            renderer.setUni("playerAngle", [this.bodyAngle[0], 0]);
        }

        if(!this.onGround()){
            if(this.velocity[1] > 10){
                this.legAnimator.setState(2, 0.1);
            } else {
                this.legAnimator.setState(3, 1);
            }
        } else {
            if(len(vel) > 0){
                this.legAnimator.setState(0, 0.1);
            } else {
                this.legAnimator.setState(1, 0.2);
            }
        }


        if(len(vel) == 0){
            vel = [0, 0, 0];
        } else {
            vel = times(vel, this.speed*dt/len(vel));
        }

        this.coyoteTime -= dt;

        if(this.onGround()){
            this.coyoteTime = 0.2;
            this.velocity[0] *= 0;
            this.velocity[2] *= 0;
        }

        if(keyPressed[" "] && this.coyoteTime > 0){
            this.velocity[1] = this.jumpVel;
            this.coyoteTime = -1;
        }
        
        this.velocity[1] -= this.gravity*dt;
        vel = plus(times(this.velocity, dt), vel);

        this.pos = plus(vel, this.pos);

        while(de(this.pos) < this.body2){
            let norm = deNormal(this.pos);
            this.pos = plus(this.pos, times(norm,-(de(this.pos) - this.body2)));
            this.velocity = plus(this.velocity, times(norm,-dot(this.velocity, norm)));
        }
    }

    this.onGround = () => {
        return de(plus(this.pos, [0,-this.body2,0])) < 0.1;
    }

    this.updateUniforms = () => {
        renderer.setUni("playerPos", this.pos);
        renderer.setUni("camAngle", this.angle);

        let camDir = [0, 0, -5];

        camDir = rotX(camDir, -this.angle[1]);

        camDir = rotY(camDir, this.angle[0]);

        let camPos = plus(plus(this.pos, [0,1,0]), camDir);

        let iterations = 1000;

        while(de(camPos) < 0.5 && iterations > 0){
            iterations--;
            camPos = plus(camPos, times(camDir, -0.005/5));
        }

        renderer.setUni("camPos", camPos);
        this.camPos = camPos;
    }

    this.createAnimators = () => {
        let legUnis = [
            "uhip1", "ujr1", "ujr2", "ujr3", "uhip2", "ujl1", "ujl2", "ujl3", "uHeadPos", "uChestPos", "uBodyAngle"
        ];
    
        let legUniValues = [
            [
                [.1,-.1,-.12],
                [0.15, -0.26, 0.05],
                [0.13, -0.35, -0.15],
                [0.13, -0.46, 0],
    
                [-.1,-.1,-.12],
                [-0.15, -0.26, 0.05],
                [-0.13, -0.35, -0.15],
                [-0.13, -0.46, 0],
                [0,0,0],
                [0,0,0],
                [0,0,0],
                1.2
            ],

            //left leg back
            [
                [.1,-.1,-.12],
                [0.15, -0.2, 0.15],
                [0.13, -0.35, -0.],
                [0.13, -0.46, 0.15],
    
                [-.1,-.1,-.12],
                [-0.15, -0.28, -0.05],
                [-0.13, -0.3, -0.2],
                [-0.13, -0.46, -0.15],
                [0,0,0],
                [0,0,0],
                [0,-0.4,0],
                1.2
            ],

            //left leg up
            [
                [.1,-.1,-.12],
                [0.15, -0.26, 0.05],
                [0.13, -0.35, -0.15],
                [0.13, -0.46, 0],
    
                [-.1,-.1,-.12],
                [-0.15, -0.18, 0.05],
                [-0.13, -0.25, -0.15],
                [-0.13, -0.35, 0],
                [0,0,0],
                [0,0,0],
                [0,-0.35,0],
                1.2
            ],

            //left leg front
            [
                [.1,-.1,-.12],
                [0.15, -0.28, -0.05],
                [0.13, -0.3, -0.2],
                [0.13, -0.46, -0.15],
    
                [-.1,-.1,-.12],
                [-0.15, -0.2, 0.15],
                [-0.13, -0.35, -0.],
                [-0.13, -0.46, 0.15],
                [0,0,0],
                [0,0,0],
                [0,-0.3,0],
                1.2
            ],

            //left leg down
            [
                [.1,-.1,-.12],
                [0.15, -0.18, 0.05],
                [0.13, -0.25, -0.15],
                [0.13, -0.35, 0],
    
                [-.1,-.1,-.12],
                [-0.15, -0.26, 0.05],
                [-0.13, -0.35, -0.15],
                [-0.13, -0.46, 0],
                [0,0,0],
                [0,0,0],
                [0,-0.35,0],
                1.2
            ],
             //both legs up 1
            [
                [.1,-.1,-.12],
                [0.15, -0.18, 0.05],
                [0.13, -0.25, -0.15],
                [0.13, -0.35, 0],
    
                [-.1,-.1,-.12],
                [-0.15, -0.18, 0.05],
                [-0.13, -0.25, -0.15],
                [-0.13, -0.35, 0],
                [0,0,0],
                [0,0,0],
                [0,-0.2,0],
                1.2
            ],
            //both legs up 2
            [
                [.1,-.1,-.12],
                [0.15, -0.13, 0.05],
                [0.13, -0.2, -0.15],
                [0.13, -0.3, 0],
    
                [-.1,-.1,-.12],
                [-0.15, -0.13, 0.05],
                [-0.13, -0.2, -0.15],
                [-0.13, -0.3, 0],
                [0,0,0],
                [0,0,0],
                [0,-0.2,0],
                1.2
            ]
        ];
    
        for(let i in legUnis){
            renderer.addUniform(legUnis[i], "vec3", legUniValues[0][i]);
        }
        renderer.addUniform("uLift", "float", 1.2);
    
        this.legAnimator = new Animator([...legUnis, "uLift"], sinLerp);

        //this.legAnimator.addKeyFrame(legUniValues[0], 0);
        let stepTime = 0.3;

        this.legAnimator.addKeyFrame(legUniValues[1], 0., 0);
        this.legAnimator.addKeyFrame(legUniValues[2], stepTime/4, 0);
        this.legAnimator.addKeyFrame(legUniValues[3], 2*stepTime/4, 0);
        this.legAnimator.addKeyFrame(legUniValues[4], 3*stepTime/4, 0);
        this.legAnimator.addKeyFrame(legUniValues[1], stepTime, 0);
        this.legAnimator.addKeyFrame(legUniValues[0], stepTime, 1);
        this.legAnimator.addKeyFrame(legUniValues[5], 0., 2);
        this.legAnimator.addKeyFrame(legUniValues[6], 0., 3);
        //this.legAnimator.setState(0, -1);


        //this.legAnimator.addKeyFrame(legUniValues[0], 1.2);
    }

    this.createAnimators();
}

let player = new Player();