import * as THREE from 'three';

/**
 * Light trails: thin tubes on tilted orbits around the stage. A GLSL shader
 * sends a bright comet head with a long fading tail along each tube, in
 * burnt orange → red, additive + un-tonemapped so it blooms.
 *
 * update(time, intensity)
 */
export function createLightTrails({ center = new THREE.Vector3(0, 5.9, 0) } = {}) {
  const group = new THREE.Group();
  group.name = 'lightTrails';
  group.position.copy(center);

  const defs = [
    { r: 8.5, tiltX: 1.15, tiltZ: 0.25, speed: 0.11, offset: 0.0, width: 0.035, color: '#ff7a2a' },
    { r: 10.5, tiltX: 1.3, tiltZ: -0.45, speed: 0.08, offset: 0.4, width: 0.028, color: '#ff4a1a' },
    { r: 7.2, tiltX: 0.95, tiltZ: 0.7, speed: 0.14, offset: 0.7, width: 0.022, color: '#ffb066' },
  ];

  const materials = [];
  for (const d of defs) {
    const pts = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      // Slightly elliptical, wobbling orbit.
      pts.push(new THREE.Vector3(Math.cos(a) * d.r, Math.sin(a * 2) * 0.6, Math.sin(a) * d.r * 0.85));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    const geo = new THREE.TubeGeometry(curve, 360, d.width, 6, true);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uSpeed: { value: d.speed },
        uOffset: { value: d.offset },
        uColor: { value: new THREE.Color(d.color) },
      },
      vertexShader: /* glsl */ `
        varying float vU;
        void main() {
          vU = uv.x;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime, uIntensity, uSpeed, uOffset;
        uniform vec3 uColor;
        varying float vU;
        void main() {
          float head = fract(uTime * uSpeed + uOffset);
          float d = fract(head - vU);              // distance behind the head
          float tail = pow(1.0 - d, 9.0);          // long fading tail
          float tip = smoothstep(0.012, 0.0, d);   // hot head
          float a = (tail + tip * 2.5) * uIntensity;
          gl_FragColor = vec4(uColor * (1.4 + tip * 4.0) * a, a);
        }
      `,
    });
    materials.push(mat);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.set(d.tiltX, 0, d.tiltZ);
    mesh.frustumCulled = false;
    mesh.renderOrder = 6;
    group.add(mesh);
  }

  return {
    object: group,
    update(time, intensity) {
      for (const m of materials) {
        m.uniforms.uTime.value = time;
        m.uniforms.uIntensity.value = intensity;
      }
      group.visible = intensity > 0.005;
      group.rotation.y = time * 0.05;
    },
  };
}
