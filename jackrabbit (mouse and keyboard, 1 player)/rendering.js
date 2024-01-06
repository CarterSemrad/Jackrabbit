function createGraphics(de, colors, otherfunctions, uniforms){

    let c = document.createElement("canvas");

    let scale = 1;

    c.width = scale * window.innerWidth;
    c.height = scale * window.innerHeight;

    document.body.appendChild(c);

    c.onclick = (e) => {
        c.requestPointerLock();
    }

    let gl = c.getContext("webgl2");

    function makeShader(src, type){
        let shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            return shader;
        } else {
            console.log(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
        }
    }

    function createProgram(vertShad, fragShad){
        let program = gl.createProgram();
        gl.attachShader(program, vertShad);
        gl.attachShader(program, fragShad);

        gl.linkProgram(program);

        return program;
    }

    let vertSrc = 
    `#version 300 es

    in vec4 a_position;
    out vec4 pos4;

    void main(){
        pos4 = a_position;
        gl_Position = a_position;
    }`;

    let fragSrc = 
    `#version 300 es

    #define MIN_DIST 0.001
    #define MAX_ITERATIONS 100
    #define RANGE 1000.

    precision highp float;

    out vec4 color;
    in vec4 pos4;

    uniform vec2 res;
    uniform vec3 camPos;
    uniform vec2 camAngle;
    uniform float t;
    uniform vec3 playerPos;
    uniform vec3 ballPos;
    uniform vec2 ballAngle;
    uniform mat3 ballRotMat;
    uniform vec2 playerAngle;
    ${uniforms}

    ${libs}

    ${de}

    ${libsAfterDe}

    ${otherfunctions}

    void main(){
        vec2 pos = pos4.xy;
        pos.x *= res.x/res.y;

        float fovX = .35;
        float fovY = .35;

        vec3 dir = normalize(vec3(pos.x*fovX, pos.y*fovY, 0.5515));

        dir = rotX(dir, -camAngle.y);
        dir = rotY(dir, camAngle.x);

        vec3 p = camPos;

        float dist = de(p);
        float totDist = dist;
        float bloomDist = bloomDe(p);
        float bloomTemp = bloomDist;

        while(dist > MIN_DIST && totDist < RANGE){
            p += dir*dist;
            dist = de(p);
            bloomTemp = bloomDe(p);
            if(bloomTemp < bloomDist){
                bloomDist = bloomTemp;
            }
            totDist += dist;
        }

        ${colors}

        //color = vec4(abs(pos.x),1.-length(pos),abs(pos.y),1.);
        
    }
    `

    vertShad = makeShader(vertSrc, gl.VERTEX_SHADER);
    fragShad = makeShader(fragSrc, gl.FRAGMENT_SHADER);

    let program = createProgram(vertShad, fragShad);

    let posLoc = gl.getAttribLocation(program, "a_position");

    let posBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,-1,1,1,1,1,1,1,-1,-1,-1]), gl.STATIC_DRAW);


    let va = gl.createVertexArray();

    gl.bindVertexArray(va);

    gl.enableVertexAttribArray(posLoc);

    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.viewport(0, 0, c.width, c.height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    return {gl, program, c};
}

function Renderer(de, colors, otherfunctions, uniforms){
    let graphics = createGraphics(de, colors, otherfunctions, uniforms);
    this.gl = graphics.gl;
    this.canvas = graphics.c;
    this.program = graphics.program;

    this.uniforms = {};

    this.addUniform = (name, type, value) => {
        if(value.length != undefined){
            if(value[0].length == undefined){
                value = new Float32Array(value);
            }
        }
        let uni = {location: "", t: type, name: name, value: value};
        uni.location = this.gl.getUniformLocation(this.program, name);
        if(type == "vec2"){
            uni.t = (loc, val)=>{this.gl.uniform2fv(loc, val)};
        }
        if(type == "vec3"){
            uni.t = (loc, val)=>{this.gl.uniform3fv(loc, val)};
        }
        if(type == "vec4"){
            uni.t = (loc, val)=>{this.gl.uniform4fv(loc, val)};
        }
        if(type == "float"){
            uni.t = (loc, val)=>{this.gl.uniform1f(loc, val)};
        }
        if(type == "mat3"){
            uni.t = (loc, val)=>{
                let temp = [];
                for(let i of val){
                    for(let j of i){
                        temp.push(j);
                    }
                }
                this.gl.uniformMatrix3fv(loc, false, new Float32Array(temp));
            };
        }

        this.uniforms[name] = uni;

        uni.t(uni.location, uni.value);
    }

    this.setUni = (name, value) => {
        if(value.length != undefined){
            if(value.length == undefined){
                value = new Float32Array(value);
            }
        }
        this.uniforms[name].value = value;
        this.uniforms[name].t(this.uniforms[name].location, value);
    }

    this.updateUniforms = () => {
        for(let i of this.uniforms){
            i.t(i.location, i.value);
        }
    }

    this.draw = () => {
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
}