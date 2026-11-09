import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  BloomEffect,
  Effect,
  EffectAttribute,
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
  BlendFunction,
} from 'postprocessing';

/**
 * Custom transition effect (GLSL): on every cut the frame warps through a
 * heat haze, splits into chromatic fringes and burns through orange to
 * near-black at the peak, so the hard scene switch underneath is never seen.
 * Reduced motion keeps only the dip to dark.
 */
const cutShader = /* glsl */ `
  uniform float uCut;
  uniform float uTime;
  uniform float uReduced;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float c = uCut;
    float m = c * (1.0 - uReduced);
    // heat-haze warp (sampled here: UV transforms can't mix with convolution)
    vec2 w = uv + vec2(
      sin(uv.y * 38.0 + uTime * 9.0),
      cos(uv.x * 31.0 - uTime * 7.0)
    ) * 0.006 * m;
    vec2 dir = (uv - 0.5) * 0.018 * m;
    vec3 col = vec3(
      texture2D(inputBuffer, w + dir).r,
      texture2D(inputBuffer, w).g,
      texture2D(inputBuffer, w - dir).b
    );
    float burn = smoothstep(0.25, 1.0, c);
    col = mix(col, vec3(1.0, 0.36, 0.08) * 0.9, burn * 0.45 * (1.0 - uReduced));
    col *= 1.0 - smoothstep(0.55, 1.0, c) * 0.92;
    outputColor = vec4(col, inputColor.a);
  }
`;

class CutEffect extends Effect {
  constructor() {
    super('CutEffect', cutShader, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map([
        ['uCut', new THREE.Uniform(0)],
        ['uTime', new THREE.Uniform(0)],
        ['uReduced', new THREE.Uniform(0)],
      ]),
    });
  }
}

/** pmndrs postprocessing pipeline; takes over rendering (useFrame priority 1). */
export default function PostFX({ seq, lowPower }) {
  const { gl, scene, camera, size } = useThree();
  const { composer, cut } = useMemo(() => {
    const c = new EffectComposer(gl, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: lowPower ? 0 : 4,
    });
    c.addPass(new RenderPass(scene, camera));
    const bloom = new BloomEffect({
      mipmapBlur: true,
      intensity: 1.1,
      luminanceThreshold: 0.55,
      luminanceSmoothing: 0.25,
      radius: 0.78,
    });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    const vignette = new VignetteEffect({ darkness: 0.62, offset: 0.26 });
    const noise = new NoiseEffect({ blendFunction: BlendFunction.SOFT_LIGHT, premultiply: true });
    noise.blendMode.opacity.value = 0.32;
    c.addPass(new EffectPass(camera, bloom, tone, vignette, noise));
    const cutFx = new CutEffect();
    c.addPass(new EffectPass(camera, cutFx));
    return { composer: c, cut: cutFx };
  }, [gl, scene, camera, lowPower]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size]);
  useEffect(() => () => composer.dispose(), [composer]);

  useFrame((_, dt) => {
    const u = cut.uniforms;
    u.get('uCut').value = seq.cut;
    u.get('uTime').value = seq.t;
    u.get('uReduced').value = seq.reduced ? 1 : 0;
    composer.render(dt);
  }, 1);

  return null;
}
