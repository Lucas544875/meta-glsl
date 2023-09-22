let fs_util = `
vec3 hsv(float h, float s, float v) {
  // h: 0.0 - 2PI, s: 0.0 - 1.0, v: 0.0 - 1.0, 円柱モデル
  return ((clamp(abs(fract(mod(h,2.0*PI)+vec3(0,2,1)/3.)*6.-3.)-1.,0.,1.)-1.)*s+1.)*v;
}

vec3 gammainv(vec3 p){
  return pow(p,vec3(1.0/2.2));
}

vec3 colorCode(int r, int g, int b){
  return vec3(float(r)/255.0,float(g)/255.0,float(b)/255.0);
}

vec3 rgb(int r, int g, int b){
  return gammainv(colorCode(r,g,b));
}

float manhattan (vec3 p,vec3 q){
  return abs(p.x-q.x)+abs(p.y-q.y)+abs(p.z-q.z);
}

float chebyshev (vec3 p,vec3 q){
  return max(max(abs(p.x-q.x),abs(p.y-q.y)),abs(p.z-q.z));
}

vec3 Hadamard(vec3 v,vec3 w){ //アダマール積
  return vec3(
    v.x * w.x,
    v.y * w.y,
    v.z * w.z
  );
}

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c,s,-s,c);
}

mat3 transpose(mat3 m) {
  return mat3(m[0][0], m[1][0], m[2][0],
              m[0][1], m[1][1], m[2][1],
              m[0][2], m[1][2], m[2][2]);
}

float det(mat2 matrix) {
  return matrix[0].x * matrix[1].y - matrix[0].y * matrix[1].x;
}

mat3 inverse(mat3 matrix) {
  vec3 row0 = matrix[0];
  vec3 row1 = matrix[1];
  vec3 row2 = matrix[2];

  vec3 minors0 = vec3(
    det(mat2(row1.y, row1.z, row2.y, row2.z)),
    det(mat2(row1.z, row1.x, row2.z, row2.x)),
    det(mat2(row1.x, row1.y, row2.x, row2.y))
  );
  vec3 minors1 = vec3(
    det(mat2(row2.y, row2.z, row0.y, row0.z)),
    det(mat2(row2.z, row2.x, row0.z, row0.x)),
    det(mat2(row2.x, row2.y, row0.x, row0.y))
  );
  vec3 minors2 = vec3(
    det(mat2(row0.y, row0.z, row1.y, row1.z)),
    det(mat2(row0.z, row0.x, row1.z, row1.x)),
    det(mat2(row0.x, row0.y, row1.x, row1.y))
  );

  mat3 adj = transpose(mat3(minors0, minors1, minors2));

  return (1.0 / dot(row0, minors0)) * adj;
}

vec3 mix3 (vec3 v1, vec3 v2, vec3 v3, float k){
  float c1 = max(1.0-2.0*k,0.0);
  float c2 = 1.0-2.0*abs(k-0.5);
  float c3 = max(2.0*k-1.0,0.0);
  return c1*v1 + c2*v2 + c3*v3;
}

//noise
// 補間関数
float interpolate(float a, float b, float x){
  float f = (1.0 - cos(x * PI)) * 0.5;
  return mix(a, b, f);
}

// 乱数生成
float rnd(vec2 p){
  return fract(sin(dot(p ,vec2(12.9898,78.233))) * 43758.5453);
}

// 補間乱数
float irnd(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec4 v = vec4(rnd(vec2(i.x,       i.y      )),
                rnd(vec2(i.x + 1.0, i.y      )),
                rnd(vec2(i.x,       i.y + 1.0)),
                rnd(vec2(i.x + 1.0, i.y + 1.0)));
  return interpolate(interpolate(v.x, v.y, f.x), interpolate(v.z, v.w, f.x), f.y);
}

// ノイズ生成
const int   oct  = 8;
const float per  = 0.5;
float noise(vec2 p){
  float t = 0.0;
  for(int i = 0; i < oct; i++){
    float freq = pow(2.0, float(i));
    float amp  = pow(per, float(oct - i));
    t += irnd(vec2(p.x / freq, p.y / freq)) * amp;
  }
  return t;
}

// シームレスノイズ生成
//p:位置 q:相対位置(vec2(0~1)) r:タイルサイズ seed:初期値
float snoise(vec2 p, vec2 q, vec2 r, vec2 seed){
  return  noise(vec2(p.x,       p.y      )+seed) *        q.x  *        q.y  +
          noise(vec2(p.x,       p.y + r.y)+seed) *        q.x  * (1.0 - q.y) +
          noise(vec2(p.x + r.x, p.y      )+seed) * (1.0 - q.x) *        q.y  +
          noise(vec2(p.x + r.x, p.y + r.y)+seed) * (1.0 - q.x) * (1.0 - q.y);
}

// 線形補完
#define linearstep(edge0, edge1, x) min(max(((x) - (edge0)) / ((edge1) - (edge0)), 0.0), 1.0)

`