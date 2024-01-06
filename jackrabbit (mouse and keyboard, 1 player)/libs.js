let libs = 
`
//ty IQ for most of these
float smin( float a, float b, float k )
{
    //k = 0.;
    float h = max( k-abs(a-b), 0.0 )/k;
    return min( a, b ) - h*h*k*(1.0/4.0);
}

vec3 bend(vec3 p, float k)
{
    float c = cos(k*p.x);
    float s = sin(k*p.x);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xy,p.z);
    return q;
}
vec3 rotAxis(vec3 p, float a, vec3 u){
    mat3 m = mat3(
        cos(a) + u.x*u.x*(1.-cos(a)), u.x*u.y*(1.-cos(a))-u.z*sin(a), u.x*u.z*(1.-cos(a)) + u.y*sin(a),
        u.y*u.x*(1.-cos(a))+u.z*sin(a), cos(a) + u.y*u.y*(1.-cos(a)), u.y*u.z*(1.-cos(a))-u.x*sin(a),
        u.z*u.x*(1.-cos(a))-u.y*sin(a), u.z*u.y*(1.-cos(a))+u.x*sin(a), cos(a) + u.z*u.z*(1.-cos(a)) 
    );

    return m*p;
}
vec3 rotY(vec3 v, float a){
    return vec3(v.x*cos(a)+v.z*sin(a),v.y,-v.x*sin(a) + v.z*cos(a));
}

vec3 rotX(vec3 v, float a){
    return vec3(v.x, v.y*cos(a)-v.z*sin(a), v.y*sin(a)+v.z*cos(a));
}
vec3 twist( vec3 p, float k )
{
    float c = cos(k*p.y);
    float s = sin(k*p.y);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xz,p.y);
    return q;
}

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}
float dot2(in vec3 v ) { return dot(v,v); }

float sdBox( vec3 p, vec3 b ){
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}
float sdBox( in vec2 p, in vec2 b ){
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}
float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
  vec3 pa = p - a, ba = b - a;
  float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
  return length( pa - ba*h ) - r;
}
float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}
float sdRoundCone( vec3 p, vec3 a, vec3 b, float r1, float r2 )
{
  // sampling independent computations (only depend on shape)
  vec3  ba = b - a;
  float l2 = dot(ba,ba);
  float rr = r1 - r2;
  float a2 = l2 - rr*rr;
  float il2 = 1.0/l2;
    
  // sampling dependant computations
  vec3 pa = p - a;
  float y = dot(pa,ba);
  float z = y - l2;
  float x2 = dot2( pa*l2 - ba*y );
  float y2 = y*y*l2;
  float z2 = z*z*l2;

  // single square root!
  float k = sign(rr)*rr*rr*x2;
  if( sign(z)*a2*z2>k ) return  sqrt(x2 + z2)        *il2 - r2;
  if( sign(y)*a2*y2<k ) return  sqrt(x2 + y2)        *il2 - r1;
                        return (sqrt(x2*a2*il2)+y*rr)*il2 - r1;
}
float sdVerticalCapsule( vec3 p, float h, float r )
{
  p.y -= clamp( p.y, 0.0, h );
  return length( p ) - r;
}
float sdCappedCylinder( vec3 p, float h, float r )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - vec2(r,h);
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}
float sdSphere(vec3 p, float r){
    return length(p) - r;
}

vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
  
vec4 permute(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}
float noise(vec3 p) {
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);
  
    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = permute(b.xyxy);
    vec4 k2 = permute(k1.xyxy + b.zzww);
  
    vec4 c = k2 + a.zzzz;
    vec4 k3 = permute(c);
    vec4 k4 = permute(c + 1.0);
  
    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));
  
    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
  
    return o4.y * d.y + o4.x * (1.0 - d.y);
}
//stars from https://www.shadertoy.com/view/msdXzl
vec3 nmzHash33(vec3 q) {
    uvec3 p = uvec3(ivec3(q));
    p = p * uvec3(374761393U, 1103515245U, 668265263U) + p.zxy + p.yzx;
    p = p.yzx * (p.zxy ^ (p >> 3U));
    return vec3(p ^ (p >> 16U)) * (1.0 / vec3(0xffffffffU));
}
vec3 stars(in vec3 p) {
    vec3 c = vec3(0.);
    float resX = 500.;
  
    for(float i = 0.; i < 5.; i++) {
        vec3 q = fract(p * (.15 * resX)) - 0.5;
        vec3 id = floor(p * (.15 * resX));
        vec2 rn = nmzHash33(id).xy;
        float c2 = 1. - smoothstep(0., .6, length(q));
        c2 *= step(rn.x, .0005 + i * 0.002);
        c += c2 * (mix(vec3(1.0, 0.49, 0.1), vec3(0.75, 0.9, 1.), rn.y) * 0.25 + 0.75);
        p *= 1.4;
    }
    return c * c;
}

`;

let libsAfterDe = `
vec3 grad(vec3 p){
    float eps = 0.01;
    return normalize(vec3((de(p+vec3(eps, 0., 0.)) - de(p-vec3(eps,0.,0.)))/(2.*eps), (de(p+vec3(0., eps, 0.)) - de(p-vec3(0.,eps,0.)))/(2.*eps), (de(p+vec3(0., 0., eps)) - de(p-vec3(0.,0.,eps)))/(2.*eps)));
}
float light(vec3 p, vec3 l){
    return clamp(dot(grad(p), l), 0., 1.);
}

float specLight(vec3 p, vec3 l){
    vec3 pos = normalize(p-camPos);
    vec3 ray = reflect(l, grad(p));
    return clamp(dot(pos, ray), 0., 1.);
}

`
function rotY(v, a){
    return [v[0]*cos(a) + v[2]*sin(a), v[1], -v[0]*sin(a) + v[2]*cos(a)];
}
function rotX(v, a){
    return [v[0], v[1]*cos(a)-v[2]*sin(a), v[1]*sin(a)+v[2]*cos(a)];
}
function plus(a1, a2){
    return [a1[0] + a2[0], a1[1] + a2[1], a1[2] + a2[2]];
}
function times(a, s){
    return [a[0]*s, a[1]*s, a[2]*s];
}
function min(){
    return Math.min(...arguments);
}
function max(){
    return Math.max(...arguments);
}
function abs(x){
    if(x.length != undefined){
        let temp = [];
        for(let i of x){
            temp.push(Math.abs(i));
        }
        return temp;
    }
    return Math.abs(x);
}
function matPlus(a, b){
    let temp = [];
    for(let i in a){
        temp[i] = [];
        for(let j in a[i]){
            temp[i][j] = a[i][j] + b[i][j];
        }
    }

    return temp;
}
function matTimes(m, v){
    return [
        m[0][0]*v[0] + m[0][1]*v[1] + m[0][2]*v[2],
        m[1][0]*v[0] + m[1][1]*v[1] + m[1][2]*v[2],
        m[2][0]*v[0] + m[2][1]*v[1] + m[2][2]*v[2]
    ];
}
function matTimesMat(a, b){
    let temp = [[],[],[]];
    for(let i in b){
        let col = matTimes(a, [b[0][i], b[1][i], b[2][i]]);
        for(let j in col){
            temp[j].push(col[j]);
        }
    }
    return temp;
}
function matTimesS(m, s){
    let temp = [];
    for(let i in m){
        temp[i] = [];
        for(let j in m[i]){
            temp[i][j] = m[i][j]*s;
        }
    }
    return temp;
}
function I(){
    return [[1,0,0],[0,1,0],[0,0,1]];
}
//skew-symmetric cross-product matrix of v ?? (don't know what this means)
function sscpm(v){
    return [
        [0, -v[2], v[1]],
        [v[2], 0, -v[0]],
        [-v[1], v[0], 0]
    ]
}
//https://math.stackexchange.com/questions/180418/calculate-rotation-matrix-to-align-vector-a-to-vector-b-in-3d
function rotMatFromTwoVectors(a, b){
    let v = cross(a,b);
    let s = len(v);
    let c = dot(a,b);

    let vx = sscpm(v);
    let vx2 = matTimesS(matTimesMat(vx, vx), (1/(1+c)));

    let R = matPlus(matPlus(I(), vx), vx2);

    return R;
}
function rotMatFromVec(v){
    v = normalize(v);
    let u = [0,0,1];
    let k = sscpm(u);
    let c = dot(v,u);
    let s = len(cross(v,u));

    let k2 = matTimesMat(k, k);

    k = matTimesS(k, s);
    k2 = matTimesS(k2, (1-c));

    let R = matPlus(I(), matPlus(k,k2));

    return R;
}
function rotAxis(p, a, u){
    let m = [
        [cos(a)+u[0]*u[0]*(1-cos(a)), u[0]*u[1]*(1-cos(a))-u[2]*sin(a), u[0]*u[2]*(1-cos(a))+u[1]*sin(a)],
        [u[1]*u[0]*(1-cos(a))+u[2]*sin(a), cos(a)+u[1]*u[1]*(1-cos(a)), u[1]*u[2]*(1-cos(a))-u[0]*sin(a)],
        [u[2]*u[0]*(1-cos(a))-u[1]*sin(a), u[2]*u[1]*(1-cos(a))+u[0]*sin(a), cos(a)+u[2]*u[2]*(1-cos(a))]
    ];

    return matTimes(m, p);
}
function rotAxisMat(a, u){
    return [
        [cos(a)+u[0]*u[0]*(1-cos(a)), u[0]*u[1]*(1-cos(a))-u[2]*sin(a), u[0]*u[2]*(1-cos(a))+u[1]*sin(a)],
        [u[1]*u[0]*(1-cos(a))+u[2]*sin(a), cos(a)+u[1]*u[1]*(1-cos(a)), u[1]*u[2]*(1-cos(a))-u[0]*sin(a)],
        [u[2]*u[0]*(1-cos(a))-u[1]*sin(a), u[2]*u[1]*(1-cos(a))+u[0]*sin(a), cos(a)+u[2]*u[2]*(1-cos(a))]
    ];
}
function mod(x, m){
    if(x.length != undefined){
        let temp = [];
        for(let i of x){
            temp.push(((i%m)+m)%m);
        }
        return temp;
    }
    return ((x%m)+m)%m;
}
function cos(x){
    if(x.length != undefined){
        let temp = [];
        for(let i of x){
            temp.push(Math.cos(i));
        }
        return temp;
    }
    return Math.cos(x);
}
function sin(x){
    if(x.length != undefined){
        let temp = [];
        for(let i of x){
            temp.push(Math.sin(i));
        }
        return temp;
    }
    return Math.sin(x);
}
function len(v){
    return Math.hypot(...v);
}
function normalize(v){
    if(len(v) == 0){
        return [0,0,0];
    }
    return times(v, 1/len(v));
}
function dot(a, b){
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}
function cross(a, b){
    return [
        a[1]*b[2]-a[2]*b[1],
        a[2]*b[0]-a[0]*b[2],
        a[0]*b[1]-a[1]*b[0]
    ];
}
function reflect(d, n){
    return plus(d, times(n, -2*dot(d,n)));
}
function deNormal(p){
    let eps = 0.01;
    eps /= 2;
    return normalize([
        de(plus(p, [eps, 0, 0])) - de(plus(p, [-eps, 0, 0])),
        de(plus(p, [0, eps, 0])) - de(plus(p, [0, -eps, 0])),
        de(plus(p, [0, 0, eps])) - de(plus(p, [0, 0, -eps]))
    ]);
}
function lerp(a,b,w){
    if(a.length != undefined){
        let temp = [];
        for(let i in a){
            temp.push(a[i] + (b[i]-a[i])*w);
        }
        return temp;
    }
    return a+(b-a)*w;
}

function sinLerp(a,b,w){
    return lerp(a,b, sin(Math.PI*(w-0.5))/2 + 0.5);
}

function aLerp(a,b,w){
    a %= 2*Math.PI;
    b %= 2*Math.PI;
    if(abs(b-a) < Math.PI){
        return lerp(a,b,w);
    } else {
        a += Math.sign(b-a)*2*Math.PI;
        return lerp(a,b,w);
    }
}

function sdBox3(p, b){
    let q = plus(abs(p), times(b, -1));
    return len([max(q[0], 0),max(q[1], 0),max(q[2], 0)]) + min(max(q[0],q[1],q[2]), 0);
}

function dirFromAngle(ax, ay){
    let dir = [0,0,1];
    dir = rotX(dir, -ay);
    dir = rotY(dir, ax);

    return dir;
}

function march(df, p, dir){
    let eps = 0.01;
    let range = 10000;
    let totDist = 0;

    let dist = df(p);
    while(dist > eps && totDist < range){
        p = plus(p, times(dir, dist));
        totDist += dist;
        dist = df(p);
    }

    if(dist < eps){
        return p;
    } else {
        return false;
    }
}