let fs_material =`
//マテリアルの設定
const int SAIHATE = 0;
const int CYAN = 1;
const int WHITE = 2;
const int GRID = 3;
const int MANDEL = 4;
const int BROWN = 5;
const int NORMAL = 6;
const int METAL = 7;
const int KADO = 8;
const int MAT = 9;
const int NOISE = 10;
const int SNOISE = 11;
const int CUSTOM = 12;
const int LESSSTEP = 97;
const int DEBUG = 98;
const int ERROR = 99;

//マテリアルの設定
int materialOf(int objectID){
  if (objectID == 0){
    return CUSTOM;
  }else if (objectID == 1){
    return GRID;
  }else if (objectID == 2){
    return WHITE;
  }else if (objectID == 98){
    return SAIHATE;
  }else if (objectID == 99){
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

vec3 customCol(vec3 rPos){
  vec3 color;
  vec3 nor = normal(rPos); // terrain normals
  if(rPos.z < -1.0 && rPos.z > -1.9){
    // base rock colors
		color = mix( vec3(0.8), vec3(.95, 0.9, 0.85), smoothstep(0.7, 1.0, nor.z) );
		
		// layer noise (to produdce lighter color bands of rock)
		float n = 0.5*(noise(rPos.xz*vec2(2.0, 40.0))+1.0);
		// rock layers should show most where nomals are NOT straight up
		color = mix( n*vec3(0.5, 0.4, 0.4), color, nor.z ); 
		
		// grass & moss grows thickest where normals are straight up
		color = mix( color, vec3(0.85, 0.94, 0.88), smoothstep(0.7, 1.0, nor.z) );
  }
  if (rPos.z < -1.9) {
		color = mix( vec3(0.15, 0.05, 0.0), vec3(0.05, 0.1, 0.0), smoothstep(0.0, 0.7, nor.z) );
	}
  return color;
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
    return snoiseCol(ray.rPos);
  }else if (ray.material == CUSTOM){
    return customCol(ray.rPos);
  }else if (ray.material == SAIHATE || ray.material == LESSSTEP){
    // float k = max(0.0,dot(normalize(ray.direction),vec3(0,0,1)));
    // vec3 c1 = vec3(1.0);
    // vec3 c2 = vec3(0.584, 0.752, 0.925);
    // return mix(c1,c2,smoothstep(0.0,0.5,k));
    return vec3(160.0,216.0,239.0)/256.0;
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
  }else{
    return 0.0;
  }
}
`