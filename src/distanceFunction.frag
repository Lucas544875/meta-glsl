let fs_distanceFunction =`

dfstruct dfmeta(dfstruct df1, dfstruct df2,float k){ //メタボール風の結合
  float distmin, distmax;
  int id;
  if (df1.dist < df2.dist){
    distmin = df1.dist;
    distmax = df2.dist;
    id = df1.id;
  }else{
    distmin = df2.dist;
    distmax = df1.dist;
    id = df2.id;
  }
  float h = 1.0 + exp(-k *(distmax-distmin));
  return dfstruct(distmin -log(h) / k, id);
}

dfstruct dfmax(dfstruct df1, dfstruct df2){ //共通部分
  if (df1.dist < df2.dist){
    return df2;
  }else{
    return df1;
  }
}

dfstruct dfmin(dfstruct df1, dfstruct df2){//和集合
  if (df1.dist < df2.dist){
    return df1;
  }else{
    return df2;
  }
}

vec2 pmod2d(vec2 p, float r,float section) {
  float a = atan(p.x, p.y) + PI/r+section;
  float n = PI2 / r;
  a = floor(a/n)*n ;
  return p*rot(-a);
}

vec3 pmod(vec3 z, vec3 center, vec3 direction, int n, float section){
  vec3 cz = z - center;
  vec3 pole = cross(vec3(0,0,1),direction);
  float theta = angle(vec3(0,0,1),direction);
  vec3 tz = turn(cz,pole,-theta);
  vec3 zz = vec3(pmod2d(tz.xy,float(n),section),tz.z);
  return turn(zz,pole,theta) + center;
}

vec3 wipe(vec3 z, vec3 center, vec3 direction, int n, float section){//結局よくわからん
  vec3 cz = z - center;
  vec3 axes = cross(direction,vec3(0,0,1));
  float theta = angle(axes,cz) + section;
  float shift = floor(theta*float(n)/PI2)*PI2/float(n);
  return turn(cz,direction,shift)+center;
}

//primitives
float sphere(vec3 z,vec3 center,float radius){
  return length(z-center)-radius;
}


float plane(vec3 z,vec3 normal,float offset){
	return dot(z,normalize(normal)) - offset;
}

float plane1(vec3 z){//plane
  return plane(z,normalize(vec3(0.0,0.0,1.0)),0.5);
}

void sphereFold(inout vec3 z, inout float dz, float minRadius2, float fixedRadius2) {
	float r2 = dot(z,z);
	if (r2<minRadius2) { 
		// linear inner scaling
		float temp = fixedRadius2/(minRadius2);
		z *= temp;
		dz*= temp;
	} else if (r2<fixedRadius2) { 
		// this is the actual sphere inversion
		float temp =fixedRadius2/r2;
		z *= temp;
		dz*= temp;
	}
}

void boxFold(inout vec3 z, inout float dz, float foldingLimit) {
	z = clamp(z, -foldingLimit, foldingLimit) * 2.0 - z;
}

float mandelBox(vec3 z, float Scale, float foldingLimit, float minRadius2, float fixedRadius2){
	vec3 offset = z;
	float dr = 1.0;
	for (int n = 0; n < 16; n++) {
		boxFold(z,dr,foldingLimit);       // Reflect
		sphereFold(z,dr,minRadius2,fixedRadius2);    // Sphere Inversion
    z=Scale*z + offset;  // Scale & Translate
    dr = dr*abs(Scale)+1.0;
	}
	float r = length(z);
	return r/abs(dr);
}
float tofu(vec3 z){
  float Scale = 1.9 ;//定数
  float foldingLimit=0.6;//定数
	float minRadius2=0.60;//定数
  float fixedRadius2=2.65;//定数
	return mandelBox(z, Scale, foldingLimit, minRadius2, fixedRadius2);
}
float kado(vec3 z){
  float Scale = -2.18 ;//定数
  float foldingLimit=1.14;//定数
	float minRadius2=0.60;//定数
  float fixedRadius2=2.65;//定数
	return mandelBox(z, Scale, foldingLimit, minRadius2, fixedRadius2);
}

float sdCross(vec3 p, float c) {
	p = abs(p);
	float dxy = max(p.x, p.y);
	float dyz = max(p.y, p.z);
	float dxz = max(p.x, p.z);
	return min(dxy, min(dyz, dxz)) - c;
}

float sdBox(vec3 p, vec3 b) {
	p = abs(p) - b;
	return length(max(p, 0.0)) + min(max(p.x, max(p.y, p.z)), 0.0);
}

float _mengerSponge(vec3 p, float scale, float width) {
	float d = sdBox(p, vec3(1.0));
	float s = 1.0;
	for (int i = 0; i < 8; i++) {
		vec3 a = mod(p * s, 2.0) - 1.0;
		s *= scale;
		vec3 r = 1.0 - scale * abs(a);
		float c = sdCross(r, width) / s;
		d = max(d, c);
	}
	return d;
}

float mengerSponge(vec3 p) {
	float scale = 3.0;
	float width = 1.0;
	return _mengerSponge(p,scale,width);
}

float pseudoKleinian(vec3 p) {
	vec3 csize = vec3(0.90756, 0.92436, 0.90756);
	float size = 1.2;
	vec3 c = vec3(0.0);
	float defactor = 1.0;
	vec3 ap = p + 1.0;
	for (int i = 0; i < 10; i++) {
		ap = p;
		p = 2.0 * clamp(p, -csize, csize) - p;
		float r2 = dot(p, p);
		float k = max(size / r2, 1.0);
		p *= k;
		defactor *= k;
		p += c;
	}
	float r = abs(0.5 * p.z / defactor);
	return r;
}
float shiftKeinian(vec3 p){
	vec3 o = vec3(11.0,-1.0,-1.0);
	return pseudoKleinian(p - o);
}

float gasket(vec3 z){
	const float isq3 = inversesqrt(3.0);
	vec3 a1 = vec3(0,0,3.0/2.0);
	vec3 a2 = vec3(0,1,0);
	vec3 a3 = vec3(2.0/3.0*isq3,-1.0/3.0*isq3,0);
	vec3 a4 = vec3(-2.0/3.0*isq3,-1.0/3.0*isq3,0);
	vec3 c;
	float dist, d;
  float Scale=2.0;
  const int ite=50;
	for (int i=0;i < ite;i++) {
    c = a1; dist = length(z-a1);
    d = length(z-a2); if (d < dist) { c = a2; dist=d; }
    d = length(z-a3); if (d < dist) { c = a3; dist=d; }
    d = length(z-a4); if (d < dist) { c = a4; dist=d; }
    z = Scale*z-c*(Scale-1.0);
	}
	return length(z) * pow(Scale, float(-ite));
}

float lenPtoL(vec3 p,vec3 l, vec3 dir){
	vec3 ndir = normalize(dir);
	return length(l-p - dot(ndir,l-p)*ndir);
}
float triangle(vec3 z, vec3 p1, vec3 p2, vec3 p3){
	vec3 p1z = z-p1;
	vec3 p1p2 = p2 - p1;
	vec3 p1p3 = p3 - p1;
	vec3 p2p3 = p3 - p2;
	vec3 normal = normalize(cross(p1p2,p1p3));
	mat3 cmat = mat3(p1p2,p1p3,normal);
	vec3 c = inverse(cmat)*p1z;
	if(c.x > 0.0 && c.y > 0.0 && c.x+c.y < 1.0){
		return abs(dot(normal,p1z));
	}else if(c.y<0.0 && c.x>0.0 && c.x+c.y<1.0){
		return lenPtoL(z,p1,p1p2);
	}else if(c.x<0.0 && c.y>0.0 && c.y+c.x<1.0){
		return lenPtoL(z,p1,p1p3);
	}else if(c.x+c.y>1.0 && abs(c.x-c.y)<1.0){
		return lenPtoL(z,p2,p2p3);
	}else{
		float d1 = length(z-p1);
		float d2 = length(z-p2);
		float d3 = length(z-p3);
		return min(min(d1,d2),d3);
	}
}

float octahedron(vec3 z){
  vec3 pz = pmod(z,vec3(0),vec3(1,0,0),2,PI/2.0);
  vec3 ppz = pmod(pz,vec3(0),vec3(0,0,1),4,-PI/4.0);
  vec3 p1 = vec3(1,0,0);
  vec3 p2 = vec3(0,1,0);
  vec3 p3 = vec3(0,0,1);
  return triangle(ppz,p1,p2,p3)-0.01;
}

float CappedTorus(vec3 p, float arc, float ra, float rb){
  vec2 sc = vec2(sin(arc),cos(arc));
	p.x = abs(p.x);
	float k = (sc.y*p.x>sc.x*p.y) ? dot(p.xy,sc) : length(p.xy);
	return sqrt( dot(p,p) + ra*ra - 2.0*ra*k ) - rb;
}

float edgeTorus(vec3 p, float radius, float width, float height){
	vec2 v = vec2(length(p.xy),p.z);
	v = abs(v-vec2(radius,0));
	return max(v.x - width,v.y-height);
}

float sphere(vec3 p, float r) {
    return length(p) - r;
}

float cone(in vec3 p, float r, float h) {
    return max(abs(p.y) - h, length(p.xz)) - r*clamp(h - abs(p.y), 0.0, h);
}

float cylinder(vec3 p, vec2 h) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - h;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

#define NORMAL_EPS              0.001

#define NEAR_CLIP_PLANE         1.0
#define FAR_CLIP_PLANE          100.0
#define MAX_RAYCAST_STEPS       200
#define STEP_DAMPING            0.7
#define DIST_EPSILON            0.001
#define MAX_RAY_BOUNCES         3.0

#define MAX_SHADOW_DIST         10.0

#define AMBIENT_COLOR           vec3(0.03, 0.03, 0.03)
#define LIGHT_COLOR             vec3(0.8, 1.0, 0.9)
#define SPEC_COLOR              vec3(0.8, 0.90, 0.60)

#define SPEC_POWER              16.0

#define FOG_DENSITY             0.001

#define CAM_DIST                18.0
#define CAM_H                   1.0
#define CAM_FOV_FACTOR 4.0
#define LOOK_AT_H               4.0
#define LOOK_AT                 vec3(0.0, LOOK_AT_H, 0.0)

#define MTL_BACKGROUND          -1.0
#define MTL_GROUND              1.0
#define MTL_NEEDLE              2.0
#define MTL_STEM                3.0
#define MTL_TOPPER              4.0
#define MTL_CAP                 5.0
#define MTL_BAUBLE              6.0

#define CLR_BACKGROUND          vec3(0.3, 0.342, 0.5)
#define CLR_GROUND              vec3(3.3, 3.3, 4.5)
#define CLR_NEEDLE              vec3(0.152,0.36,0.18)
#define CLR_STEM                vec3(0.79,0.51,0.066)
#define CLR_TOPPER              vec3(1.6,1.0,0.6)
#define CLR_CAP                 vec3(1.2,1.0,0.8)

#define BAUBLE_REFLECTIVITY     0.7

#define TREE_H                  4.0
#define TREE_R                  3.0
#define TREE_CURVATURE          1.0
#define TRUNK_WIDTH             0.025
#define TREE2_ANGLE             0.4
#define TREE2_OFFSET            0.4
#define TREE2_SCALE             0.9


#define NEEDLE_LENGTH           0.5
#define NEEDLE_SPACING          0.15
#define NEEDLE_THICKNESS        0.05
#define NEEDLES_RADIAL_NUM      17.0
#define NEEDLE_BEND             0.99
#define NEEDLE_TWIST            1.0
#define NEEDLE_GAIN             0.7
#define STEM_THICKNESS          0.02
#define BRANCH_ANGLE            0.38
#define BRANCH_SPACING          1.2
#define BRANCH_NUM_MAX          9.0
#define BRANCH_NUM_FADE         2.0

#define BAUBLE_SIZE             0.5
#define BAUBLE_SPACING          1.9
#define BAUBLE_COUNT_FADE1      1.2
#define BAUBLE_COUNT_FADE2      0.3
#define BAUBLE_JITTER           0.05
#define BAUBLE_SPREAD           0.6
#define BAUBLE_MTL_SEED         131.0
#define BAUBLE_YIQ_MUL          vec3(0.8, 1.1, 0.6)
#define BAUBLE_CLR_Y            0.7
#define BAUBLE_CLR_I            1.3
#define BAUBLE_CLR_Q            0.9
#define TOPPER_SCALE            2.0

float add(float d1, float d2) {
    return min(d2, d1);
}
float intersect(float d1, float d2) {
    return max(d2, d1);
}
void add(inout vec2 d1, in vec2 d2) {
    if (d2.x < d1.x) d1 = d2;
}
void intersect(inout vec2 d1, in vec2 d2) {
    if (d1.x < d2.x) d1 = d2;
}

vec2 rotate(vec2 p, float ang) {
	float c = cos(ang), s = sin(ang);
	return vec2(p.x*c-p.y*s, p.x*s+p.y*c);
}

float repeat(float coord, float spacing) {
    return mod(coord, spacing) - spacing*0.5;
}

vec2 repeatAng(vec2 p, float n) {
    float ang = 2.0*PI/n;
    float sector = floor(atan(p.x, p.y)/ang + 0.5);
    p = rotate(p, sector*ang);
    return p;
}

float needles(in vec3 p) {
    p.xy = rotate(p.xy, -length(p.xz)*NEEDLE_TWIST);
    p.xy = repeatAng(p.xy, NEEDLES_RADIAL_NUM);
    p.yz = rotate(p.yz, -NEEDLE_BEND);
    p.y -= p.z*NEEDLE_GAIN;
    p.z = min(p.z, 0.0);
    p.z = repeat(p.z, NEEDLE_SPACING);
    return cone(p, NEEDLE_THICKNESS, NEEDLE_LENGTH);
}

vec2 branch(in vec3 p) {
    vec2 res = vec2(needles(p), MTL_NEEDLE);
    float s = cylinder(p.xzy + vec3(0.0, 100.0, 0.0), vec2(STEM_THICKNESS, 100.0));
    vec2 stem = vec2(s, MTL_STEM);
    add(res, stem);
    return res;
}

vec2 halfTree(vec3 p) {
    float section = floor(p.y/BRANCH_SPACING);
    float numBranches =  max(2.0, BRANCH_NUM_MAX - section*BRANCH_NUM_FADE);
    p.xz = repeatAng(p.xz, numBranches);
    p.z -= TREE_R*TREE_CURVATURE;
    p.yz = rotate(p.yz, BRANCH_ANGLE);
    p.y = repeat(p.y, BRANCH_SPACING);
    return branch(p);
}

float tree(vec3 p) {
	//  the first bunch of branches
	vec2 res = halfTree(p); 
	
	// the second bunch of branches (to hide the regularity)
	p.xz = rotate(p.xz, TREE2_ANGLE);
	p.y -= BRANCH_SPACING*TREE2_OFFSET;
	p /= TREE2_SCALE;
	vec2 t2 = halfTree(p);
	t2.x *= TREE2_SCALE;
	add(res, t2);

	// trunk    
	vec2 tr = vec2(cone(p.xyz, TRUNK_WIDTH, TREE_H*2.0), MTL_STEM);
	add(res, tr);

	res.x = intersect(res.x, sphere(p - vec3(0.0, TREE_H*0.5 + 1.0, 0.0), TREE_H + 1.0));    
	return res.x;
}

`