'use client';

import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Float, MeshReflectorMaterial, Sparkles, PositionalAudio } from '@react-three/drei';
import { useState, useEffect, Suspense } from 'react';

function NFTImage({ url, hovered, isSoldOut }) {
  const defaultImg = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop";
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url || defaultImg,
      (tex) => setTexture(tex),
      undefined,
      (err) => {
        console.warn("รูปภาพนี้ติดระบบป้องกัน CORS โหลดลง 3D ไม่ได้ เปลี่ยนเป็นรูปสำรองแทน:", err);
        loader.load(defaultImg, (fallbackTex) => setTexture(fallbackTex));
      }
    );
  }, [url]);

  if (!texture) return null;

  return (
    <group>
      <mesh position={[0, 0.2, 0.1]}>
        <planeGeometry args={[1.9, 2.1]} />
        <meshStandardMaterial 
          map={texture} 
          emissive={hovered && !isSoldOut ? "#ffffff" : "#000000"} 
          emissiveIntensity={0.15} 
          opacity={isSoldOut ? 0.3 : 1}
          transparent={true}
        />
      </mesh>
      {isSoldOut && (
        <Text position={[0, 0.2, 0.2]} fontSize={0.35} color="#ef4444" rotation={[0, 0, 0.2]} anchorX="center" anchorY="middle">
          SOLD OUT
        </Text>
      )}
    </group>
  );
}

function NFTFrame({ position, title, price, imageUrl, isSoldOut, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [lightTarget] = useState(() => new THREE.Object3D());

  return (
    <group position={position}>
      <primitive object={lightTarget} position={[0, 0, 0]} />

      <mesh position={[0, -2.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.8, 0.4, 32]} />
        <meshStandardMaterial color={hovered && !isSoldOut ? "#fbbf24" : "#1e293b"} metalness={0.6} roughness={0.4} />
      </mesh>

      <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.2}>
        <mesh 
          onPointerOver={() => setHovered(true)} 
          onPointerOut={() => setHovered(false)}
          onClick={isSoldOut ? null : onClick}
          castShadow
        >
          <boxGeometry args={[2.3, 2.9, 0.15]} />
          <meshStandardMaterial color={isSoldOut ? "#334155" : (hovered ? "#fbbf24" : "#0f172a")} roughness={0.2} metalness={0.8} />
        </mesh>

        <Suspense fallback={<Text position={[0, 0, 0.2]} fontSize={0.2} color="white">Loading...</Text>}>
          <NFTImage url={imageUrl} hovered={hovered} isSoldOut={isSoldOut} />
        </Suspense>

        <Text position={[0, -1.1, 0.15]} fontSize={0.18} color={isSoldOut ? "#94a3b8" : "#ffffff"} anchorX="center" anchorY="middle">
          {title}
        </Text>
        <Text position={[0, -1.35, 0.15]} fontSize={0.16} color={isSoldOut ? "#ef4444" : "#fbbf24"} anchorX="center" anchorY="middle">
          {isSoldOut ? "Owned" : `${price} GG`}
        </Text>
      </Float>

      {!isSoldOut && (
        <>
          <spotLight 
            position={[0, 3.5, 4.5]}
            target={lightTarget}
            angle={0.4}
            penumbra={0.5}
            intensity={hovered ? 600 : 200}
            color={hovered ? "#ffffff" : "#fef08a"} 
            distance={15}
            castShadow 
          />
          <pointLight
            position={[0, 0, 2]}
            intensity={hovered ? 30 : 10}
            distance={5}
            color="#ffffff"
          />
        </>
      )}

      {/* ลูกเล่น Spatial Audio: ใส่ไฟล์ audio/ambient.mp3 ไว้ในโฟลเดอร์ public เพื่อเปิดใช้งาน */}
      {/* <PositionalAudio url="/audio/ambient.mp3" distance={5} loop autoplay /> */}
    </group>
  );
}

export default function Gallery3D({ nfts, onSelectNFT }) {
  // สเตตสำหรับสลับโหมดแสงในหอศิลป์ (Classic / Daylight / Cyberpunk)
  const [theme, setTheme] = useState('classic');

  return (
    <div className="w-full h-[700px] bg-black rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl relative">
      
      {/* แผงปุ่มกดสลับธีมไฟมุมขวาบน */}
      <div className="absolute top-4 right-4 z-30 flex gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700 backdrop-blur-md">
        <button 
          onClick={() => setTheme('classic')} 
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${theme === 'classic' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          🌙 Classic
        </button>
        <button 
          onClick={() => setTheme('daylight')} 
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${theme === 'daylight' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          ☀️ Daylight
        </button>
        <button 
          onClick={() => setTheme('cyberpunk')} 
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${theme === 'cyberpunk' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          🌆 Cyberpunk
        </button>
      </div>

      <Canvas shadows camera={{ position: [0, 1.5, 9], fov: 50 }}>
        <color attach="background" args={[theme === 'daylight' ? '#1e293b' : '#050505']} />
        
        {/* 1. ระบบแสงเปลี่ยนตามธีม */}
        {theme === 'classic' && (
          <ambientLight intensity={0.15} />
        )}
        {theme === 'daylight' && (
          <>
            <ambientLight intensity={1.2} />
            <directionalLight position={[10, 20, 15]} intensity={1.5} />
          </>
        )}
        {theme === 'cyberpunk' && (
          <>
            <ambientLight intensity={0.1} />
            <pointLight position={[-15, 8, -2]} color="#ff007f" intensity={400} distance={30} />
            <pointLight position={[15, 8, -2]} color="#00f3ff" intensity={400} distance={30} />
          </>
        )}

        {/* 2. ละอองแสงฝุ่นลอยในอากาศ (Particles) */}
        <Sparkles 
          count={150} 
          scale={[nfts.length * 5, 12, 15]} 
          size={3.5} 
          speed={0.4} 
          color={theme === 'cyberpunk' ? "#00f3ff" : "#fbbf24"} 
          opacity={0.6} 
        />
        
        {/* ผนังด้านหลัง */}
        <mesh position={[0, 2, -3]} receiveShadow>
          <boxGeometry args={[100, 20, 1]} />
          <meshStandardMaterial color={theme === 'daylight' ? "#334155" : "#0f172a"} roughness={1} />
        </mesh>

        {/* พื้นสะท้อนเงา */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, 0]} receiveShadow>
          <planeGeometry args={[100, 60]} />
          <MeshReflectorMaterial
            blur={[400, 100]} resolution={1024} mirror={0.6} mixBlur={0.7} mixStrength={2}
            roughness={0.4} depthScale={1} minDepthThreshold={0.4} maxDepthThreshold={1.4}
            color="#050505" metalness={0.8}
          />
        </mesh>

        {/* แสดงรายการรูปภาพ */}
        {nfts.map((nft, index) => (
          <NFTFrame 
            key={nft.id}
            position={[(index - (nfts.length - 1) / 2) * 4.5, 0, 0]} 
            title={nft.name} 
            price={nft.price} 
            imageUrl={nft.imageUrl}
            isSoldOut={nft.isSoldOut}
            onClick={() => onSelectNFT(nft)} 
          />
        ))}

        <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 2 - 0.05} minDistance={4} maxDistance={20} />
      </Canvas>
    </div>
  );
}