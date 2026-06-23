"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Float, Text, Billboard, Image } from "@react-three/drei";
import React, { Suspense, useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { useRouter } from "next/navigation";

type MiniGameId = "swipe-game" | "bill-rush" | "savings-lab";

type MiniGame = {
  id: MiniGameId;
  title: string;
  description: string;
  position: [number, number, number];
  accentColor: string;
  shortLabel: string;
};

type Vec3 = { x: number; y: number; z: number };

const MINI_GAMES: MiniGame[] = [
  {
    id: "swipe-game",
    title: "Swipe Game",
    shortLabel: "Swipe",
    description:
      "Swipe les cartes de dépenses à gauche ou à droite pour décider quoi accepter, refuser ou épargner, et vois l'impact sur ton objectif du mois.",
    position: [-3, 1.4, -4.6],
    accentColor: "#38bdf8",
  },
  {
    id: "bill-rush",
    title: "Bill Rush",
    shortLabel: "Rush",
    description:
      "Cours dans ton mois : récupère tes revenus, choisis quelles factures payer, et décide quand dire oui aux tentations ou investir sur toi.",
    position: [0, 1.4, -4.6],
    accentColor: "#f97316",
  },
  {
    id: "savings-lab",
    title: "Savings Lab",
    shortLabel: "Savings Lab",
    description:
      "Répartis une somme entre sécurité, projets, long terme et plaisir selon différents scénarios de vie, et vois ce que ça raconte de tes priorités.",
    position: [3, 1.4, -4.6],
    accentColor: "#22c55e",
  },
];

function distance3D(a: Vec3, b: [number, number, number]) {
  const dx = a.x - b[0];
  const dy = a.y - b[1];
  const dz = a.z - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function Player({
  onMove,
  virtualDirection,
}: {
  onMove?: (position: Vec3) => void;
  virtualDirection?: { x: number; z: number } | null;
}) {
  const ref = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const [showBubble, setShowBubble] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useFrame = (require("@react-three/fiber") as any).useFrame;

  useFrame((state: any, delta: number) => {
    const mesh = ref.current;
    if (!mesh) return;

    const SPEED = 0.08;
    const t = state.clock.getElapsedTime();
    const baseY = 0.6;
    const amplitude = 0.08;
    mesh.position.y = baseY + Math.sin(t * 3) * amplitude;

    const moveXKeyboard =
      (keys.current["KeyD"] || keys.current["ArrowRight"] ? 1 : 0) -
      (keys.current["KeyA"] || keys.current["ArrowLeft"] ? 1 : 0);
    const moveZKeyboard =
      (keys.current["KeyS"] || keys.current["ArrowDown"] ? 1 : 0) -
      (keys.current["KeyW"] || keys.current["ArrowUp"] ? 1 : 0);

    const moveXJoystick = virtualDirection?.x ?? 0;
    const moveZJoystick = virtualDirection?.z ?? 0;
    const moveX = moveXKeyboard + moveXJoystick;
    const moveZ = moveZKeyboard + moveZJoystick;

    if (moveX !== 0 || moveZ !== 0) {
      const dir = new THREE.Vector3(moveX, 0, moveZ).normalize().multiplyScalar(SPEED);
      mesh.position.add(dir);
      mesh.position.x = THREE.MathUtils.clamp(mesh.position.x, -4.2, 4.2);
      mesh.position.z = THREE.MathUtils.clamp(mesh.position.z, -1.5, 0.5);
      mesh.rotation.y = Math.atan2(dir.x, dir.z);
    }

    onMove?.({ x: mesh.position.x, y: mesh.position.y, z: mesh.position.z });
  });

  return (
    <group ref={ref} position={[0, 0.6, 0]}>
      <Float speed={2} floatIntensity={0.5} rotationIntensity={0.2}>
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          <group>
            <Image
              url={isBlinking ? "/icons/fineatalk.png" : "/icons/fineamascotte.png"}
              transparent
              toneMapped={false}
              scale={1.1}
              onClick={() => {
                setShowBubble(prev => !prev);
                setIsBlinking(true);
                setTimeout(() => setIsBlinking(false), 150);
              }}
            />
            {showBubble && (
              <Html position={[0.08, 0.87, 0]}>
                <div className="rounded-lg bg-black/80 border border-white/20 px-3 py-[3px] text-[10px] leading-tight text-slate-100 shadow-sm whitespace-nowrap">
                  Quel mini-jeu je démarre ?
                </div>
              </Html>
            )}
          </group>
        </Billboard>
      </Float>
      <mesh position={[0, -0.55, 0]} receiveShadow rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.6, 32]} />
        <meshStandardMaterial color="#eccc68" opacity={0.3} transparent />
      </mesh>
    </group>
  );
}

function FloorAndWalls() {
  return (
    <group>
      {/* Sol */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#111827" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Mur du fond */}
      <mesh position={[0, 2, -5]} receiveShadow>
        <boxGeometry args={[12, 4, 0.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Murs latéraux */}
      <mesh position={[-6, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[8, 4, 0.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[6, 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[8, 4, 0.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Plinthes */}
      <mesh position={[0, 0.15, -4.9]} receiveShadow>
        <boxGeometry args={[12, 0.3, 0.1]} />
        <meshStandardMaterial color="#111827" roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[-5.95, 0.15, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[8, 0.3, 0.1]} />
        <meshStandardMaterial color="#111827" roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[5.95, 0.15, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[8, 0.3, 0.1]} />
        <meshStandardMaterial color="#111827" roughness={0.35} metalness={0.2} />
      </mesh>
    </group>
  );
}

function GamePortal({ game, isNearby, onSelect }: {
  game: MiniGame; isNearby: boolean; onSelect: (id: MiniGameId) => void;
}) {
  return (
    <group position={game.position} onClick={() => onSelect(game.id)}>
      <mesh castShadow>
        <boxGeometry args={[2.2, 1.4, 0.2]} />
        <meshStandardMaterial color="#020617" metalness={0.6} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <planeGeometry args={[2.1, 1.3]} />
        <meshBasicMaterial color={game.accentColor} transparent opacity={0.4} />
      </mesh>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
        <Text position={[0, 0.25, 0.16]} fontSize={0.24} color="#e5e7eb" anchorX="center" anchorY="middle">
          {game.shortLabel}
        </Text>
      </Float>
      {isNearby && (
        <Html center distanceFactor={10}>
          <div className="mt-2 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-slate-100 shadow-lg border border-white/10 backdrop-blur">
            Appuie sur <span className="text-emerald-300 font-semibold">E</span> pour jouer
          </div>
        </Html>
      )}
    </group>
  );
}

function Scene3D({ onGameSelect, setNearestGame, virtualDirection }: {
  onGameSelect: (gameId: MiniGameId) => void;
  setNearestGame: React.Dispatch<React.SetStateAction<MiniGameId | null>>;
  virtualDirection?: { x: number; z: number } | null;
}) {
  const [playerPos, setPlayerPos] = useState<Vec3>({ x: 0, y: 0.6, z: 0 });

  useEffect(() => {
    let closest: { id: MiniGameId; distance: number } | null = null;
    for (const g of MINI_GAMES) {
      const d = distance3D(playerPos, g.position);
      if (!closest || d < closest.distance) closest = { id: g.id, distance: d };
    }
    if (closest && closest.distance < 1.7) setNearestGame(closest.id);
    else setNearestGame(null);
  }, [playerPos, setNearestGame]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e") {
        setNearestGame((current: MiniGameId | null) => {
          if (current) onGameSelect(current);
          return current;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onGameSelect, setNearestGame]);

  return (
    <>
      <color attach="background" args={["#020617"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 4]} intensity={1.4} castShadow />
      <spotLight position={[0, 5.5, -1]} angle={0.8} penumbra={0.9} intensity={1.2} color={"#38bdf8"} />
      <FloorAndWalls />
      <Player onMove={setPlayerPos} virtualDirection={virtualDirection} />
      {MINI_GAMES.map(game => (
        <GamePortal key={game.id} game={game} isNearby={distance3D(playerPos, game.position) < 1.7} onSelect={onGameSelect} />
      ))}
      <Float speed={1.2} floatIntensity={0.4} rotationIntensity={0.1}>
        <Text position={[0, 2.8, -4.7]} fontSize={0.5} color="#f9fafb" anchorX="center" anchorY="middle">
          Finéa Missions Hub
        </Text>
      </Float>
      <OrbitControls target={[0, 1, -2]} enablePan={false} maxPolarAngle={Math.PI / 2.2} minDistance={5} maxDistance={9} />
    </>
  );
}

export default function MissionsPage() {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<MiniGame | null>(null);
  const [nearestGame, setNearestGame] = useState<MiniGameId | null>(null);
  const [swipeMode, setSwipeMode] = useState<"demo" | "play">("demo");
  const [virtualDirection, setVirtualDirection] = useState<{ x: number; z: number } | null>(null);
  const [joystickVector, setJoystickVector] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const joystickRef = React.useRef<HTMLDivElement | null>(null);
  const [joystickActive, setJoystickActive] = useState(false);

  const currentGame = selectedGame;
  const hintGame = nearestGame ? MINI_GAMES.find(g => g.id === nearestGame) ?? null : null;

  const updateJoystickFromEvent = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx; const dy = clientY - cy;
    const radius = rect.width / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, radius);
    const nx = clampedDist === 0 ? 0 : (dx / dist) * (clampedDist / radius);
    const ny = clampedDist === 0 ? 0 : (dy / dist) * (clampedDist / radius);
    setJoystickVector({ x: nx, y: ny });
    setVirtualDirection({ x: nx, z: ny });
  };

  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    setJoystickActive(true);
    if ("touches" in e) { const t = e.touches[0]; updateJoystickFromEvent(t.clientX, t.clientY); }
    else updateJoystickFromEvent(e.clientX, e.clientY);
  };
  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickActive) return;
    if ("touches" in e) { const t = e.touches[0]; updateJoystickFromEvent(t.clientX, t.clientY); }
    else updateJoystickFromEvent(e.clientX, e.clientY);
  };
  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setJoystickVector({ x: 0, y: 0 });
    setVirtualDirection(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#020617] text-slate-50">
      {/* Header */}
      <div className="relative z-20 flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/[0.06] shrink-0">
        <button
          onClick={() => router.push("/dashboard")}
          className="w-9 h-9 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#eccc68]/70 hover:text-[#eccc68] hover:bg-white/[0.1] transition-all shrink-0 text-xl leading-none"
        >
          ‹
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Missions</p>
          <h1 className="text-base font-semibold text-slate-50">Monde 3D interactif</h1>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-slate-200 shrink-0">Bêta</div>
      </div>

      {/* Game area */}
      <div className="flex-1 relative min-h-0">
        <div className="absolute inset-0">
          <Canvas shadows camera={{ position: [0, 3.5, 6.5], fov: 50 }}>
            <Suspense fallback={null}>
              <Scene3D
                onGameSelect={id => {
                  const game = MINI_GAMES.find(g => g.id === id) ?? null;
                  setSelectedGame(game);
                }}
                setNearestGame={setNearestGame}
                virtualDirection={virtualDirection}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-3 right-3 z-20 flex flex-col gap-2 text-[10px] text-slate-200 pointer-events-none">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <span className="rounded-md bg-black/60 px-1.5 py-0.5 border border-white/10 pointer-events-auto">ZQSD / ←↑↓→</span>
              <span>Déplace</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="rounded-md bg-black/60 px-1.5 py-0.5 border border-white/10 pointer-events-auto">E</span>
              <span>Interagir</span>
            </div>
          </div>
          {hintGame && (
            <div className="rounded-2xl bg-black/60 border border-white/10 px-3 py-2 pointer-events-auto">
              <p className="text-[10px] text-slate-300">
                Tu es proche de <span className="font-semibold text-slate-50">{hintGame.title}</span>. Appuie sur{" "}
                <span className="font-semibold text-emerald-300">E</span> pour lancer.
              </p>
            </div>
          )}
        </div>

        {/* Fiche mini-jeu */}
        {currentGame && (
          <div className="absolute left-3 right-3 top-3 z-30 rounded-3xl border border-white/15 bg-black/80 px-4 py-3 text-xs shadow-[0_18px_45px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Mini‑jeu sélectionné</p>
                <h2 className="text-sm font-semibold mt-1 text-slate-50">{currentGame.title}</h2>
                <p className="mt-1 text-[11px] leading-snug text-slate-200">{currentGame.description}</p>
              </div>
              <button onClick={() => setSelectedGame(null)}
                className="ml-2 rounded-full bg-white/5 border border-white/10 w-6 h-6 flex items-center justify-center text-[10px] text-slate-300 hover:bg-white/10 transition">✕</button>
            </div>

            {currentGame.id === "swipe-game" && (
              <>
                <div className="mt-3 rounded-2xl bg-black/60 border border-white/10 px-3 py-2 space-y-1.5">
                  <p className="text-[10px] font-medium text-slate-100">Comment ça marche ?</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-300">
                    <li>Des cartes de dépenses apparaissent une par une.</li>
                    <li>Swipe à gauche pour refuser, à droite pour accepter.</li>
                    <li>Les deux choix ont un impact, aucun n&apos;est parfait.</li>
                  </ul>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => { setSwipeMode("demo"); router.push("/missions/swipe"); }}
                    className={"rounded-full px-3 py-1 text-[10px] font-semibold transition " + (swipeMode === "demo" ? "bg-white text-slate-900" : "bg-white/5 text-slate-200 border border-white/10")}>Démo</button>
                  <button onClick={() => { setSwipeMode("play"); router.push("/missions/swipe"); }}
                    className={"rounded-full px-3 py-1 text-[10px] font-semibold transition text-slate-900"}
                    style={{ backgroundColor: swipeMode === "play" ? currentGame.accentColor : currentGame.accentColor + "CC" }}>Jouer</button>
                </div>
              </>
            )}

            {currentGame.id === "bill-rush" && (
              <>
                <div className="mt-3 rounded-2xl bg-black/60 border border-white/10 px-3 py-2 space-y-1.5">
                  <p className="text-[10px] font-medium text-slate-100">Comment ça marche ?</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-300">
                    <li>Le mois défile : les cases descendent vers toi sur 3 lignes.</li>
                    <li>Change de ligne pour attraper tes revenus et gérer les dépenses.</li>
                    <li>Certains coûts sont essentiels, d&apos;autres sont des tentations.</li>
                  </ul>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => { setSwipeMode("demo"); router.push("/missions/bill_rush"); }}
                    className={"rounded-full px-3 py-1 text-[10px] font-semibold transition " + (swipeMode === "demo" ? "bg-white text-slate-900" : "bg-white/5 text-slate-200 border border-white/10")}>Démo</button>
                  <button onClick={() => { setSwipeMode("play"); router.push("/missions/bill_rush"); }}
                    className={"rounded-full px-3 py-1 text-[10px] font-semibold transition text-slate-900"}
                    style={{ backgroundColor: swipeMode === "play" ? currentGame.accentColor : currentGame.accentColor + "CC" }}>Jouer</button>
                </div>
              </>
            )}

            {currentGame.id === "savings-lab" && (
              <>
                <div className="mt-3 rounded-2xl bg-black/60 border border-white/10 px-3 py-2 space-y-1.5">
                  <p className="text-[10px] font-medium text-slate-100">Comment ça marche ?</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-300">
                    <li>On te donne un scénario et une somme à répartir.</li>
                    <li>Glisse les sliders entre sécurité, projets, long terme et plaisir.</li>
                    <li>Valide pour voir ce que ça raconte de tes priorités.</li>
                  </ul>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => { setSwipeMode("demo"); router.push("/missions/savings_lab"); }}
                    className={"rounded-full px-3 py-1 text-[10px] font-semibold transition " + (swipeMode === "demo" ? "bg-white text-slate-900" : "bg-white/5 text-slate-200 border border-white/10")}>Démo</button>
                  <button onClick={() => { setSwipeMode("play"); router.push("/missions/savings_lab"); }}
                    className={"rounded-full px-3 py-1 text-[10px] font-semibold transition text-slate-900"}
                    style={{ backgroundColor: swipeMode === "play" ? currentGame.accentColor : currentGame.accentColor + "CC" }}>Jouer</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Joystick virtuel */}
        <div className="absolute bottom-16 left-4 z-30">
          <div ref={joystickRef}
            className="relative h-20 w-20 rounded-full border border-white/20 bg-black/40 backdrop-blur-md touch-none"
            onMouseDown={handleJoystickStart} onMouseMove={handleJoystickMove}
            onMouseUp={handleJoystickEnd} onMouseLeave={handleJoystickEnd}
            onTouchStart={handleJoystickStart} onTouchMove={handleJoystickMove} onTouchEnd={handleJoystickEnd}>
            <div className="absolute inset-2 rounded-full border border-white/10 bg-black/40" />
            <div className="absolute h-10 w-10 rounded-full bg-white/80 shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              style={{
                left: `calc(50% + ${joystickVector.x * 24}px - 20px)`,
                top: `calc(50% + ${joystickVector.y * 24}px - 20px)`,
                transition: joystickActive ? "none" : "transform 0.1s ease-out",
              }} />
          </div>
        </div>
      </div>
    </div>
  );
}
