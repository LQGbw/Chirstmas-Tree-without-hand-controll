import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { damp } from 'maath/easing';
import { ORNAMENT_COUNT, getRandomSpherePoint, getTreePoint, lerp } from '../constants';
import { TREE_COLORS } from '../types';

interface OrnamentData {
  chaosPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  color: THREE.Color;
  speedOffset: number; // Multiplier for speed
  phaseOffset: number; // For floating animation
}

interface OrnamentsProps {
  targetProgress: number;
}

export const Ornaments: React.FC<OrnamentsProps> = ({ targetProgress }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const currentProgress = useRef(0);

  const data = useMemo<OrnamentData[]>(() => {
    const items: OrnamentData[] = [];
    const colors = [
      new THREE.Color(TREE_COLORS.GOLD).multiplyScalar(1.5), // Boost for bloom
      new THREE.Color(TREE_COLORS.RIBBON_RED),
      new THREE.Color(TREE_COLORS.SHIMMER),
      new THREE.Color(0.8, 0.8, 0.9), // Silver/Diamond
    ];

    for (let i = 0; i < ORNAMENT_COUNT; i++) {
      const heightRatio = Math.random();
      const angle = Math.random() * Math.PI * 2;
      // Fixed: Reduced radius ratio from 1.05 to variable 0.85-0.95 
      // This ensures ornaments are nested inside the foliage (which extends up to ~1.3)
      const radiusJitter = 0.85 + Math.random() * 0.1;
      const [tx, ty, tz] = getTreePoint(heightRatio, angle, radiusJitter);
      const [cx, cy, cz] = getRandomSpherePoint(25);

      items.push({
        chaosPos: new THREE.Vector3(cx, cy, cz),
        targetPos: new THREE.Vector3(tx, ty, tz),
        color: colors[Math.floor(Math.random() * colors.length)],
        speedOffset: 0.2 + Math.random() * 0.8,
        phaseOffset: Math.random() * Math.PI * 2
      });
    }
    return items;
  }, []);

  useLayoutEffect(() => {
    if (meshRef.current) {
      data.forEach((d, i) => {
        meshRef.current!.setColorAt(i, d.color);
      });
      meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [data]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Global smooth progress
    damp(currentProgress, 'current', targetProgress, 0.8, delta);
    const globP = currentProgress.current;

    data.forEach((d, i) => {
      // Individual lag based on speedOffset
      const t = THREE.MathUtils.clamp(globP * (0.5 + d.speedOffset), 0, 1);
      
      // Custom ease
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      // Position
      tempObject.position.lerpVectors(d.chaosPos, d.targetPos, eased);
      
      // Float effect when in Chaos
      if (globP < 0.9) {
          const floatY = Math.sin(state.clock.elapsedTime + d.phaseOffset) * (1 - eased) * 0.5;
          tempObject.position.y += floatY;
      }

      // Scale: Chaos = Big balls, Tree = Elegant sizes
      const scale = lerp(0.6, 0.25, eased); 
      tempObject.scale.setScalar(scale);
      
      // Rotation
      tempObject.rotation.x = eased * Math.PI * 2 + state.clock.elapsedTime * 0.5 * (1-eased);
      tempObject.rotation.y = eased * Math.PI;

      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, ORNAMENT_COUNT]} castShadow receiveShadow>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial 
        metalness={1} 
        roughness={0.15} 
        envMapIntensity={3} 
      />
    </instancedMesh>
  );
};
