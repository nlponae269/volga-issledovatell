// Пост-обработка в духе URP-профиля GaragesPostFX: Bloom, ACES, виньетка, плёночное зерно,
// хроматическая аберрация, цветокоррекция (экспозиция +1.3, контраст +14, насыщенность −28, баланс белого −10).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: 0.33 }, uVigSmooth: { value: 0.45 }, uChroma: { value: 0.05 },
    uGrain: { value: 0.35 }, uExposure: { value: Math.pow(2, 1.3) }, uContrast: { value: 1.14 }, uSat: { value: 0.72 },
    uFilter: { value: new THREE.Color().setRGB(.93, .97, 1, THREE.SRGBColorSpace) }, uWB: { value: new THREE.Vector3(.96, 1, 1.04) },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime,uVig,uVigSmooth,uChroma,uGrain,uExposure,uContrast,uSat;
    uniform vec3 uFilter,uWB; varying vec2 vUv;
    float hash(vec2 p){ p = fract(p*vec2(443.897,441.423)); p += dot(p,p+19.19); return fract(p.x*p.y); }
    const mat3 ACESIn = mat3(vec3(0.59719,0.07600,0.02840), vec3(0.35458,0.90834,0.13383), vec3(0.04823,0.01566,0.83777));
    const mat3 ACESOut = mat3(vec3(1.60475,-0.10208,-0.00327), vec3(-0.53108,1.10813,-0.07276), vec3(-0.07367,-0.00605,1.07602));
    vec3 aces(vec3 c){
      c *= 1.0/0.6; c = ACESIn*c;
      vec3 a = c*(c+0.0245786)-0.000090537, b = c*(0.983729*c+0.4329510)+0.238081;
      c = ACESOut*(a/b); return clamp(c,0.,1.);
    }
    void main(){
      vec2 coords = 2.0*vUv-1.0;
      vec2 end = vUv - coords*dot(coords,coords)*uChroma*0.05;
      vec3 col;
      vec3 acc = vec3(0.), wsum = vec3(0.);
      for(int i=0;i<5;i++){
        float t = float(i)/4.0;
        vec3 w = vec3(clamp(1.0-t*2.0,0.,1.), 1.0-abs(t*2.0-1.0), clamp(t*2.0-1.0,0.,1.));
        acc += texture2D(tDiffuse, mix(vUv,end,t)).rgb*w; wsum += w;
      }
      col = acc/wsum;
      // виньетка (до грейдинга, в HDR)
      vec2 d = abs(vUv-0.5)*uVig*2.0;
      col *= pow(clamp(1.0-dot(d,d),0.,1.), uVigSmooth*5.0);
      // цветокоррекция
      col *= uExposure*uWB*uFilter;
      float lum = dot(col, vec3(.2126,.7152,.0722));
      col = mix(vec3(lum), col, uSat);
      col = (col-0.18)*uContrast+0.18; col = max(col,0.);
      col = aces(col);
      // зерно
      float n = hash(gl_FragCoord.xy + fract(uTime)*vec2(113.,71.)) - 0.5;
      float l2 = dot(col, vec3(.2126,.7152,.0722));
      col += col*n*uGrain*0.55*(1.0-l2*0.6);
      gl_FragColor = vec4(col,1.);
      #include <colorspace_fragment>
    }`,
};

export function createPost(renderer, scene, camera, w, h, samples) {
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.9, 0.72, 0.9);
  composer.addPass(bloom);
  const fin = new ShaderPass(FinalShader);
  composer.addPass(fin);
  return { composer, bloom, fin, u: fin.uniforms };
}
