"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Country, countries, latLngToVector3 } from '@/data/countries';
import { type MockDestination } from '@/data/mockDestinations';
import { CountryMarker } from './CountryMarker';
import { CountryLabel } from './CountryLabel';
import { ContinentLegend } from './ContinentLegend';

function findCountryByName(name: string): Country | undefined {
  if (!name) return undefined;
  const n = name.toLowerCase().trim();
  return (
    countries.find(c => c.name.toLowerCase() === n) ??
    countries.find(c => c.name.toLowerCase().includes(n)) ??
    countries.find(c => n.includes(c.name.toLowerCase()))
  );
}

function Globe({ onCountrySelect, selectedCountry, selectedDestination, destinationCountry, onDestinationClick }: {
  onCountrySelect: (country: Country | null) => void;
  selectedCountry: Country | null;
  selectedDestination: MockDestination | null;
  destinationCountry?: Country | null;
  onDestinationClick?: () => void;
}) {
  const globeRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<any>(null);
  const destinationDotRef = useRef<THREE.Mesh>(null);
  const destinationRingRef = useRef<THREE.Mesh>(null);
  const [hoveredCountry, setHoveredCountry] = useState<Country | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const lastInteractionRef = useRef(Date.now());
  const { camera } = useThree();
  
  const GLOBE_RADIUS = 2;
  const AUTO_ROTATE_SPEED = 0.001;
  const ZOOM_DURATION = 1500;
  const destinationPosition = useMemo(() => {
    if (!selectedDestination) return null;
    const { lat, lng } = selectedDestination.destination.coordinates;
    return latLngToVector3(lat, lng, GLOBE_RADIUS);
  }, [selectedDestination]);
  
  // Create grid lines for the globe
  const gridLines = useMemo(() => {
    const lines: { key: string; geometry: THREE.BufferGeometry }[] = [];
    
    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const points: THREE.Vector3[] = [];
      for (let lng = 0; lng <= 360; lng += 5) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = lng * (Math.PI / 180);
        const x = GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
        const y = GLOBE_RADIUS * Math.cos(phi);
        const z = GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      lines.push({ key: `lat-${lat}`, geometry });
    }
    
    // Longitude lines
    for (let lng = 0; lng < 360; lng += 30) {
      const points: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = lng * (Math.PI / 180);
        const x = GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
        const y = GLOBE_RADIUS * Math.cos(phi);
        const z = GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      lines.push({ key: `lng-${lng}`, geometry });
    }
    
    return lines;
  }, []);
  
  // Auto-rotation logic
  useFrame(() => {
    if (!globeRef.current || selectedCountry || selectedDestination) return;
    
    const timeSinceInteraction = Date.now() - lastInteractionRef.current;
    
    // Resume auto-rotation after 5 seconds of inactivity (only if no destination selected)
    if (!isInteracting && timeSinceInteraction > 5000 && !selectedDestination) {
      globeRef.current.rotation.y += AUTO_ROTATE_SPEED;
    }

    if (destinationDotRef.current && selectedDestination) {
      const t = performance.now() / 1000;
      const blink = Math.floor(t * 2.6) % 2 === 0;
      destinationDotRef.current.visible = blink;
      destinationDotRef.current.scale.setScalar(1.9 + Math.sin(t * 8) * 0.35);
    }

    if (destinationRingRef.current && selectedDestination) {
      const t = performance.now() / 1000;
      const ringScale = 1 + Math.abs(Math.sin(t * 2.4)) * 1.2;
      destinationRingRef.current.scale.setScalar(ringScale);
      (destinationRingRef.current.material as THREE.MeshBasicMaterial).opacity =
        Math.max(0, 0.82 - Math.abs(Math.sin(t * 2.4)) * 0.82);
    }
  });

  // Fonction réutilisable pour zoomer vers une position
  const zoomToCoordinates = useCallback((lat: number, lng: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const distance = 3.5;
    
    const targetX = -(distance * Math.sin(phi) * Math.cos(theta));
    const targetZ = distance * Math.sin(phi) * Math.sin(theta);
    const targetY = distance * Math.cos(phi);
    
    const startPosition = camera.position.clone();
    const startTime = Date.now();
    
    const animateZoom = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ZOOM_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      camera.position.x = startPosition.x + (targetX - startPosition.x) * eased;
      camera.position.y = startPosition.y + (targetY - startPosition.y) * eased;
      camera.position.z = startPosition.z + (targetZ - startPosition.z) * eased;
      camera.lookAt(0, 0, 0);
      
      if (progress < 1) {
        requestAnimationFrame(animateZoom);
      }
    };
    
    animateZoom();
  }, [camera]);

  // Zoomer automatiquement vers la destination sélectionnée (coordonnées exactes de la destination)
  useEffect(() => {
    if (selectedDestination) {
      const lat = selectedDestination.destination.coordinates.lat;
      const lng = selectedDestination.destination.coordinates.lng;
      zoomToCoordinates(lat, lng);
    }
  }, [selectedDestination, zoomToCoordinates]);
  
  const handleCountryClick = useCallback((country: Country) => {
    onCountrySelect(country);
    // If this is the recommended destination, re-open the panel
    if (destinationCountry && country.code === destinationCountry.code) {
      onDestinationClick?.();
    }
    
    // Calculate target camera position for zoom - using same formula as latLngToVector3
    const phi = (90 - country.lat) * (Math.PI / 180);
    const theta = (country.lng + 180) * (Math.PI / 180);
    const distance = 3.5;
    
    // Position camera in front of the country (exact same formula as latLngToVector3)
    const targetX = -(distance * Math.sin(phi) * Math.cos(theta));
    const targetZ = distance * Math.sin(phi) * Math.sin(theta);
    const targetY = distance * Math.cos(phi);
    
    // Animate camera
    const startPosition = camera.position.clone();
    const startTime = Date.now();
    
    const animateZoom = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ZOOM_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      
      camera.position.x = startPosition.x + (targetX - startPosition.x) * eased;
      camera.position.y = startPosition.y + (targetY - startPosition.y) * eased;
      camera.position.z = startPosition.z + (targetZ - startPosition.z) * eased;
      camera.lookAt(0, 0, 0);
      
      if (progress < 1) {
        requestAnimationFrame(animateZoom);
      }
    };
    
    animateZoom();
    
    // Auto-return after 4 seconds
    setTimeout(() => {
      onCountrySelect(null);
      
      // Animate back to original position
      const returnStartPosition = camera.position.clone();
      const returnStartTime = Date.now();
      const originalPosition = new THREE.Vector3(0, 0, 8);
      
      const animateReturn = () => {
        const elapsed = Date.now() - returnStartTime;
        const progress = Math.min(elapsed / ZOOM_DURATION, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        camera.position.x = returnStartPosition.x + (originalPosition.x - returnStartPosition.x) * eased;
        camera.position.y = returnStartPosition.y + (originalPosition.y - returnStartPosition.y) * eased;
        camera.position.z = returnStartPosition.z + (originalPosition.z - returnStartPosition.z) * eased;
        camera.lookAt(0, 0, 0);
        
        if (progress < 1) {
          requestAnimationFrame(animateReturn);
        }
      };
      
      animateReturn();
    }, 9000);
  }, [camera, onCountrySelect, destinationCountry, onDestinationClick]);
  
  return (
    <>
      <group ref={globeRef}>
        {/* Main globe sphere - dark ocean */}
        <Sphere args={[GLOBE_RADIUS, 64, 64]}>
          <meshPhongMaterial
            color="#001122"
            emissive="#001133"
            emissiveIntensity={0.2}
            transparent
            opacity={0.9}
            shininess={100}
          />
        </Sphere>
        
        {/* Grid lines */}
        {gridLines.map(({ key, geometry }) => (
          <line key={key}>
            <bufferGeometry attach="geometry" {...geometry} />
            <lineBasicMaterial color="#00aaff" transparent opacity={0.15} />
          </line>
        ))}
        
        {/* Glow layer */}
        <Sphere args={[GLOBE_RADIUS * 1.02, 64, 64]}>
          <meshBasicMaterial
            color="#00aaff"
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </Sphere>
        
        {/* Continent boundaries */}
        
        {/* Country markers */}
        {countries.map((country) => (
          <CountryMarker
            key={country.code}
            country={country}
            radius={GLOBE_RADIUS}
            isHovered={hoveredCountry?.code === country.code}
            isSelected={selectedCountry?.code === country.code}
            isDestination={false}
            onHover={setHoveredCountry}
            onClick={handleCountryClick}
          />
        ))}
      </group>
      {/* Destination marker at exact city coordinates */}
      {destinationPosition && (
        <group position={destinationPosition}>
          <mesh ref={destinationDotRef}>
            <sphereGeometry args={[0.031, 10, 10]} />
            <meshBasicMaterial color="#67e8f9" />
          </mesh>
          <mesh ref={destinationRingRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.12, 42]} />
            <meshBasicMaterial
              color="#4ecca3"
              transparent
              opacity={0.78}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
      
      {/* Orbit controls */}
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={12}
        rotateSpeed={0.5}
        onStart={() => {
          setIsInteracting(true);
        }}
        onEnd={() => {
          setIsInteracting(false);
          lastInteractionRef.current = Date.now();
        }}
      />
    </>
  );
}

interface GlobeSceneProps {
  onCountrySelect?: (country: Country | null) => void;
  selectedCountry?: Country | null;
  selectedDestination?: MockDestination | null;
  onMarkerClick?: () => void;
}

export function GlobeScene({ onCountrySelect, selectedCountry, selectedDestination, onMarkerClick }: GlobeSceneProps) {
  const [internalSelectedCountry, setInternalSelectedCountry] = useState<Country | null>(null);

  // Match the AI-recommended country to an existing globe marker by name
  const destinationCountry = useMemo(
    () => selectedDestination?.destination.country
      ? findCountryByName(selectedDestination.destination.country) ?? null
      : null,
    [selectedDestination?.destination.country]
  );

  const handleCountrySelect = (country: Country | null) => {
    setInternalSelectedCountry(country);
    onCountrySelect?.(country);
  };
  
  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0">
        {/* Radial glow in center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                        w-[600px] h-[600px] rounded-full
                        bg-cyan-500/5 blur-3xl pointer-events-none" />
        
        {/* Corner gradients */}
        <div className="absolute top-0 left-0 w-96 h-96 
                        bg-gradient-to-br from-blue-600/10 to-transparent blur-2xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 
                        bg-gradient-to-tl from-cyan-600/10 to-transparent blur-2xl" />
      </div>

      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        {/* Ambient light */}
        <ambientLight intensity={0.3} />
        
        {/* Main directional light */}
        <directionalLight position={[5, 3, 5]} intensity={0.8} color="#ffffff" />
        
        {/* Accent lights for glow effect */}
        <pointLight position={[-5, 0, 5]} intensity={0.5} color="#00aaff" />
        <pointLight position={[5, 0, -5]} intensity={0.3} color="#0066ff" />
        
        {/* Stars background */}
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
        
        {/* Globe — destination country marker blinks in teal */}
        <Globe 
          onCountrySelect={handleCountrySelect} 
          selectedCountry={selectedCountry ?? internalSelectedCountry}
          selectedDestination={selectedDestination ?? null}
          destinationCountry={destinationCountry}
          onDestinationClick={onMarkerClick}
        />
      </Canvas>
      
      {/* Country label overlay */}
      <CountryLabel country={selectedCountry ?? internalSelectedCountry} />
      
      {/* Continent legend - hidden */}
    </div>
  );
}

export default GlobeScene;
