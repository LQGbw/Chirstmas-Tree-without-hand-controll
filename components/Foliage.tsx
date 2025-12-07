import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { damp } from 'maath/easing';
import { FOLIAGE_COUNT, getRandomSpherePoint, getTreePoint } from '../constants';
import { TREE_COLORS } from '../types';

const FoliageMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColor: { value: new THREE.Color(TREE_COLORS.EMERALD) },
    uGold: { value: new THREE.Color(TREE_COLORS.GOLD) }
  },
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    attribute vec3 aChaosPos;
    attribute float aRandom;
    varying float vRandom;
    varying vec3 vPos;

    void main() {
      vRandom = aRandom;
      vec3 finalPos = mix(aChaosPos, position, uProgress);
      // Wind/Breathing
      float wind = sin(uTime * 1.5 + finalPos.y * 0.3) * 0.15 * (1.0 - uProgress * 0.9);
      finalPos.x += wind;
      finalPos.z += cos(uTime * 1.2 + finalPos.y * 0.3) * 0.15 * (1.0 - uProgress * 0.9);
      
      vPos = finalPos;
      vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
      gl_PointSize = (5.0 * aRandom + 2.0) * (30.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform vec3 uGold;
    varying float vRandom;
    varying vec3 vPos;

    void main() {
      if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.5) discard;
      vec3 finalColor = uColor;
      if (vRandom > 0.92) finalColor = uGold; // Gold tips
      
      // Gradient based on height for richness
      finalColor *= 0.6 + 0.6 * smoothstep(-5.0, 10.0, vPos.y);

      // Bloom boost
      if (vRandom > 0.92) finalColor *= 2.0; 

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

interface FoliageProps {
  targetProgress: number; // Renamed to indicate it's the target
}

export const Foliage: React.FC<FoliageProps> = ({ targetProgress }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const currentProgress = useRef(0);

  const { positions, chaosPositions, randoms } = useMemo(() => {
    const pos = new Float32Array(FOLIAGE_COUNT * 3);
    const chaos = new Float32Array(FOLIAGE_COUNT * 3);
    const rands = new Float32Array(FOLIAGE_COUNT);

    for (let i = 0; i < FOLIAGE_COUNT; i++) {
      const ratio = i / FOLIAGE_COUNT;
      const angle = ratio * Math.PI * 60; 
      const radiusJitter = 0.7 + Math.random() * 0.6; 
      const [tx, ty, tz] = getTreePoint(ratio, angle, radiusJitter);
      pos.set([tx, ty, tz], i * 3);

      const [cx, cy, cz] = getRandomSpherePoint(25); // Large chaos radius
      chaos.set([cx, cy, cz], i * 3);
      rands[i] = Math.random();
    }
    return { positions: pos, chaosPositions: chaos, randoms: rands };
  }, []);

  useFrame((state, delta) => {
    if (materialRef.current) {
      // Smooth internal progress
      damp(currentProgress, 'current', targetProgress, 0.5, delta);
      
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uProgress.value = currentProgress.current;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aChaosPos" count={chaosPositions.length / 3} array={chaosPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={randoms.length} array={randoms} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        args={[FoliageMaterial]}
        transparent={true}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
};
