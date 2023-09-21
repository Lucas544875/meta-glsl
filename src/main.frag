let fs_setup =`
precision mediump float;
uniform float time;
uniform vec2  resolution;
uniform vec3  cDir;
uniform vec3  cPos;

#define PI          3.14159265
#define PI2         (PI*2.0)
#define E           2.71828182
#define INFINITY    1.e20
#define FOV         (30.0 * 0.5 * PI / 180.0)//field of view
#define LightDir    normalize(vec3(2.0,1.0,1.0))
#define Iteration   128
#define MAX_REFRECT 2

struct rayobj{
  vec3  rPos;     //レイの場所
  vec3  direction;//方向
  float distance; //距離関数の返り値
  float len;      //出発点からの距離
  float iterate;  //レイマーチの反復回数
  int   objectID;  //オブジェクトID
  int   material; //マテリアルID
  vec3  normal;   //法線ベクトル
  vec3  fragColor;//色
};

struct effectConfig{
  bool reflect;    //反射
  bool ambient;    //アンビエント
  bool specular;   //ハイライト(鏡面反射)
  bool diffuse;    //拡散光
  bool incandescence;//白熱光
  bool shadow;     //ソフトシャドウ
  bool globallight;//大域照明
  bool grow;       //グロー
  bool fog;        //霧
  bool gamma;      //ガンマ補正
};

const effectConfig effect = effectConfig(
  false, //反射
  true,  //アンビエント
  false, //ハイライト(鏡面反射)
  true, //拡散光
  false,  //白熱光
  false,  //ソフトシャドウ
  false, //大域照明
  false, //グロー
  true,  //霧
  true   //ガンマ補正
);

struct dfstruct{
  float dist;
  int   id;
};
`
let fs_main1 =`
float floor1(vec3 z){
  return plane(z,vec3(0,0,1),-1.95);
}

dfstruct branch(in vec3 p, in float amount) {
	dfstruct res = dfstruct(needles(p, amount), MTL_NEEDLE);
	float s = cylinder(p.xzy + vec3(0.0, 0.0, 100.0), vec2(STEM_THICKNESS, 100.0));
	dfstruct stem = dfstruct(s, MTL_STEM);
	dfmin(res, stem);
	return res;
}

dfstruct halfTree(vec3 p) {
  float section = floor(dot(vec2(length(p.xy),p.z),vec2(-sin(BRANCH_ANGLE), cos(BRANCH_ANGLE)))/BRANCH_SPACING);
	float numBranches =  max(3.0, BRANCH_NUM_MAX - section*BRANCH_NUM_FADE);
  float lower_end = 1.0;
  numBranches = min(numBranches, BRANCH_NUM_MAX - lower_end*BRANCH_NUM_FADE);
	p.xy = repeatAng(p.xy, numBranches);
	p.y -= TREE_R*TREE_CURVATURE;
	p.zy = rotate(p.zy, BRANCH_ANGLE);

  float lower_end_height = lower_end * BRANCH_SPACING;
  if (section >= lower_end){
    p.z = repeat(p.z, BRANCH_SPACING) + lower_end_height;
  }else{
    p.z -= BRANCH_SPACING*0.5;
  }
  // p.z = repeat(p.z, BRANCH_SPACING);
	return branch(p - vec3(0.0,0.0,lower_end_height), 10.0);
}

dfstruct distanceFunction(vec3 p) {
  vec3 z = p;
	//  the first bunch of branches
	dfstruct res = halfTree(p); 
	
	// the second bunch of branches (to hide the regularity)
	p.xy = rotate(p.xy, TREE2_ANGLE);
	p.z -= BRANCH_SPACING*TREE2_OFFSET;
	p /= TREE2_SCALE;
	dfstruct t2 = halfTree(p);
	t2.dist *= TREE2_SCALE;
	dfmin(res, t2);

	// 幹    
	dfstruct tr = dfstruct(cone(z, TRUNK_WIDTH, TREE_H*2.0), MTL_STEM);
	dfmin(res, tr);

	res.dist = max(res.dist, sphere(z, vec3(0.0, 0.0, TREE_H*0.5 + 1.0), TREE_H + 1.0));

  return res;
}

dfstruct depthFunction(vec3 z){
  z=z +vec3(-2,0,0);
  dfstruct plane = dfstruct(floor1(z),1);
  //dfstruct gear = dfstruct(gear(z),2);

  dfstruct df;
  //df = dfmin(plane,gear);
  return df;
}
`

let fs_main2 =`
void main(void){
  // fragment position
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
  //fix:真上真下が見えない
  vec3 xAxes = normalize(cross(cDir,vec3(0.0,0.0,1.0)));
  vec3 yAxes = normalize(-cross(cDir,xAxes));
  vec4 rot = normalize(times(rotation(-p.x*FOV,yAxes),rotation(p.y*FOV,xAxes)));
  vec3 direction = normalize(turn(vec4(0,cDir),rot).yzw);

  //レイの定義と移動
  rayobj ray = rayobj(cPos,direction,0.0,0.0,0.0,99,0,vec3(0.0),vec3(0.0));
  raymarch(ray);
  //trick(ray,2.1);//錯視
  ray.material = materialOf(ray.objectID);

  //エフェクト
  if(abs(ray.distance) < 0.001){//物体表面にいる場合
    if (effect.reflect){
      reflectFunc(ray);
    }
    if(effect.ambient){
      ambientFunc(ray);
    }
    if (effect.specular){
      specularFunc(ray);
    }
    if (effect.diffuse){
      diffuseFunc(ray);
    }
    if (effect.incandescence){
      incandescenceFunc(ray);
    }
    if (effect.shadow){
      shadowFunc(ray);
    }
    if (effect.globallight){
      globallightFunc(ray);
    }
  }else{//描写範囲外 or ステップ数不足
    skysphereFunc(ray);
    lessStepFunc(ray);
  }
  //全体
  if (effect.grow){
    growFunc(ray);
  }
  if (effect.fog){
    fogFunc(ray);
  }
  if (effect.gamma){
    gammaFunc(ray);
  }
  gl_FragColor = vec4(ray.fragColor,1.0);
}
`