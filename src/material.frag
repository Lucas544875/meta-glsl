let fs_material =`
//マテリアルの設定
#define SAIHATE             0
#define CYAN                1
#define WHITE               2
#define GRID                3
#define MANDEL              4
#define BROWN               5
#define NORMAL              6
#define METAL               7
#define KADO                8
#define MAT                 9
#define NOISE              10
#define SNOISE             11
#define WATER              12
#define CUSTOM             13
#define MTL_NEEDLE         14
#define MTL_STEM           15
#define LESSSTEP           97
#define DEBUG              98
#define ERROR              99

#define OBJ_SAIHATE       198
#define OBJ_LESSSTEP      199

//マテリアルの設定
int materialOf(int objectID){
  if (objectID == OBJ_CUSTOM){
    return CUSTOM;
  }else if (objectID == OBJ_COORD_PLANE){
    return GRID;
  }else if (objectID == OBJ_NEEDLE){
    return MTL_NEEDLE;
  }else if (objectID == OBJ_STEM){
    return MTL_STEM;
  }else if (objectID == OBJ_SAIHATE){
    return SAIHATE;
  }else if (objectID == OBJ_LESSSTEP){
    return LESSSTEP;
  }else{
    return ERROR;
  }
}

vec3 normal(vec3 p){
  float d = 0.005;
  return normalize(vec3(
    distanceFunction(p + vec3(  d, 0.0, 0.0)).dist - distanceFunction(p + vec3( -d, 0.0, 0.0)).dist,
    distanceFunction(p + vec3(0.0,   d, 0.0)).dist - distanceFunction(p + vec3(0.0,  -d, 0.0)).dist,
    distanceFunction(p + vec3(0.0, 0.0,   d)).dist - distanceFunction(p + vec3(0.0, 0.0,  -d)).dist
  ));
}


vec3 gridCol(vec3 rPos){
  return mix(vec3(0.3),vec3(step(fract(2.0*rPos.x),0.05),step(fract(2.0*rPos.y),0.05),step(fract(2.0*rPos.z),0.05)),0.5);
}

vec3 debugCol(vec3 rPos){
  return fract(rPos);
}

vec3 kadoCol(vec3 rPos){
  float k = dot (rPos,vec3(0,1,1))/8.0 +0.5;
  vec3 col1 = gammainv(vec3(0.007, 0.313, 0.772));
  vec3 col2 = gammainv(vec3(0.831, 0.247, 0.552));
  return mix(col1,col2,k);
}

vec3 normalCol(vec3 rPos){
  return abs(normal(rPos));
}

vec3 noiseCol(vec3 rPos){
  return vec3(noise(rPos.xy*100.0));
}

vec3 snoiseCol(vec3 rPos){
  const float map = 256.0;
  // seamless noise
	vec2 t = mod(rPos.xy*100.0, map);
	float n = snoise(t, t/map, vec2(map), vec2(time*10.0));
  return vec3(n);
}
vec3 waterCol(vec3 rPos){
  return rgb(0,24,40);
}

vec3 customCol(vec3 rPos){
  return vec3(0.5);
}

vec3 needleCol(vec3 rPos){
  return vec3(0.152,0.36,0.18);
}

vec3 stemCol(vec3 rPos){
  return vec3(0.79,0.51,0.066);
}

vec3 color(rayobj ray){
  if (ray.material == GRID){
    return gridCol(ray.rPos);
  }else if (ray.material == WHITE){
    return vec3(1.0,1.0,1.0);
  }else if (ray.material == DEBUG){
    return debugCol(ray.rPos);
  }else if (ray.material == MANDEL){
    return kadoCol(ray.rPos);
  }else if (ray.material == BROWN){
    return vec3(0.454, 0.301, 0.211);
  }else if (ray.material == CYAN){
    return vec3(0,1,1);
  }else if (ray.material == NORMAL){
    return normalCol(ray.rPos);
  }else if (ray.material == METAL){
    return vec3(0.7);
  }else if (ray.material == KADO){
    return kadoCol(ray.rPos);
  }else if (ray.material == MAT){
    return vec3(0.960,0.95,0.92);
  }else if (ray.material == NOISE){
    return noiseCol(ray.rPos);
  }else if (ray.material == SNOISE){
    return noiseCol(ray.rPos);
  }else if (ray.material == WATER){
    return waterCol(ray.rPos);
  }else if (ray.material == CUSTOM){
    return customCol(ray.rPos);
  }else if (ray.material == MTL_NEEDLE){
    return needleCol(ray.rPos);
  }else if (ray.material == MTL_STEM){
    return stemCol(ray.rPos);
  }else if (ray.material == SAIHATE || ray.material == LESSSTEP){
    float k = max(0.0,dot(normalize(ray.direction),vec3(0,0,1)));
    vec3 c1 = colorCode(255,234,183);
    vec3 c2 = colorCode(1,132,210);
    return mix(c1,c2,smoothstep(-0.1,0.3,k));
    //return vec3(160.0,216.0,239.0)/256.0;
  }else{
    return vec3(1.0,0.0,0.0);
  }
}

float refrectance(int material){
  if (material == CYAN){
    return 0.1;
  }else if (material == WHITE){
    return 0.6;
  }else if (material == DEBUG){
    return 0.3;
  }else if (material == GRID){
    return 0.3;
  }else if (material == MANDEL){
    return 0.3;
  }else if (material == NORMAL){
    return 0.4;
  }else if (material == METAL){
    return 0.6;
  }else if (material == WATER){
    return 0.4;
  }else{
    return 0.0;
  }
}
`