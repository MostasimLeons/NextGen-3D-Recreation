import * as THREE from 'three';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  NoiseEffect,
  VignetteEffect,
  ToneMappingEffect,
  ToneMappingMode,
  BlendFunction,
} from 'postprocessing';

/**
 * Cinematic post chain (pmndrs `postprocessing`, the engine behind
 * @react-three/postprocessing): HDR render → mipmap bloom (only bright,
 * emissive things — embers, trails, LEDs — cross the threshold) →
 * ACES tone mapping → soft vignette → film grain.
 */
export function createPost(renderer, scene, camera, { lowPower = false } = {}) {
  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType,
    multisampling: lowPower ? 0 : 4,
  });
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new BloomEffect({
    mipmapBlur: true,
    luminanceThreshold: 0.92,
    luminanceSmoothing: 0.2,
    intensity: 0.9,
    radius: 0.72,
  });
  const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
  const vignette = new VignetteEffect({ offset: 0.32, darkness: 0.42 });
  const grain = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: false });
  grain.blendMode.opacity.value = 0.07;

  composer.addPass(new EffectPass(camera, bloom, tone, vignette, grain));

  return {
    composer,
    bloom,
    setSize: (w, h) => composer.setSize(w, h, false),
    render: (dt) => composer.render(dt),
    dispose: () => composer.dispose(),
  };
}
