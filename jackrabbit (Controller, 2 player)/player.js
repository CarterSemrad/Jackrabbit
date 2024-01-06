let mouseDown = [];
let mousePressed = [];
let keyDown = [];
let keyPressed = [];
/*
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
*/
let p1LeftStick = [0, 0];
let p2LeftStick = [0, 0];
let p1RTrigger = false;
let p1LTrigger = false;

let p2RTrigger = false;
let p2LTrigger = false;

function doInputs(){
    let gamepads = navigator.getGamepads();

    let pads = [];
    for(let i of gamepads){
        if(i){
            pads.push(i);
        }
    }

    let sens = [0.04, 0.04];

    //player 1
    if(Math.hypot(pads[0].axes[2],pads[0].axes[3]) >= .1){
        player.angle[0] += sens[0] * pads[0].axes[2] * dt/(1/70);
        player.angle[1] += sens[1] * -pads[0].axes[3] * dt/(1/70);
    }

    if(player.angle[1] >= Math.PI/2){
        player.angle[1] = Math.PI/2;
    }
    if(player.angle[1] <= -Math.PI/2){
        player.angle[1] = -Math.PI/2;
    }

    p1LeftStick = [pads[0].axes[0], -pads[0].axes[1]];

    if(Math.hypot(pads[0].axes[0], pads[0].axes[1]) <= 0.1){
        p1LeftStick = [0,0];
    }

    if(pads[0].buttons[6].value > 0.5){
        p1LTrigger = true;
    } else {
        p1LTrigger = false;
    }

    if(pads[0].buttons[7].value > 0.5){
        p1RTrigger = true;
    } else {
        p1RTrigger = false;
    }

    //player 2

    if(Math.hypot(pads[1].axes[2],pads[1].axes[3]) >= .1){
        player2.angle[0] += sens[0] * pads[1].axes[2] * dt/(1/70);
        player2.angle[1] += sens[1] * -pads[1].axes[3] * dt/(1/70);
    }

    if(player2.angle[1] >= Math.PI/2){
        player2.angle[1] = Math.PI/2;
    }
    if(player2.angle[1] <= -Math.PI/2){
        player2.angle[1] = -Math.PI/2;
    }

    p2LeftStick = [pads[1].axes[0], -pads[1].axes[1]];

    if(Math.hypot(pads[1].axes[0], pads[1].axes[1]) <= 0.1){
        p2LeftStick = [0,0];
    }

    if(pads[1].buttons[6].value > 0.5){
        p2LTrigger = true;
    } else {
        p2LTrigger = false;
    }

    if(pads[1].buttons[7].value > 0.5){
        p2RTrigger = true;
    } else {
        p2RTrigger = false;
    }
}

function Player(id){
    this.id = id;
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
        if(this.id == 1){
            if(p1LTrigger && this.coyoteTime > 0){
                this.coyoteTime = -1;
                let upOffset = [0, 0.5, 0];
                let dir = dirFromAngle(...this.angle);

                dir = normalize(plus(dir, upOffset));
                dir[0] /= 2;
                dir[2] /= 2;
                this.velocity = times(dir, this.jumpSpeed);
            }
        } else {
            if(p2LTrigger && this.coyoteTime > 0){
                this.coyoteTime = -1;
                let upOffset = [0, 0.5, 0];
                let dir = dirFromAngle(...this.angle);

                dir = normalize(plus(dir, upOffset));
                dir[0] /= 2;
                dir[2] /= 2;
                this.velocity = times(dir, this.jumpSpeed);
            }
        }
    }

    this.kick = () => {
        let kickRange = 7;
        if(this.id == 1){
            if(p1RTrigger && ball.de(this.pos) < kickRange){
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
        } else {
            if(p2RTrigger && ball.de(this.pos) < kickRange){
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

        if(this.id == 1){
            vel = [p1LeftStick[0], 0, p1LeftStick[1]];

            vel = rotY(vel, this.angle[0]);
        } else {
            vel = [p2LeftStick[0], 0, p2LeftStick[1]];

            vel = rotY(vel, this.angle[0]);
        }

        if(len(vel) > 0){
            this.bodyAngle[0] = aLerp(this.bodyAngle[0], Math.atan2(vel[0], vel[2]), 0.1 * (dt/(1/120)));
            if(this.id == 1){
                renderer.setUni("playerAngle", [this.bodyAngle[0], 0]);
            } else {
                renderer.setUni("playerAngle2", [this.bodyAngle[0], 0]);
            }
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
        if(this.id == 1){
            renderer.setUni("playerPos", this.pos);
            renderer.setUni("camAngle", this.angle);
        } else {
            renderer.setUni("playerPos2", this.pos);
            renderer.setUni("camAngle2", this.angle);
        }

        let camDir = [0, 0, -5];

        camDir = rotX(camDir, -this.angle[1]);

        camDir = rotY(camDir, this.angle[0]);

        let camPos = plus(plus(this.pos, [0,1,0]), camDir);

        let iterations = 1000;

        while(de(camPos) < 0.5 && iterations > 0){
            iterations--;
            camPos = plus(camPos, times(camDir, -0.005/5));
        }
        if(this.id == 1){
            renderer.setUni("camPos", camPos);
        } else {
            renderer.setUni("camPos2", camPos);
        }
        this.camPos = camPos;
    }

    this.createAnimators = () => {
        let legUnis = [];
        if(this.id == 1){
            legUnis = [
                "uhip1", "ujr1", "ujr2", "ujr3", "uhip2", "ujl1", "ujl2", "ujl3", "uHeadPos", "uChestPos", "uBodyAngle"
            ];
        } else {
            legUnis = [
                "uhip1p2", "ujr1p2", "ujr2p2", "ujr3p2", "uhip2p2", "ujl1p2", "ujl2p2", "ujl3p2", "uHeadPosp2", "uChestPosp2", "uBodyAnglep2"
            ];
        }
    
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
        if(this.id == 1){
            renderer.addUniform("uLift", "float", 1.2);
            this.legAnimator = new Animator([...legUnis, "uLift"], sinLerp);
        } else {
            renderer.addUniform("uLiftp2", "float", 1.2);
            this.legAnimator = new Animator([...legUnis, "uLiftp2"], sinLerp);
        }

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

let player = new Player(1);
let player2 = new Player(2);

player.pos = [0, 5, 15];
player.angle = [Math.PI, 0];
player.bodyAngle = [Math.PI, 0];

player2.pos = [0, 5, -15];
player2.angle = [0, 0];
player2.bodyAngle = [0,0];
