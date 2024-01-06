#version 300 es 

precision highp float;

uniform float t;

in vec4 pos4;
out vec4 color;

void main(){
    vec2 pos = pos4.xy;

    vec2 position = pos;

    
    //uniform variable that keeps track of the time
    uniform float t;

    if(length(position) <= 0.5){
        //Red value changes over time
        color = vec4(abs(sin(t)), 1.0, 1.0, 1.0);
    } else {
        //RGBA value for black
        color = vec4(0.0, 0.0, 0.0, 1.0);
    }


}