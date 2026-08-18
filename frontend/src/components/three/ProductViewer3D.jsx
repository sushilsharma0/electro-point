import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF, ContactShadows } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { WithTooltip } from '@/components/ui/tooltip';
import { useReducedMotion } from '@/hooks/useMedia';
import { productImage } from '@/lib/product';

function GltfModel({ url }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} />;
}

function ProceduralDevice({ kind = 'phone' }) {
  if (kind === 'laptop') {
    return (
      <group>
        <mesh position={[0, -0.05, 0]} rotation={[-1.45, 0, 0]}>
          <boxGeometry args={[1.6, 1.05, 0.04]} />
          <meshStandardMaterial color="#1c2128" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.52, -0.48]} rotation={[-0.15, 0, 0]}>
          <boxGeometry args={[1.6, 1.0, 0.04]} />
          <meshStandardMaterial color="#14161a" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.52, -0.455]} rotation={[-0.15, 0, 0]}>
          <planeGeometry args={[1.42, 0.86]} />
          <meshStandardMaterial color="#0b0d10" emissive="#1a2332" emissiveIntensity={0.35} />
        </mesh>
      </group>
    );
  }
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.72, 1.48, 0.08]} />
        <meshStandardMaterial color="#1c2128" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.02, 0.042]}>
        <planeGeometry args={[0.64, 1.32]} />
        <meshStandardMaterial color="#0b0d10" emissive="#152033" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function Scene({ modelUrl, kind, autoRotate, controlsRef, enableZoom }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 4]} intensity={1.1} />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} />
      {modelUrl ? <GltfModel url={modelUrl} /> : <ProceduralDevice kind={kind} />}
      <ContactShadows opacity={0.35} scale={8} blur={2.4} far={4} />
      <Environment preset="studio" />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        minDistance={1.4}
        maxDistance={5}
        enablePan={false}
        enableZoom={enableZoom}
      />
    </>
  );
}

export default function ProductViewer3D({ product, className, scrollInfluence = false }) {
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const controlsRef = useRef(null);
  const wrapRef = useRef(null);
  const modelUrl = product?.model3d?.url;
  const kind = /laptop|notebook/i.test(`${product?.name || ''} ${product?.category?.name || ''}`) ? 'laptop' : 'phone';
  const summary = [product?.name, ...(product?.specGroups?.[0]?.fields || []).slice(0, 4).map((f) => `${f.label}: ${f.value}`)].filter(Boolean).join('. ');

  if (failed || typeof window === 'undefined') {
    return (
      <div className={className}>
        <img src={productImage(product)} alt={product?.name} className="h-full w-full object-contain" />
      </div>
    );
  }

  const webgl = (() => {
    try {
      const c = document.createElement('canvas');
      return Boolean(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  })();

  if (!webgl) {
    return (
      <div className={className}>
        <img src={productImage(product)} alt={product?.name} className="h-full w-full object-contain" />
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={className}>
      <p className="sr-only">{summary}</p>
      <div className="relative h-full min-h-[280px] w-full" role="img" aria-label={`3D view of ${product?.name || 'product'}`}>
        <Suspense fallback={<img src={productImage(product)} alt="" className="h-full w-full object-contain opacity-60" />}>
          <Canvas
            camera={{ position: [0, 0.2, 2.6], fov: 40 }}
            dpr={[1, 1.75]}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener('webglcontextlost', (e) => {
                e.preventDefault();
                setFailed(true);
              });
            }}
            onPointerMissed={() => {}}
          >
            <Scene
              modelUrl={modelUrl}
              kind={kind}
              autoRotate={!reduced}
              controlsRef={controlsRef}
              enableZoom={!scrollInfluence}
            />
          </Canvas>
        </Suspense>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="absolute bottom-3 right-3"
          onClick={() => controlsRef.current?.reset?.()}
        >
          <WithTooltip label="Reset view">
            <RotateCcw className="h-3.5 w-3.5" />
          </WithTooltip>
          Reset
        </Button>
      </div>
    </div>
  );
}
