import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --- Constants ---
const TORUS_RADIUS = 9;
const TORUS_TUBE_RADIUS = 1.5;
const PYRAMID_RADIUS = 5;
const PYRAMID_LARGE_RADIUS = 7.5; // Increased scale difference
const LABEL_VERTEX_DECIMALS = 2;

const CANVAS_TEXTURE_WIDTH = 384; // Increased for larger text
const CANVAS_TEXTURE_HEIGHT = 96; // Increased for larger text
const TEXT_FONT = 'bold 30px Arial'; // Increased text size
const SKILL_SWAP_DEPTH_THRESHOLD_FACTOR = 1.5;

// Define color schemes
const CYAN_COLOR = '#00e6ff';
const CYAN_DARK_COLOR = '#008b99';
const CYAN_GLOW_COLOR = 'rgba(0, 230, 255, 0.9)';

const GOLD_COLOR = '#FFD700'; // Brighter gold
const GOLD_DARK_COLOR = '#DAA520'; // Darker gold
const GOLD_GLOW_BRIGHT = '#FFFF99'; // Bright yellow for additive glow

// --- Types ---
/** Props for the SkillNode component */
type SkillNodeProps = {
  position: [number, number, number];
  text: string;
  visible: boolean;
  labelColor: string; // Color for text gradient start
  labelColorDark: string; // Color for text gradient end
  glowColor: string; // Color for text glow
};

/** Props for the main component */
interface AILOGOProps {
  skills: string[];
}

/** Stores vertex position and its source geometry */
type VertexInfo = {
    vector: THREE.Vector3;
    source: 'torus' | 'pyramid' | 'pyramidLarge';
};

const VERTEX_PROXIMITY_THRESHOLD = 0.5; // Minimum distance between vertices to be considered unique

// --- Components ---

/**
 * Renders a single skill text label as a 3D sprite.
 */
const SkillNode = ({ position, text, visible, labelColor, labelColorDark, glowColor }: SkillNodeProps) => {
  const textSprite = useRef<THREE.Sprite>(null);
  const [opacity, setOpacity] = useState(0.5);

  // Add console log inside SkillNode to verify received props
  // console.log(`SkillNode received: text=${text}, labelColor=${labelColor}, glowColor=${glowColor}`);

  const textTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_TEXTURE_WIDTH;
    canvas.height = CANVAS_TEXTURE_HEIGHT;
    const context = canvas.getContext('2d');

    if (context) {
      context.fillStyle = 'transparent';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Use passed colors for gradient
      const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, labelColor);
      gradient.addColorStop(1, labelColorDark);

      context.fillStyle = gradient;
      context.font = TEXT_FONT;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, canvas.width / 2, canvas.height / 2);

      // Use passed color for glow
      context.shadowColor = glowColor;
      context.shadowBlur = 25;
      context.fillText(text, canvas.width / 2, canvas.height / 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [text, labelColor, labelColorDark, glowColor]); // Include all color props in dependencies

  // Update sprite opacity and orientation every frame
  useFrame((state) => {
    if (!visible || !textSprite.current) return; // Skip if not visible or ref not ready

    // Calculate sprite's world position
    const worldPos = textSprite.current.getWorldPosition(new THREE.Vector3());
    const distanceToCamera = worldPos.distanceTo(state.camera.position);

    // Determine direction from camera to sprite
    const directionToCamera = worldPos.clone().sub(state.camera.position).normalize();
    // Determine camera's forward direction
    const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
    // Check if sprite is roughly in front of or behind the camera
    const dotProduct = directionToCamera.dot(cameraForward);

    // Define visibility parameters
    const maxOpacity = 0.5; // Max opacity when fully visible
    const sideViewOpacity = 0.15; // Opacity when viewed from the side
    const visibilityDistanceThreshold = 40; // Max distance to be visible
    const fullOpacityDistanceStart = 15; // Distance at which opacity starts decreasing
    const fullOpacityDistanceEnd = fullOpacityDistanceStart + 25; // Distance where opacity reaches near zero

    // Calculate opacity based on orientation and distance
    if (dotProduct < -0.1 || distanceToCamera > visibilityDistanceThreshold) {
      // Hide if behind camera or too far away
      setOpacity(0);
    } else if (dotProduct > 0.1) {
      // If in front of camera, calculate opacity based on distance
      const distanceFactor = Math.max(0, Math.min(1, 1 - (distanceToCamera - fullOpacityDistanceStart) / (fullOpacityDistanceEnd - fullOpacityDistanceStart)));
      setOpacity(maxOpacity * distanceFactor);
    } else {
      // If viewed from the side, use a fixed low opacity
      setOpacity(sideViewOpacity);
    }

    // Make sprite always face the camera (billboarding)
    textSprite.current.lookAt(state.camera.position);
  });

  // Don't render if not visible
  if (!visible) return null;

  // Render the sprite with the text texture
  return (
    <sprite
      ref={textSprite}
      position={position}
      // Scale adjusted for the current font size
      scale={[4.5, 1.125, 1]}
    >
      <spriteMaterial
        map={textTexture}
        transparent={true}
        opacity={opacity}
        depthWrite={false} // Prevents sprite from occluding objects behind it incorrectly
        depthTest={true} // Allows sprite to be occluded by objects in front
        fog={true} // Allow sprite to be affected by scene fog
        sizeAttenuation={true} // Make sprite scale smaller with distance
      />
    </sprite>
  );
};

/**
 * Extracts *all* vertices from a geometry and tags them with their source.
 * Does not perform uniqueness checks here.
 */
const getAllVerticesWithSource = (
    geometry: THREE.BufferGeometry | null,
    source: VertexInfo['source'],
    targetList: VertexInfo[]
): void => {
  if (!geometry || !geometry.attributes.position) return;

  const positions = geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    targetList.push({ vector: new THREE.Vector3(x, y, z), source });
  }
};

/**
 * Manages the main 3D scene content: rotating wireframes and labels.
 */
const AILOGOScene = ({ skills = [] }: AILOGOProps) => {
  const groupRef = useRef<THREE.Group>(null); // Keep for torus / overall scene rotation
  const pyramidRef = useRef<THREE.Group>(null); // Ref for inner pyramid group
  const pyramidLargeRef = useRef<THREE.Group>(null); // Ref for outer pyramid group

  const [nodeSkills, setNodeSkills] = useState<number[]>([]);
  const [nodesToUpdate, setNodesToUpdate] = useState<number[]>([]);
  const [frameCount, setFrameCount] = useState(0);
  const [rotationVelocity, setRotationVelocity] = useState({ x: 0.0005, y: 0.001, z: 0.00025 }); // Torus rotation speed

  // State for random pyramid rotation speeds
  const [pyramidRotationSpeed, setPyramidRotationSpeed] = useState({ x: 0, y: 0, z: 0 });
  const [pyramidLargeRotationSpeed, setPyramidLargeRotationSpeed] = useState({ x: 0, y: 0, z: 0 });

  // --- Geometry Generation ---
  const torusGeometry = useMemo(() => new THREE.TorusGeometry(
    TORUS_RADIUS,      // radius
    TORUS_TUBE_RADIUS, // tube radius
    4,                 // radialSegments - segments around the tube cross-section (4 for square profile)
    16,                // tubularSegments - segments around the main ring (16 as requested)
    Math.PI * 2        // arc - full circle
  ), []);
  const pyramidGeometry = useMemo(() => new THREE.TetrahedronGeometry(PYRAMID_RADIUS), []);
  const pyramidLargeGeometry = useMemo(() => new THREE.TetrahedronGeometry(PYRAMID_LARGE_RADIUS), []);

  // Memoized Combined Unique Vertices with Source Info
  const verticesInfo = useMemo(() => {
    const allVertices: VertexInfo[] = [];
    // 1. Gather all vertices first - ONLY from torus
    getAllVerticesWithSource(torusGeometry, 'torus', allVertices);
    // getAllVerticesWithSource(pyramidGeometry, 'pyramid', allVertices); // Removed pyramid vertices
    // getAllVerticesWithSource(pyramidLargeGeometry, 'pyramidLarge', allVertices); // Removed large pyramid vertices

    // 2. Filter for uniqueness based on proximity (still relevant for torus)
    const uniqueVertices: VertexInfo[] = [];
    for (const currentVertexInfo of allVertices) {
      const isUnique = !uniqueVertices.some(existingVertexInfo =>
        existingVertexInfo.vector.distanceTo(currentVertexInfo.vector) < VERTEX_PROXIMITY_THRESHOLD
      );
      if (isUnique) {
        uniqueVertices.push(currentVertexInfo);
      }
    }

    console.log(`Gathered ${allVertices.length} vertices, filtered down to ${uniqueVertices.length} unique vertices for labels.`);
    return uniqueVertices;
  }, [torusGeometry, pyramidGeometry, pyramidLargeGeometry]);

  // Extract just the vectors for skill update logic (if needed separately)
  const verticesVectors = useMemo(() => verticesInfo.map(info => info.vector), [verticesInfo]);

  // Initialize nodeSkills based on the combined vertices
  useEffect(() => {
    if (verticesInfo.length > 0 && skills.length > 0) {
      const initialSkills = Array(verticesInfo.length).fill(0).map(() =>
        Math.floor(Math.random() * skills.length)
      );
      setNodeSkills(initialSkills);
      console.log(`Initialized ${initialSkills.length} node skills.`);
    } else if (verticesInfo.length === 0) {
      console.log("No vertices available to initialize skills.");
    } else if (skills.length === 0) {
      console.log("No skills available to initialize node skills.");
    }
  }, [verticesInfo, skills]); // Keep dependencies

  // Initialize random pyramid rotation speeds once
  useEffect(() => {
    setPyramidRotationSpeed({
      x: (Math.random() - 0.5) * 0.02, // Small random speed range
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.02,
    });
    setPyramidLargeRotationSpeed({
      x: (Math.random() - 0.5) * 0.02, // Different random speed range
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.02,
    });
    console.log("Initialized random pyramid rotation speeds.");
  }, []); // Empty dependency array ensures this runs only once

  // Memoized Wireframe Geometries
  const torusWireframeGeometry = useMemo(() => new THREE.EdgesGeometry(torusGeometry), [torusGeometry]);
  const pyramidWireframeGeometry = useMemo(() => new THREE.EdgesGeometry(pyramidGeometry), [pyramidGeometry]);
  const pyramidLargeWireframeGeometry = useMemo(() => new THREE.EdgesGeometry(pyramidLargeGeometry), [pyramidLargeGeometry]); // Wireframe for large pyramid

  // --- Animation and Logic Loop ---
  useFrame((state) => {
    if (!groupRef.current) return;

    // Apply Rotation to the main group (affects torus)
    groupRef.current.rotation.x += rotationVelocity.x;
    groupRef.current.rotation.y += rotationVelocity.y;
    groupRef.current.rotation.z += rotationVelocity.z;

    // Rotate inner pyramid randomly
    if (pyramidRef.current) {
      pyramidRef.current.rotation.x += pyramidRotationSpeed.x;
      pyramidRef.current.rotation.y += pyramidRotationSpeed.y;
      pyramidRef.current.rotation.z += pyramidRotationSpeed.z;
    }

    // Rotate large pyramid randomly
    if (pyramidLargeRef.current) {
      pyramidLargeRef.current.rotation.x += pyramidLargeRotationSpeed.x;
      pyramidLargeRef.current.rotation.y += pyramidLargeRotationSpeed.y;
      pyramidLargeRef.current.rotation.z += pyramidLargeRotationSpeed.z;
    }

    // Update Rotation Velocity (Random Walk)
    if (frameCount % 60 === 0) {
      const changeFactor = 0.0005;
      setRotationVelocity(prev => ({
        x: prev.x + (Math.random() - 0.5) * changeFactor,
        y: prev.y + (Math.random() - 0.5) * changeFactor,
        z: prev.z + (Math.random() - 0.5) * (changeFactor * 0.4)
      }));
    }
    setFrameCount(prev => prev + 1);

    // Check for Nodes Needing Skill Update
    if (frameCount % 10 === 0 && skills.length > 0 && verticesVectors.length > 0) {
      const nodesToTriggerUpdate: number[] = [];
      // Use only TORUS_RADIUS for the skill swap depth calculation
      const skillSwapDepth = -(TORUS_RADIUS * SKILL_SWAP_DEPTH_THRESHOLD_FACTOR);

      verticesVectors.forEach((vec, nodeIndex) => {
        // Ensure groupRef.current exists before accessing matrixWorld
        if (groupRef.current) {
           const worldPos = vec.clone().applyMatrix4(groupRef.current.matrixWorld);
            if (worldPos.z < skillSwapDepth) {
              nodesToTriggerUpdate.push(nodeIndex);
            }
        }
      });

      if (nodesToTriggerUpdate.length > 0) {
        setNodesToUpdate(nodesToTriggerUpdate);
      }
    }
  });

  // --- Skill Updates ---
  useEffect(() => {
    if (nodesToUpdate.length > 0 && skills.length > 0 && nodeSkills.length > 0) {
       console.log(`Updating skills for ${nodesToUpdate.length} nodes.`);
      setNodeSkills(prev => {
        const newSkills = [...prev];
        if (newSkills.length === 0) {
           console.warn("Attempted to update skills, but nodeSkills array is empty.");
           return prev;
        }
        for (const nodeIndex of nodesToUpdate) {
           if (nodeIndex >= 0 && nodeIndex < newSkills.length) {
             newSkills[nodeIndex] = Math.floor(Math.random() * skills.length);
           } else {
              console.warn(`Invalid nodeIndex ${nodeIndex} during skill update. nodeSkills length: ${newSkills.length}`);
           }
        }
        return newSkills;
      });
      setNodesToUpdate([]);
    } else if (nodesToUpdate.length > 0) {
       if (skills.length === 0) console.log("Skill update skipped: No skills available.");
       if (nodeSkills.length === 0) console.log("Skill update skipped: nodeSkills not initialized yet.");
    }
  }, [nodesToUpdate, skills, nodeSkills.length]);

  // Function to find original index reliably
  const findOriginalIndex = (vertexInfo: VertexInfo) => {
      // Only need to check vector equality now, as all vertices are from the torus
      return verticesInfo.findIndex(v => v.vector.equals(vertexInfo.vector));
  };

  // --- Render Scene Content ---
  return (
    <group ref={groupRef}> {/* Group for Torus + Overall positioning/rotation */}
      {/* Torus Geometry */}
      <lineSegments geometry={torusWireframeGeometry}>
        <lineBasicMaterial color={CYAN_COLOR} linewidth={1.5} />
      </lineSegments>
      {/* Torus Labels */}
      {verticesInfo // No filter needed, verticesInfo only contains torus vertices now
        .map((info) => {
          const originalIndex = findOriginalIndex(info);
          if (originalIndex === -1) return null; // Should not happen if logic is correct
          const skillIndex = nodeSkills[originalIndex];
          if (skillIndex === undefined || !skills[skillIndex]) return null; // Check skill exists

          return (
            <SkillNode
              key={`torus-node-${originalIndex}`} // Use originalIndex for stable key
              position={[info.vector.x, info.vector.y, info.vector.z]}
              text={skills[skillIndex]}
              visible={true}
              labelColor={GOLD_COLOR}
              labelColorDark={GOLD_DARK_COLOR}
              glowColor={GOLD_GLOW_BRIGHT}
            />
          );
      })}

      {/* Inner Pyramid Group (for independent rotation) */}
      <group ref={pyramidRef}>
        {/* Glow Layer 1 - Additive Blending */}        
        <lineSegments geometry={pyramidWireframeGeometry}>
          <lineBasicMaterial
            color={GOLD_GLOW_BRIGHT} // Use bright yellow
            linewidth={1} // Linewidth often ignored > 1
            transparent={true}
            opacity={0.35} // Adjusted opacity
            depthWrite={false}
            blending={THREE.AdditiveBlending} // Additive blending for glow
          />
        </lineSegments>
        {/* Glow Layer 2 - Additive Blending */} 
        <lineSegments geometry={pyramidWireframeGeometry}>
          <lineBasicMaterial
            color={GOLD_GLOW_BRIGHT} // Use bright yellow
            linewidth={1} // Linewidth often ignored > 1
            transparent={true}
            opacity={0.2} // Adjusted opacity
            depthWrite={false}
            blending={THREE.AdditiveBlending} // Additive blending for glow
          />
        </lineSegments>
        {/* Original Solid Line */}        
        <lineSegments geometry={pyramidWireframeGeometry}>
           <lineBasicMaterial color={GOLD_COLOR} linewidth={1.5} />
           {/* Note: linewidth > 1 might still not work reliably, 1.5 kept for potential subtle effect */}
        </lineSegments>
      </group>

      {/* Outer Pyramid Group (for independent rotation) */}
      <group ref={pyramidLargeRef}>
        {/* Glow Layer 1 - Additive Blending */}        
        <lineSegments geometry={pyramidLargeWireframeGeometry}>
          <lineBasicMaterial
            color={GOLD_GLOW_BRIGHT} // Use bright yellow
            linewidth={1} // Linewidth often ignored > 1
            transparent={true}
            opacity={0.35} // Adjusted opacity
            depthWrite={false}
            blending={THREE.AdditiveBlending} // Additive blending for glow
          />
        </lineSegments>
         {/* Glow Layer 2 - Additive Blending */} 
        <lineSegments geometry={pyramidLargeWireframeGeometry}>
          <lineBasicMaterial
            color={GOLD_GLOW_BRIGHT} // Use bright yellow
            linewidth={1} // Linewidth often ignored > 1
            transparent={true}
            opacity={0.2} // Adjusted opacity
            depthWrite={false}
            blending={THREE.AdditiveBlending} // Additive blending for glow
          />
        </lineSegments>
        {/* Original Solid Line */}        
        <lineSegments geometry={pyramidLargeWireframeGeometry}>
             <lineBasicMaterial color={GOLD_COLOR} linewidth={1.5} />
             {/* Note: linewidth > 1 might still not work reliably, 1.5 kept for potential subtle effect */}
        </lineSegments>
      </group>

    </group>
  );
};

/**
 * The main export component that sets up the R3F Canvas and scene environment.
 */
export const AILOGO = ({ skills }: AILOGOProps) => {
  return (
    // Container div for the canvas
    <div className="w-full h-full">
      <Canvas
        // Camera setup: position and field of view
        camera={{ position: [0, 0, 25], fov: 55 }}
        // WebGL renderer settings
        gl={{ antialias: true }}
        // Device pixel ratio for sharper rendering on high-res screens
        dpr={[1, 2]}
      >
        {/* Scene fog effect - brought closer */}
        <fog attach="fog" args={['#0a1419', 15, 30]} />
        {/* Basic ambient lighting */}
        <ambientLight intensity={0.6} />
        {/* A point light for highlights */}
        <pointLight position={[15, 15, 15]} intensity={1.2} />
        {/* Render the AILOGO scene content */}
        <AILOGOScene skills={skills} />
        {/* OrbitControls removed as camera is fixed */}
      </Canvas>
    </div>
  );
};
