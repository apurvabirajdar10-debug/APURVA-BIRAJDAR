import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLOBE_CITIES, GlobeCity } from '../data/globeCities';
import {
  RotateCcw,
  Play,
  Pause,
  Plus,
  Compass,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  X
} from 'lucide-react';

interface Interactive3DGlobeProps {
  onSelectCity?: (cityName: string) => void;
  onAddCityToTrip?: (city: GlobeCity) => void;
  selectedCityName?: string;
  className?: string;
  scope?: 'national' | 'international';
  onScopeChange?: (scope: 'national' | 'international') => void;
  onOpenScopeModal?: () => void;
  isolateSelectedMarker?: boolean;
}

// Convert geographic coordinates (lat, lng) to Cartesian 3D coordinates on sphere of radius R
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Procedurally generate a stylized Snapchat-inspired cyber-earth texture
function createProceduralEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep navy / space ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#040814');
  oceanGrad.addColorStop(0.5, '#070f26');
  oceanGrad.addColorStop(1, '#040814');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Coordinate grid lines (Latitude & Longitude parallels)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1.5;

  // Parallels (latitudes)
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = ((90 - lat) / 180) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Meridians (longitudes)
  for (let lng = -180; lng <= 180; lng += 30) {
    const x = ((lng + 180) / 360) * canvas.width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Equator line highlight
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();

  // Helper to convert lat/lng directly to canvas coordinates
  const toX = (lng: number) => ((lng + 180) / 360) * canvas.width;
  const toY = (lat: number) => ((90 - lat) / 180) * canvas.height;

  // Draw stylized continent landmasses (Snapchat / futuristic location tracking style)
  const drawLandmass = (coords: [number, number][], fillColor: string, strokeColor: string) => {
    if (coords.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(toX(coords[0][1]), toY(coords[0][0]));
    for (let i = 1; i < coords.length; i++) {
      ctx.lineTo(toX(coords[i][1]), toY(coords[i][0]));
    }
    ctx.closePath();

    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const landFill = 'rgba(15, 30, 65, 0.95)';
  const landStroke = 'rgba(56, 189, 248, 0.5)';

  // North America
  drawLandmass([
    [70, -165], [72, -130], [68, -90], [58, -60], [48, -52], [28, -80],
    [15, -85], [10, -78], [18, -100], [30, -115], [48, -125], [60, -145]
  ], landFill, landStroke);

  // South America
  drawLandmass([
    [10, -75], [5, -50], [-10, -35], [-25, -45], [-50, -68],
    [-55, -72], [-35, -74], [-15, -78], [0, -80]
  ], landFill, landStroke);

  // Europe
  drawLandmass([
    [70, 25], [60, 30], [55, 40], [45, 35], [38, 25],
    [36, -5], [44, -10], [55, 5], [60, 5], [70, 15]
  ], landFill, landStroke);

  // Africa
  drawLandmass([
    [35, -5], [32, 32], [12, 50], [0, 42], [-20, 35],
    [-34, 20], [-30, 15], [5, 2], [15, -16], [30, -10]
  ], landFill, landStroke);

  // Asia
  drawLandmass([
    [75, 60], [75, 175], [60, 170], [40, 140], [25, 120], [10, 105],
    [8, 77], [25, 65], [35, 45], [55, 50], [65, 60]
  ], landFill, landStroke);

  // Australia
  drawLandmass([
    [-12, 130], [-15, 148], [-28, 153], [-38, 145],
    [-35, 115], [-22, 114], [-15, 125]
  ], landFill, landStroke);

  // British Isles
  drawLandmass([
    [58, -5], [58, 0], [50, 1], [50, -5]
  ], landFill, landStroke);

  // Japan
  drawLandmass([
    [45, 142], [40, 140], [34, 135], [31, 131], [35, 136], [42, 144]
  ], landFill, landStroke);

  // Matrix dots across globe surface for high-tech holographic presence
  ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
  for (let lat = -70; lat <= 70; lat += 10) {
    for (let lng = -180; lng < 180; lng += 15) {
      const x = toX(lng);
      const y = toY(lat);
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const Interactive3DGlobe: React.FC<Interactive3DGlobeProps> = ({
  onSelectCity,
  onAddCityToTrip,
  selectedCityName,
  className = '',
  scope: propScope,
  onScopeChange,
  onOpenScopeModal,
  isolateSelectedMarker,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [internalScope, setInternalScope] = useState<'national' | 'international'>(propScope || 'national');
  const activeScope = propScope || internalScope;

  const getFilteredCities = useCallback((s: 'national' | 'international') => {
    return GLOBE_CITIES.filter(c => c.scope === s);
  }, []);

  const [isolateMarker, setIsolateMarker] = useState<boolean>(
    isolateSelectedMarker !== undefined ? isolateSelectedMarker : true
  );

  const [selectedCity, setSelectedCity] = useState<GlobeCity | null>(() => {
    if (selectedCityName) {
      const match = GLOBE_CITIES.find(c => c.name.toLowerCase() === selectedCityName.toLowerCase());
      if (match) return match;
    }
    const filtered = GLOBE_CITIES.filter(c => c.scope === (propScope || 'national'));
    return filtered[0] || GLOBE_CITIES[0];
  });
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredCity, setHoveredCity] = useState<GlobeCity | null>(null);

  // Sync isolateMarker prop if passed
  useEffect(() => {
    if (isolateSelectedMarker !== undefined) {
      setIsolateMarker(isolateSelectedMarker);
    }
  }, [isolateSelectedMarker]);

  // Internal references for Three.js render loop & fly-to transitions
  const threeStateRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    radarRings: { mesh: THREE.Mesh; initialScale: number; cityId: string }[];
    pinMeshes: THREE.Mesh[];
    pinGroup: THREE.Group;
    targetCameraPos: THREE.Vector3 | null;
    isTransitioning: boolean;
    frameId: number;
    requestRender: () => void;
  } | null>(null);

  // Smoothly glide camera to view a specific city and isolate its marker
  const flyToCity = useCallback((city: GlobeCity) => {
    setSelectedCity(city);
    const state = threeStateRef.current;
    if (!state) return;

    const cityVec = latLngToVector3(city.lat, city.lng, 2.0);
    // Position camera along the vector pointing from sphere origin through the city, at distance 4.2
    const targetPos = cityVec.clone().normalize().multiplyScalar(4.2);

    state.targetCameraPos = targetPos;
    state.isTransitioning = true;
    state.controls.autoRotate = false;
  }, []);

  const handleSetScope = (newScope: 'national' | 'international') => {
    setInternalScope(newScope);
    onScopeChange?.(newScope);
  };

  // Sync with propScope if provided
  useEffect(() => {
    if (propScope && propScope !== internalScope) {
      setInternalScope(propScope);
    }
  }, [propScope]);

  // Update pin visibility: when isolateMarker is active, clear all previously marked cities/countries so ONLY selectedCity is visible
  useEffect(() => {
    const state = threeStateRef.current;
    if (state && state.pinGroup) {
      state.pinGroup.children.forEach((child) => {
        const city = child.userData?.city as GlobeCity;
        if (city) {
          if (isolateMarker && selectedCity) {
            child.visible = city.id === selectedCity.id;
          } else {
            child.visible = city.scope === activeScope;
          }
        }
      });
    }

    const matching = getFilteredCities(activeScope);
    if (matching.length > 0) {
      const isCurrentInScope = selectedCity && selectedCity.scope === activeScope;
      if (!isCurrentInScope) {
        const defaultCity = matching[0];
        flyToCity(defaultCity);
        onSelectCity?.(defaultCity.name);
      }
    }
  }, [activeScope, flyToCity, getFilteredCities, onSelectCity, selectedCity, isolateMarker]);

  // Update selected city if prop changes
  useEffect(() => {
    if (selectedCityName) {
      const match = GLOBE_CITIES.find(c => c.name.toLowerCase() === selectedCityName.toLowerCase());
      if (match && match.id !== selectedCity?.id) {
        flyToCity(match);
      }
    }
  }, [selectedCityName, flyToCity, selectedCity?.id]);

  // Initialize Three.js scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL to adapt performance gracefully
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070b14');

    // Subtle space starfield background
    const starGeo = new THREE.BufferGeometry();
    const starCount = 350;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 14 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 4.8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.8;
    controls.maxDistance = 7.0;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.65;
    controls.enablePan = false;

    // 1. Globe Base Sphere (Radius 2.0)
    const earthRadius = 2.0;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthTexture = createProceduralEarthTexture();
    earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.7,
      metalness: 0.15,
      color: 0xffffff,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    // 2. Atmospheric Glowing Rim Halo
    const atmosphereGeo = new THREE.SphereGeometry(earthRadius * 1.04, 48, 48);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphereMesh);

    // 3. Equatorial Navigation Orbit Ring (Snapchat / Compass UI element)
    const ringGeo = new THREE.RingGeometry(earthRadius * 1.15, earthRadius * 1.158, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
    });
    const navRing = new THREE.Mesh(ringGeo, ringMat);
    navRing.rotation.x = Math.PI / 2;
    scene.add(navRing);

    // 4. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
    keyLight.position.set(5, 4, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-6, -3, -5);
    scene.add(rimLight);

    // 5. Procedural 3D Hotspot Pins & Animated Radar Waves
    const pinGroup = new THREE.Group();
    scene.add(pinGroup);

    const pinMeshes: THREE.Mesh[] = [];
    const radarRings: { mesh: THREE.Mesh; initialScale: number; cityId: string }[] = [];

    GLOBE_CITIES.forEach((city) => {
      const cityPos = latLngToVector3(city.lat, city.lng, earthRadius);
      const normal = cityPos.clone().normalize();

      // Pin composite container
      const cityPinGroup = new THREE.Group();
      cityPinGroup.position.copy(cityPos);
      cityPinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      // (A) Surface Base Ring
      const baseRingGeo = new THREE.RingGeometry(0.04, 0.08, 24);
      const baseRingMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(city.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
      baseRing.rotation.x = Math.PI / 2;
      cityPinGroup.add(baseRing);

      // (B) Animated Pulsating Radar Ring (Snapchat live beacon effect)
      const radarGeo = new THREE.RingGeometry(0.06, 0.085, 24);
      const radarMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(city.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const radar = new THREE.Mesh(radarGeo, radarMat);
      radar.rotation.x = Math.PI / 2;
      cityPinGroup.add(radar);
      radarRings.push({ mesh: radar, initialScale: 1, cityId: city.id });

      // (C) Holographic Vertical Beam
      const beamHeight = 0.22;
      const beamGeo = new THREE.CylinderGeometry(0.012, 0.012, beamHeight, 16);
      const beamMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(city.color),
        emissive: new THREE.Color(city.color),
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = beamHeight / 2;
      cityPinGroup.add(beam);

      // (D) Glowing Pin Head (Interactive target)
      const headRadius = 0.065;
      const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: new THREE.Color(city.color),
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.9,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = beamHeight + headRadius * 0.8;
      head.userData = { city, isPinHead: true };
      cityPinGroup.visible = isolateMarker
        ? (selectedCity ? city.id === selectedCity.id : city.scope === activeScope)
        : city.scope === activeScope;
      cityPinGroup.add(head);

      pinMeshes.push(head);
      pinGroup.add(cityPinGroup);
    });

    // 6. Raycasting for Interaction (Click & Hover)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const visiblePins = pinMeshes.filter(m => m.parent && m.parent.visible);
      const intersects = raycaster.intersectObjects(visiblePins);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const cityData = hit.userData.city as GlobeCity;
        renderer.domElement.style.cursor = 'pointer';
        setHoveredCity(cityData);
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHoveredCity(null);
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const visiblePins = pinMeshes.filter(m => m.parent && m.parent.visible);
      const intersects = raycaster.intersectObjects(visiblePins);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const clickedCity = hit.userData.city as GlobeCity;
        flyToCity(clickedCity);
      }
    };

    renderer.domElement.addEventListener('mousemove', handlePointerMove);
    renderer.domElement.addEventListener('click', handlePointerDown);

    // 7. Render Loop with Smooth Spring Interpolation & Radar Pulse
    let radarTime = 0;

    const tick = () => {
      const state = threeStateRef.current;
      if (!state) return;

      // Animate radar wave pulses (Snapchat beacon ping)
      radarTime += 0.025;
      radarRings.forEach((item, idx) => {
        if (item.mesh.parent && !item.mesh.parent.visible) return;
        const phase = (radarTime + idx * 0.2) % 1;
        const scale = 1 + phase * 2.2;
        item.mesh.scale.set(scale, scale, scale);
        const mat = item.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 0.75 * (1 - phase));
      });

      // Smooth camera fly-to transition
      if (state.isTransitioning && state.targetCameraPos) {
        camera.position.lerp(state.targetCameraPos, 0.06);
        controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.06);

        if (camera.position.distanceTo(state.targetCameraPos) < 0.05) {
          state.isTransitioning = false;
          state.targetCameraPos = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);
      state.frameId = requestAnimationFrame(tick);
    };

    // Store state in ref
    threeStateRef.current = {
      scene,
      camera,
      renderer,
      controls,
      radarRings,
      pinMeshes,
      pinGroup,
      targetCameraPos: null,
      isTransitioning: false,
      frameId: 0,
      requestRender: () => {
        renderer.render(scene, camera);
      },
    };

    tick();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handlePointerDown);

      if (threeStateRef.current) {
        cancelAnimationFrame(threeStateRef.current.frameId);
      }

      earthGeo.dispose();
      earthMat.dispose();
      earthTexture.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      starGeo.dispose();
      starMat.dispose();

      renderer.dispose();
      container.innerHTML = '';
      threeStateRef.current = null;
    };
  }, [flyToCity]);

  // Controls Handlers
  const toggleAutoRotate = () => {
    const state = threeStateRef.current;
    if (state) {
      const next = !state.controls.autoRotate;
      state.controls.autoRotate = next;
      setIsAutoRotating(next);
    }
  };

  const handleResetView = () => {
    const state = threeStateRef.current;
    if (state) {
      state.targetCameraPos = new THREE.Vector3(0, 1.5, 4.8);
      state.isTransitioning = true;
      state.controls.autoRotate = true;
      setIsAutoRotating(true);
      setSelectedCity(null);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const state = threeStateRef.current;
    if (state) {
      const factor = direction === 'in' ? 0.8 : 1.25;
      const newDist = state.camera.position.length() * factor;
      if (newDist >= state.controls.minDistance && newDist <= state.controls.maxDistance) {
        state.camera.position.multiplyScalar(factor);
      }
    }
  };

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl transition-all duration-300 ${
      isFullscreen ? 'fixed inset-4 z-50 rounded-3xl h-[calc(100vh-2rem)]' : 'h-[540px]'
    } ${className}`}>

      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Snapchat-Style Status & Title Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center space-x-2.5">
        <div className="w-9 h-9 rounded-2xl bg-sky-500/20 border border-sky-400/40 backdrop-blur-md flex items-center justify-center shadow-lg shadow-sky-500/10">
          <Compass className="w-5 h-5 text-sky-400 animate-spin-slow" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-500/30">
              3D Live Map
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Snapchat Style Radar
            </span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight font-serif-heading">
            Global Hotspots & City Pins
          </h2>
        </div>
      </div>

      {/* Top Right: Scope Selection & Fullscreen Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        {/* Two Distinct Scope Options */}
        <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1 backdrop-blur-md shadow-xl">
          <button
            type="button"
            onClick={() => handleSetScope('national')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeScope === 'national'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🇮🇳</span>
            <span>National (India)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetScope('international')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeScope === 'international'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🌐</span>
            <span>International</span>
          </button>
          {onOpenScopeModal && (
            <button
              type="button"
              onClick={onOpenScopeModal}
              className="p-1.5 ml-0.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Open Destination Scope Selector Modal"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Marker Isolation Status / Toggle */}
        {selectedCity && (
          <button
            type="button"
            onClick={() => setIsolateMarker(!isolateMarker)}
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold backdrop-blur-md border transition-all cursor-pointer shadow-xl ${
              isolateMarker
                ? 'bg-sky-500/20 border-sky-400/50 text-sky-300 hover:bg-sky-500/30'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title={isolateMarker ? "Currently isolating selected city marker only. Click to show all markers." : "Click to clear other markers and isolate selected city only."}
          >
            <span>{isolateMarker ? '🎯 Focused Marker' : '🌐 All Markers'}</span>
          </button>
        )}

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition-all shadow-lg cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Expand Globe'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Hover Floating Pin Badge (Follows mouse hover) */}
      {hoveredCity && !selectedCity && (
        <div className="absolute top-16 left-4 z-10 pointer-events-none bg-slate-900/90 border border-sky-500/40 px-3 py-1.5 rounded-xl text-xs text-white shadow-xl backdrop-blur-md flex items-center space-x-1.5 animate-in fade-in duration-150">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span className="font-bold">{hoveredCity.name}</span>
          <span className="text-slate-400">({hoveredCity.country})</span>
        </div>
      )}

      {/* City Spotlight Card (Snapchat Location Card Overlay) */}
      {selectedCity && (
        <div className="absolute top-16 right-4 sm:top-16 sm:right-4 z-20 w-80 sm:w-88 bg-slate-900/95 border border-sky-500/30 rounded-3xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-right-4 duration-300 text-white relative">
          {/* Exit / Close Card Button */}
          <button
            onClick={() => setSelectedCity(null)}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800/80 hover:bg-rose-600/90 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition-all shadow-md z-30 cursor-pointer"
            title="Exit / Close Card"
            aria-label="Close City Spotlight Card"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative h-28 rounded-2xl overflow-hidden mb-3 border border-slate-800">
            <img
              src={selectedCity.image}
              alt={selectedCity.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute top-2 left-2 flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-bold text-sky-300 uppercase tracking-wider backdrop-blur-md">
              <MapPin className="w-3 h-3 text-sky-400" />
              <span>{selectedCity.country}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20 text-white font-bold ml-1">
                {selectedCity.scope === 'national' ? 'India' : 'International'}
              </span>
            </div>
            <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-serif-heading">
                  {selectedCity.name}
                </h3>
                <span className="text-[10px] text-slate-300">
                  {selectedCity.lat.toFixed(1)}° N, {selectedCity.lng.toFixed(1)}° E
                </span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/90 text-white shadow-sm">
                ~₹{selectedCity.averageCostPerDayINR.toLocaleString('en-IN')}/day
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mb-3">
            {selectedCity.description}
          </p>

          {/* Top Sights Pills */}
          <div className="mb-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Iconic Sights & Landmarks</span>
            </span>
            <div className="flex flex-wrap gap-1">
              {selectedCity.topSights.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-medium text-slate-200 border border-slate-700 truncate max-w-[150px]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Direct CTA Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => onAddCityToTrip && onAddCityToTrip(selectedCity)}
              className="px-3 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center justify-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Trip</span>
            </button>

            <button
              onClick={() => onSelectCity && onSelectCity(selectedCity.name)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center justify-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
              <span>Explore Sights</span>
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Bottom Navigation Dock (Three.js Skill Directive) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-2xl bg-slate-900/90 border border-slate-800/90 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md transition-all">
        {/* Toggle Collapse Edge */}
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800 text-[11px] font-semibold text-slate-400">
          <div className="flex items-center space-x-2">
            <span>Destination Radar:</span>
            <span className="text-[10px] text-sky-300 bg-sky-950/90 px-2 py-0.5 rounded-md border border-sky-800/60 font-bold">
              {GLOBE_CITIES.filter(c => c.scope === activeScope).length} {activeScope === 'national' ? 'Indian Cities (Domestic)' : 'International Destinations'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Auto rotate toggle */}
            <button
              onClick={toggleAutoRotate}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer text-xs flex items-center space-x-1 ${
                isAutoRotating
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title={isAutoRotating ? 'Pause Auto-Spin' : 'Start Auto-Spin'}
            >
              {isAutoRotating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span className="text-[10px] font-bold">{isAutoRotating ? 'Spinning' : 'Paused'}</span>
            </button>

            {/* Zoom Controls */}
            <button
              onClick={() => handleZoom('in')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleZoom('out')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>

            {/* Reset View */}
            <button
              onClick={handleResetView}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              title="Reset Globe View"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            <button
              onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {isControlsCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* City Chips Row - Strictly Scoped */}
        {!isControlsCollapsed && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar animate-in fade-in duration-200">
            {GLOBE_CITIES.filter(c => c.scope === activeScope).map((city) => {
              const isCurrent = selectedCity?.id === city.id;
              return (
                <button
                  key={city.id}
                  onClick={() => flyToCity(city)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                    isCurrent
                      ? activeScope === 'national'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30 scale-105'
                        : 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/30 scale-105'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: city.color }}
                  />
                  <span>{city.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
