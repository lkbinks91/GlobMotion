import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Country, latLngToVector3 } from '@/data/countries';
import { getColorForCountry } from '@/data/continents';

interface CountryMarkerProps {
  country: Country;
  radius: number;
  isHovered: boolean;
  isSelected: boolean;
  isDestination?: boolean;
  onHover: (country: Country | null) => void;
  onClick: (country: Country) => void;
}

export function CountryMarker({ 
  country, 
  radius, 
  isHovered, 
  isSelected,
  isDestination,
  onHover, 
  onClick 
}: CountryMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const destRingRef = useRef<THREE.Mesh>(null);
  
  const position = useMemo(() => {
    return latLngToVector3(country.lat, country.lng, radius);
  }, [country.lat, country.lng, radius]);

  const continentColors = useMemo(() => {
    return getColorForCountry(country.code);
  }, [country.code]);
  
  useFrame((state) => {
    if (meshRef.current) {
      if (isDestination) {
        // Blink: toggle visibility ~2.5 times per second
        meshRef.current.visible = Math.floor(state.clock.elapsedTime * 2.5) % 2 === 0;
        meshRef.current.scale.setScalar(2.2 + Math.sin(state.clock.elapsedTime * 8) * 0.4);
      } else {
        meshRef.current.visible = true;
        const scale = isHovered || isSelected 
          ? 1.5 + Math.sin(state.clock.elapsedTime * 4) * 0.2
          : 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        meshRef.current.scale.setScalar(scale);
      }
    }
    
    if (glowRef.current) {
      const intensity = isDestination
        ? Math.abs(Math.sin(state.clock.elapsedTime * 5)) * 0.9
        : isHovered || isSelected ? 0.8 : 0.3;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = intensity;
    }

    if (destRingRef.current) {
      const t = state.clock.elapsedTime;
      // Expanding ring that fades out as it grows
      const ringScale = 1 + Math.abs(Math.sin(t * 2.5)) * 1.2;
      destRingRef.current.scale.setScalar(ringScale);
      (destRingRef.current.material as THREE.MeshBasicMaterial).opacity =
        Math.max(0, 0.85 - Math.abs(Math.sin(t * 2.5)) * 0.85);
    }
  });
  
  const markerColor = isDestination
    ? '#4ecca3'
    : isSelected 
      ? '#ffffff' 
      : continentColors.color;
  
  const markerSize = isDestination ? 0.028 : isSelected ? 0.025 : isHovered ? 0.02 : 0.015;
  
  return (
    <group position={position}>
      {/* Main marker point */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(country);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(country);
        }}
      >
        <sphereGeometry args={[markerSize, 8, 8]} />
        <meshBasicMaterial color={markerColor} />
      </mesh>
      
      {/* Glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[markerSize * 2.5, 8, 8]} />
        <meshBasicMaterial 
          color={isDestination ? '#4ecca3' : continentColors.glowColor} 
          transparent 
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Expanding pulse ring for destination */}
      {isDestination && (
        <mesh ref={destRingRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[markerSize * 3, markerSize * 4.5, 32]} />
          <meshBasicMaterial 
            color="#4ecca3" 
            transparent 
            opacity={0.8}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
      
      {/* Outer ring for selected/hovered (non-destination) */}
      {(isHovered || isSelected) && !isDestination && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[markerSize * 3, markerSize * 4, 32]} />
          <meshBasicMaterial 
            color={continentColors.color} 
            transparent 
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
