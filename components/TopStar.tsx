import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { damp } from 'maath/easing';
import { getRandomSpherePoint, TREE_HEIGHT } from '../constants';

interface TopStarProps {
    targetProgress: number;
    onClick: () => void;
}

export const TopStar = ({ targetProgress, onClick }: TopStarProps) => {
    const ref = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    
    // Create a 5-pointed star shape
    const starGeo = useMemo(() => {
        const shape = new THREE.Shape();
        const outer = 0.9;
        const inner = 0.4;
        const points = 5;
        for(let i=0; i<points * 2; i++){
            const r = i%2===0? outer : inner;
            const a = (i / (points * 2)) * Math.PI * 2 - (Math.PI / 2); // Start at top
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if(i===0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
        
        const extrudeSettings = { 
            depth: 0.2, 
            bevelEnabled: true, 
            bevelThickness: 0.1, 
            bevelSize: 0.05, 
            bevelSegments: 2 
        };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geo.center();
        return geo;
    }, []);

    const targetPos = new THREE.Vector3(0, TREE_HEIGHT/2 + 0.2, 0); 
    const chaosPos = useMemo(() => {
        const p = getRandomSpherePoint(15);
        return new THREE.Vector3(...p);
    }, []);

    const currentProgress = useRef(0);

    useFrame((state, delta) => {
        if(!ref.current) return;
        damp(currentProgress, 'current', targetProgress, 0.6, delta);
        const p = currentProgress.current;

        // Position
        ref.current.position.lerpVectors(chaosPos, targetPos, p);
        
        // Rotation
        // Spin continuously
        ref.current.rotation.y += delta * 1.5;
        
        // Chaos tumble
        if(p < 0.9) {
            ref.current.rotation.x = Math.sin(state.clock.elapsedTime) * (1-p);
            ref.current.rotation.z = Math.cos(state.clock.elapsedTime) * (1-p);
        } else {
             ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, 0, delta * 2);
             ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, 0, delta * 2);
        }
        
        // Scale
        const scaleBase = THREE.MathUtils.lerp(0.1, 1.2, p);
        const scaleHover = hovered ? 1.4 : 1.0;
        ref.current.scale.setScalar(scaleBase * scaleHover);
    });

    return (
        <group 
            ref={ref}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
        >
             <mesh geometry={starGeo}>
                 <meshStandardMaterial 
                    color={hovered ? "#ffffff" : "#e0e0e0"} 
                    emissive={hovered ? "#ffffee" : "#ffffff"}
                    emissiveIntensity={hovered ? 1.5 : 0.8}
                    metalness={1}
                    roughness={0.05}
                 />
             </mesh>
             <pointLight distance={15} intensity={5} color="#ffffff" decay={2} />
        </group>
    )
}