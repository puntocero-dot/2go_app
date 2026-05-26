"use client";

import { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

/* ─── Animated Delivery Truck (low-poly, lightweight) ─── */
function DeliveryTruck() {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.position.x = Math.sin(t * 0.3) * 3;
    group.current.position.z = Math.cos(t * 0.3) * 2;
    group.current.position.y = Math.sin(t * 0.6) * 0.3;
    group.current.rotation.y = -t * 0.3 + Math.PI / 2;
  });

  return (
    <group ref={group} scale={0.35}>
      {/* Truck body */}
      <mesh>
        <boxGeometry args={[2, 1, 1]} />
        <meshStandardMaterial color="#0891b2" metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Cabin */}
      <mesh position={[1.2, 0.1, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.9]} />
        <meshStandardMaterial color="#06b6d4" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Wheels — 2 meshes with instanced positions instead of 4 separate */}
      {[[-0.5, -0.5, 0.55], [-0.5, -0.5, -0.55], [1, -0.5, 0.55], [1, -0.5, -0.55]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.1, 6]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
      ))}
    </group>
  );
}

/* ─── GPS Pin floating ─── */
function GpsPin({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 2 + position[0]) * 0.15;
  });

  return (
    <group ref={ref} position={position} scale={0.4}>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, -0.1, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.18, 0.5, 6]} />
        <meshBasicMaterial color="#dc2626" />
      </mesh>
    </group>
  );
}

/* ─── Furniture piece (simple Float, no wobble material) ─── */
function FurniturePiece({ position, color, size }: { position: [number, number, number]; color: string; size: [number, number, number] }) {
  return (
    <Float speed={1.5} rotationIntensity={0.6} floatIntensity={0.4}>
      <mesh position={position}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>
    </Float>
  );
}

/* ─── Central glowing orb (simple icosahedron, no distort) ─── */
function CentralOrb() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.x = t * 0.2;
    ref.current.rotation.z = t * 0.15;
    // Gentle scale pulse
    const s = 1.2 + Math.sin(t * 0.8) * 0.05;
    ref.current.scale.setScalar(s);
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#0891b2"
        emissive="#0ea5e9"
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.1}
        transparent
        opacity={0.7}
        wireframe
      />
    </mesh>
  );
}

/* ─── Particle Ring (single Points object, very lightweight) ─── */
function ParticleRing() {
  const ref = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const count = 200;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const cyan = new THREE.Color("#06b6d4");
    const blue = new THREE.Color("#3b82f6");
    const purple = new THREE.Color("#8b5cf6");
    const palette = [cyan, blue, purple];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 3.5 + Math.random() * 1.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      const c = palette[Math.floor(Math.random() * 3)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.05;
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

/* ─── Route Path (single TubeGeometry instead of 60 meshes) ─── */
function RoutePath() {
  const ref = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const t = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.sin(t) * 3 + Math.sin(t * 3) * 0.5,
        Math.cos(t * 2) * 0.3,
        Math.cos(t) * 2 + Math.cos(t * 2) * 0.5
      ));
    }
    const curve = new THREE.CatmullRomCurve3(points, true);
    return new THREE.TubeGeometry(curve, 64, 0.02, 4, true);
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.03;
  });

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} />
    </mesh>
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
      <RoutePath />

      <GpsPin position={[3, 0, 0]} />
      <GpsPin position={[-2.5, 0, 2]} />
      <GpsPin position={[-1, 0, -3]} />

      <FurniturePiece position={[-3.5, 1.5, -1]} color="#f59e0b" size={[0.6, 0.8, 0.4]} />
      <FurniturePiece position={[2.5, -1, 2]} color="#8b5cf6" size={[0.8, 0.5, 0.5]} />
      <FurniturePiece position={[0, 2, -2.5]} color="#10b981" size={[0.5, 0.7, 0.5]} />
    </>
  );
}

/* ─── Exported Component with WebGL error fallback ─── */
export default function HeroScene() {
  const [hasError, setHasError] = useState(false);

  // Detect WebGL support before even mounting Canvas
  const webglSupported = useMemo(() => {
    if (typeof window === "undefined") return true;
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch {
      return false;
    }
  }, []);

  const onCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    const canvas = gl.domElement;
    // Context loss: switch to CSS fallback
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      setHasError(true);
    });
  }, []);

  // CSS-only animated fallback when WebGL is unavailable or lost
  if (!webglSupported || hasError) {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-blue-500/15 to-cyan-500/15 blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 2, 7], fov: 50 }}
        dpr={[1, 1]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "low-power",
          // Removed failIfMajorPerformanceCaveat — caused silent failures
          // on integrated GPUs (Intel HD, mobile GPUs) returning null context
        }}
        frameloop="always"
        onCreated={onCreated}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
