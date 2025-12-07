import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import * as THREE from 'three';
import { damp } from 'maath/easing';
import { PHOTO_COUNT, getRandomSpherePoint, getTreePoint, lerp } from '../constants';

interface PhotoProps {
  targetProgress: number;
}

const Polaroid = ({ 
  globalProgress, 
  targetPos, 
  chaosPos, 
  id 
}: { 
  globalProgress: number; 
  targetPos: THREE.Vector3; 
  chaosPos: THREE.Vector3; 
  id: number;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  // Using picsum with specific dimensions to match polaroid aspect ratio nicely
  const imageUrl = `https://picsum.photos/id/${id + 50}/300/300`;
  
  const rotOffset = useMemo(() => new THREE.Vector3(
    Math.random() - 0.5, 
    Math.random() - 0.5, 
    Math.random() - 0.5
  ), []);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Slower transition for photos ("Feather" weight)
    const t = globalProgress;
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    // Position
    groupRef.current.position.lerpVectors(chaosPos, targetPos, eased);
    
    // Rotation logic
    if (globalProgress > 0.8) {
       // Look outward from tree center
       groupRef.current.lookAt(0, targetPos.y, 0);
       // Flip 180 because LookAt points +Z usually
       groupRef.current.rotateY(Math.PI);
       // Add aesthetic tilt
       groupRef.current.rotateX(-0.1); 
       // Slight sway
       groupRef.current.rotation.z += Math.sin(state.clock.elapsedTime + id) * 0.05;
    } else {
       // Tumble in chaos
       groupRef.current.rotation.set(
           rotOffset.x * 10 + state.clock.elapsedTime * 0.2,
           rotOffset.y * 10 + state.clock.elapsedTime * 0.1,
           rotOffset.z * 10
       );
    }
    
    // Scale - make them slightly larger to be visible as Polaroids
    const scale = lerp(2.0, 1.4, eased);
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef}>
      {/* Polaroid Paper Body */}
      {/* Dimensions roughly mimic Polaroid: 3.5x4.2 ratio */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[1, 1.25, 0.02]} /> 
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      
      {/* Photo Area - Shifted up to create the iconic thick bottom chin */}
      <Image 
        url={imageUrl} 
        position={[0, 0.15, 0.01]} 
        scale={[0.85, 0.85]} 
        transparent 
      />
      
      {/* Glossy coat over the photo area */}
      <mesh position={[0, 0.15, 0.015]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshPhysicalMaterial 
            transmission={0.1} 
            roughness={0.1} 
            transparent 
            opacity={0.15}
            specularIntensity={1}
            clearcoat={1}
        />
      </mesh>
      
      {/* Back of the photo (black/dark grey) */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[1, 1.25]} />
        <meshStandardMaterial color="#1a1a1a" roughness={1} />
      </mesh>
    </group>
  );
};

export const Photos: React.FC<PhotoProps> = ({ targetProgress }) => {
  const currentProgress = useRef(0);
  
  const items = useMemo(() => {
    const _items = [];
    for (let i = 0; i < PHOTO_COUNT; i++) {
      const heightRatio = 0.15 + Math.random() * 0.6; 
      const angle = Math.random() * Math.PI * 2;
      
      const [tx, ty, tz] = getTreePoint(heightRatio, angle, 1.25); // Slightly pushed out
      const [cx, cy, cz] = getRandomSpherePoint(22);

      _items.push({
        id: i,
        targetPos: new THREE.Vector3(tx, ty, tz),
        chaosPos: new THREE.Vector3(cx, cy, cz),
      });
    }
    return _items;
  }, []);

  useFrame((_, delta) => {
      // Photos follow slightly slower
      damp(currentProgress, 'current', targetProgress, 1.2, delta);
  });

  return (
    <group>
      {items.map((item) => (
        <Polaroid 
          key={item.id} 
          id={item.id}
          globalProgress={targetProgress} 
          targetPos={item.targetPos} 
          chaosPos={item.chaosPos} 
        />
      ))}
    </group>
  );
};