"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Trail } from "@react-three/drei";
import * as THREE from "three";

/* ─── Animated Delivery Truck (low-poly box shape) ─── */
function DeliveryTruck() {
  const group = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    // Orbit path
    group.current.position.x = Math.sin(t * 0.3) * 3;
    group.current.position.z = Math.cos(t * 0.3) * 2;
    group.current.position.y = Math.sin(t * 0.6) * 0.3;
    group.current.rotation.y = -t * 0.3 + Math.PI / 2;
  });

  return (
    <group ref={group} scale={0.35}>
      <Trail
        width={1.5}
        length={8}
        color={new THREE.Color(0x06b6d4)}
        attenuation={(t) => t * t}
      >
        {/* Truck body */}
        <mesh ref={trailRef} castShadow>
          <boxGeometry args={[2, 1, 1]} />
          <meshStandardMaterial color="#0891b2" metalness={0.6} roughness={0.2} />
        </mesh>
      </Trail>
      {/* Cabin */}
      <mesh position={[1.2, 0.1, 0]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.9]} />
        <meshStandardMaterial color="#06b6d4" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Wheels */}
      {[[-0.5, -0.5, 0.55], [-0.5, -0.5, -0.55], [1, -0.5, 0.55], [1, -0.5, -0.55]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.1, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      ))}
    </group>
  );
}

/* ─── GPS Pin floating ─── */
function GpsPin({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.15;
  });

  return (
    <group ref={ref} position={position} scale={0.4}>
      {/* Pin head */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ef4444" metalness={0.4} roughness={0.3} emissive="#ef4444" emissiveIntensity={0.3} />
      </mesh>
      {/* Pin body */}
      <mesh position={[0, -0.1, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.18, 0.5, 8]} />
        <meshStandardMaterial color="#dc2626" metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Pulse ring */}
      <mesh position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.35, 16]} />
        <meshStandardMaterial color="#ef4444" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ─── Furniture piece (floating box / shelf) ─── */
function FurniturePiece({ position, color, size }: { position: [number, number, number]; color: string; size: [number, number, number] }) {
  return (
    <Float speed={1.5} rotationIntensity={0.8} floatIntensity={0.6} floatingRange={[-0.1, 0.1]}>
      <mesh position={position} castShadow>
        <boxGeometry args={size} />
        <MeshWobbleMaterial
          color={color}
          metalness={0.3}
          roughness={0.5}
          factor={0.15}
          speed={1}
        />
      </mesh>
    </Float>
  );
}

/* ─── Central glowing orb ─── */
function CentralOrb() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.2;
    ref.current.rotation.z = state.clock.elapsedTime * 0.15;
  });

  return (
    <mesh ref={ref} scale={1.2}>
      <icosahedronGeometry args={[1, 1]} />
      <MeshDistortMaterial
        color="#0891b2"
        emissive="#0ea5e9"
        emissiveIntensity={0.4}
        metalness={0.8}
        roughness={0.1}
        distort={0.3}
        speed={2}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

/* ─── Particle Ring ─── */
function ParticleRing() {
  const ref = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const count = 300;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const cyan = new THREE.Color("#06b6d4");
    const blue = new THREE.Color("#3b82f6");
    const purple = new THREE.Color("#8b5cf6");

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 3.5 + Math.random() * 1.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      const c = [cyan, blue, purple][Math.floor(Math.random() * 3)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.05;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} vertexColors transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

/* ─── Route Line (orbit ring of small spheres tracing a path) ─── */
function RouteLine() {
  const groupRef = useRef<THREE.Group>(null);

  const spheres = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 60; i++) {
      const t = (i / 60) * Math.PI * 2;
      pts.push([
        Math.sin(t) * 3 + Math.sin(t * 3) * 0.5,
        Math.cos(t * 2) * 0.3,
        Math.cos(t) * 2 + Math.cos(t * 2) * 0.5
      ]);
    }
    return pts;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.03;
  });

  return (
    <group ref={groupRef}>
      {spheres.map((pos, i) => (
        <mesh key={i} position={pos} scale={0.03}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.35 + (i / 60) * 0.3} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Main Scene ─── */
function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#e0f2fe" />
      <directionalLight position={[-5, 3, -5]} intensity={0.3} color="#8b5cf6" />
      <pointLight position={[0, 0, 0]} intensity={1} color="#06b6d4" distance={8} />

      <CentralOrb />
      <ParticleRing />
      <DeliveryTruck />
      <RouteLine />

      {/* GPS Pins at key points */}
      <GpsPin position={[3, 0, 0]} />
      <GpsPin position={[-2.5, 0, 2]} />
      <GpsPin position={[-1, 0, -3]} />

      {/* Floating furniture pieces */}
      <FurniturePiece position={[-3.5, 1.5, -1]} color="#f59e0b" size={[0.6, 0.8, 0.4]} />
      <FurniturePiece position={[2.5, -1, 2]} color="#8b5cf6" size={[0.8, 0.5, 0.5]} />
      <FurniturePiece position={[0, 2, -2.5]} color="#10b981" size={[0.5, 0.7, 0.5]} />
    </>
  );
}

/* ─── Exported Component ─── */
export default function HeroScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 2, 7], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
