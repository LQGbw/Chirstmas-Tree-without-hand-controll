import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { damp } from 'maath/easing';

import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { Photos } from './Photos';
import { TopStar } from './TopStar';
import { ViewMode } from '../types';

interface SceneContentProps {
  scrollProgress: number; // 0 (Chaos) to 1 (Formed)
  viewMode: ViewMode;
  onStarClick: () => void;
}

// Camera control for zoom/shake only, rotation is now on the tree group
const CameraRig = ({ progress, viewMode }: { progress: number; viewMode: ViewMode }) => {
  const { camera, size } = useThree();
  const lookAtTarget = useRef(new THREE.Vector3(0, 1, 0));

  useFrame((state, delta) => {
    // Adaptive Positioning Logic
    const isMobile = size.width < 768;
    const isPortrait = size.width < size.height;
    
    // Base coordinates
    const baseZ = isMobile || isPortrait ? 35 : 26; 
    const baseY = 2; 
    const baseX = 0;

    // Shake in Chaos
    const chaos = 1 - progress;
    const shakeX = Math.sin(state.clock.elapsedTime * 3) * chaos * 0.3;
    const shakeY = Math.cos(state.clock.elapsedTime * 2) * chaos * 0.3;

    let targetPos = new THREE.Vector3();
    let targetLookAt = new THREE.Vector3();

    if (viewMode === 'topDown') {
        // Zoomed in from top
        // Tree height is ~14, so Y=15 puts camera very close to the star (top is ~7)
        // Adjusted to Y=16 for a nice magnified top-down view covering the upper section
        targetPos.set(0, 16, 0.1); 
        targetLookAt.set(0, 0, 0);
    } else {
        // Default View
        targetPos.set(
            baseX + shakeX,
            baseY + shakeY,
            baseZ + (chaos * 8)
        );
        targetLookAt.set(0, 1, 0);
        targetLookAt.x += Math.sin(state.clock.elapsedTime) * chaos * 2;
    }

    // Smoothly interpolate Position
    damp(camera.position, 'x', targetPos.x, 0.6, delta);
    damp(camera.position, 'y', targetPos.y, 0.6, delta);
    damp(camera.position, 'z', targetPos.z, 0.6, delta);

    // Smoothly interpolate LookAt
    damp(lookAtTarget.current, 'x', targetLookAt.x, 0.6, delta);
    damp(lookAtTarget.current, 'y', targetLookAt.y, 0.6, delta);
    damp(lookAtTarget.current, 'z', targetLookAt.z, 0.6, delta);

    camera.lookAt(lookAtTarget.current);
  });

  return null;
};

const TreeGroup = ({ progress, onStarClick }: { progress: number; onStarClick: () => void }) => {
    const groupRef = useRef<THREE.Group>(null);
    const { pointer } = useThree();
    const isPointerDown = useRef(false);

    useEffect(() => {
        const handleDown = () => { isPointerDown.current = true; };
        const handleUp = () => { isPointerDown.current = false; };
        
        // Listen globally to catch interaction even if outside mesh
        window.addEventListener('mousedown', handleDown);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchstart', handleDown);
        window.addEventListener('touchend', handleUp);
        
        return () => {
            window.removeEventListener('mousedown', handleDown);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchstart', handleDown);
            window.removeEventListener('touchend', handleUp);
        };
    }, []);

    useFrame((_, delta) => {
        if (!groupRef.current) return;

        // Rotation Logic:
        // If holding mouse on right side (pointer.x > 0), tree rotates Left (CCW, +Y)
        // If holding mouse on left side (pointer.x < 0), tree rotates Right (CW, -Y)
        if (isPointerDown.current) {
            const threshold = 0.1;
            const speed = 2.0 * delta;
            
            if (pointer.x > threshold) {
                groupRef.current.rotation.y += speed * Math.abs(pointer.x);
            } else if (pointer.x < -threshold) {
                groupRef.current.rotation.y -= speed * Math.abs(pointer.x);
            }
        }
        
        // Auto-rotation idle drift
        if (!isPointerDown.current) {
             groupRef.current.rotation.y += delta * 0.05;
        }
    });

    return (
        <group ref={groupRef}>
            <Foliage targetProgress={progress} />
            <Ornaments targetProgress={progress} />
            <Photos targetProgress={progress} />
            <TopStar targetProgress={progress} onClick={onStarClick} />
        </group>
    );
}

const SceneContent: React.FC<SceneContentProps> = ({ scrollProgress, viewMode, onStarClick }) => {
  return (
    <>
      <CameraRig progress={scrollProgress} viewMode={viewMode} />

      <Environment preset="city" />
      
      {/* Dramatic Lighting */}
      <ambientLight intensity={0.2} color="#001a0f" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={20} 
        color="#fff5cc" 
        castShadow 
      />
      <pointLight position={[-10, 5, -5]} intensity={5} color="#004225" distance={30} />
      <pointLight position={[0, -5, 10]} intensity={2} color="#d4af37" distance={20} />

      <TreeGroup progress={scrollProgress} onStarClick={onStarClick} />

      {/* Background Ambience */}
      <Stars radius={80} depth={40} count={3000} factor={4} saturation={0} fade speed={0.5} />
    </>
  );
};

export const Experience: React.FC<SceneContentProps> = (props) => {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]} 
      camera={{ position: [0, 4, 30], fov: 40 }}
      gl={{ 
        antialias: false, 
        toneMapping: THREE.ACESFilmicToneMapping, 
        toneMappingExposure: 1.2,
        powerPreference: "high-performance"
      }}
    >
      <SceneContent {...props} />
      
      <EffectComposer enableNormalPass={false}>
        <Bloom 
            luminanceThreshold={0.65} 
            mipmapBlur 
            intensity={1.5} 
            radius={0.7}
        />
        <Vignette eskil={false} offset={0.2} darkness={0.6} />
        <Noise opacity={0.05} /> 
      </EffectComposer>
    </Canvas>
  );
};