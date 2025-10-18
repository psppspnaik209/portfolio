import * as THREE from 'three';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import {
  Body,
  Box,
  Quaternion as CannonQuaternion,
  Vec3,
  World,
} from 'cannon-es';
import {
  CenterlineSample,
  GameSettings,
  HUDData,
  KeyAction,
  KeyBindings,
  RacerGameCallbacks,
} from './types';

interface SynthwaveRacerOptions {
  keyBindings: KeyBindings;
  settings: GameSettings;
  isMobile: boolean;
}

interface InternalInputState {
  throttle: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  restart: boolean;
}

const TRACK_HALF_WIDTH = 6;
const CENTERLINE_SAMPLES = 480;
const BOOST_BUILD_RATE = 0.35;
const BOOST_DECAY_RATE = 0.45;
const BOOST_DRAIN_RATE = 0.7;
const BASE_MAX_SPEED = 52; // meters per second (~187 km/h)
const BOOST_SPEED_MULTIPLIER = 0.65;
const BASE_ACCELERATION = 38;
const BRAKE_FORCE = 80;
const DRAG_COEFFICIENT = 0.12;
const TURN_RATE = 1.7;
const FIXED_TIME_STEP = 1 / 120;
const HUD_UPDATE_INTERVAL = 0.05;
const MAX_RUN_DURATION = 70;
const OFF_TRACK_DNF_THRESHOLD = 6;

const DEFAULT_INPUT_STATE: InternalInputState = {
  throttle: false,
  brake: false,
  left: false,
  right: false,
  restart: false,
};

export class SynthwaveRacerGame {
  private readonly container: HTMLDivElement;
  private readonly callbacks: RacerGameCallbacks;
  private readonly renderer: any;
  private readonly scene: any;
  private readonly camera: any;
  private readonly world: World;
  private readonly ambientLight: any;

  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private afterimagePass: AfterimagePass | null = null;
  private renderPass: RenderPass | null = null;

  private animationFrameId = 0;
  private lastTimestamp = performance.now() / 1000;
  private accumulator = 0;
  private hudTimer = 0;

  private carBody: Body;
  private carMesh: any;
  private carYaw = 0;
  private speed = 0;

  private runActive = false;
  private runStartTime = 0;
  private runId = 0;
  private retries = 0;
  private bestTime: number | null = null;
  private offTrackTime = 0;
  private boostUptime = 0;
  private boost = 0;
  private lapProgress = 0;
  private lastLapProgress = 0;
  private dnfTriggered = false;

  private keyBindings: KeyBindings;
  private readonly inputState: InternalInputState = { ...DEFAULT_INPUT_STATE };
  private readonly virtualInputState: InternalInputState = {
    ...DEFAULT_INPUT_STATE,
  };
  private hardwareInputEnabled = true;

  private readonly tempVec3 = new THREE.Vector3();
  private readonly tempVec3B = new THREE.Vector3();
  private readonly tempVec3C = new THREE.Vector3();
  private readonly tempVecCannon = new Vec3();
  private readonly tempVecCannonB = new Vec3();

  private readonly centerline: any;
  private readonly centerlineSamples: CenterlineSample[];
  private readonly trackLength: number;
  private lastCenterlineSample = 0;

  private readonly chaseTarget = new THREE.Vector3();
  private readonly chaseCurrent = new THREE.Vector3();

  private readonly listener: any;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineOscillator: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private boostOscillator: OscillatorNode | null = null;
  private boostGain: GainNode | null = null;
  private skidNoiseBuffer: AudioBuffer | null = null;
  private skidSource: AudioBufferSourceNode | null = null;
  private skidGain: GainNode | null = null;
  private audioReady = false;

  private settings: GameSettings;
  private disposed = false;

  private readonly resizeObserver: ResizeObserver;

  private readonly isMobile: boolean;

  constructor(
    container: HTMLDivElement,
    options: SynthwaveRacerOptions,
    callbacks: RacerGameCallbacks,
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.keyBindings = options.keyBindings;
    this.settings = options.settings;
    this.isMobile = options.isMobile;

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, options.isMobile ? 1.2 : 1.5),
    );
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setSize(width * this.settings.renderScale, height * this.settings.renderScale, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.zIndex = '0';
    this.renderer.shadowMap.enabled = false;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05010f);
    this.scene.fog = new THREE.FogExp2(0x08011a, 0.008);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500);
    this.camera.position.set(0, 6, 12);

    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);

    this.ambientLight = new THREE.HemisphereLight(0x6622ff, 0x110022, 0.8);
    this.scene.add(this.ambientLight);
    const fillLight = new THREE.AmbientLight(0x442266, 0.35);
    this.scene.add(fillLight);
    const dirLight = new THREE.DirectionalLight(0xff33aa, 0.2);
    dirLight.position.set(50, 100, 20);
    this.scene.add(dirLight);

    this.world = new World({
      gravity: new Vec3(0, -9.82, 0),
    });
    this.world.allowSleep = true;

    this.centerline = this.createCenterline();
    const { samples, length } = this.precomputeCenterlineSamples();
    this.centerlineSamples = samples;
    this.trackLength = length;

    this.addEnvironment();

    this.carBody = this.createCarBody();
    this.carMesh = this.createCarMesh();
    this.scene.add(this.carMesh);
    this.world.addBody(this.carBody);

    this.buildTrackPhysics();
    this.resetCarState();

    if (!this.isMobile) {
      this.setupPostProcessing(width, height);
    } else {
      this.composer = null;
    }

    this.registerEvents();

    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(container);

    this.updateHUD(true);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  startRun(): void {
    if (this.runActive) {
      return;
    }
    this.ensureAudio();
    this.runActive = true;
    this.dnfTriggered = false;
    this.runStartTime = performance.now() / 1000;
    this.boost = 0;
    this.boostUptime = 0;
    this.offTrackTime = 0;
    this.lapProgress = 0;
    this.lastLapProgress = 0;
    this.runId += 1;
    this.retries = 0;
  }

  restartRun(manual = false): void {
    if (manual) {
      this.retries += 1;
    }
    this.resetCarState();
    this.runActive = false;
    this.boost = 0;
    this.boostUptime = 0;
    this.offTrackTime = 0;
    this.lapProgress = 0;
    this.lastLapProgress = 0;
    this.dnfTriggered = false;
    this.updateHUD(true);
  }

  setKeyBindings(bindings: KeyBindings): void {
    this.keyBindings = bindings;
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
    if (this.composer && this.bloomPass && this.afterimagePass) {
      this.bloomPass.enabled = settings.bloom;
      this.afterimagePass.enabled = settings.motionBlur;
    }
    this.renderer.setSize(
      Math.max(this.container.clientWidth, 1) * settings.renderScale,
      Math.max(this.container.clientHeight, 1) * settings.renderScale,
      false,
    );
    if (this.composer && this.bloomPass) {
      this.composer.setSize(
        Math.max(this.container.clientWidth, 1) * settings.renderScale,
        Math.max(this.container.clientHeight, 1) * settings.renderScale,
      );
      this.bloomPass.setSize(
        Math.max(this.container.clientWidth, 1) * settings.renderScale,
        Math.max(this.container.clientHeight, 1) * settings.renderScale,
      );
    }
  }

  setVirtualInput(action: KeyAction, active: boolean): void {
    this.virtualInputState[action] = active;
    if (action === 'restart' && active) {
      this.restartRun(true);
      this.startRun();
    }
  }

  setHardwareInputEnabled(enabled: boolean): void {
    this.hardwareInputEnabled = enabled;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    cancelAnimationFrame(this.animationFrameId);
    this.resizeObserver.disconnect();
    this.removeEvents();
    this.scene.remove(this.carMesh);
    this.carMesh.traverse((child: any) => {
      if ((child as any).isMesh) {
        const mesh = child as any;
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material: any) => material.dispose());
        } else {
          (mesh.material as any).dispose();
        }
      }
    });
    this.renderer.dispose();
    if (this.composer) {
      this.composer.dispose();
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => undefined);
    }
  }

  private createCenterline(): any {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(32, 0, -18),
      new THREE.Vector3(62, 0, -4),
      new THREE.Vector3(58, 0, 26),
      new THREE.Vector3(28, 0, 42),
      new THREE.Vector3(-10, 0, 48),
      new THREE.Vector3(-46, 0, 32),
      new THREE.Vector3(-60, 0, -4),
      new THREE.Vector3(-38, 0, -36),
      new THREE.Vector3(-4, 0, -42),
    ];
    const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.55);
    return curve;
  }

  private precomputeCenterlineSamples(): {
    samples: CenterlineSample[];
    length: number;
  } {
    const points = this.centerline.getSpacedPoints(CENTERLINE_SAMPLES - 1);
    const samples: CenterlineSample[] = [];
    let distance = 0;
    for (let i = 0; i < points.length; i += 1) {
      if (i > 0) {
        distance += points[i].distanceTo(points[i - 1]);
      }
      const t = i / (points.length - 1);
      const tangent = this.centerline.getTangent(t).normalize();
      samples.push({
        point: points[i].clone(),
        tangent,
        distance,
        t,
      });
    }
    return { samples, length: distance };
  }

  private addEnvironment(): void {
    this.addTrackMesh();
    this.addCenterline();
    this.addRunoffBarriers();
    this.addBackdrop();
    this.addGroundPlane();
    this.addAmbientFX();
  }

  private createTrackTexture(): any {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return new THREE.Texture();
    }
    ctx.fillStyle = '#060013';
    ctx.fillRect(0, 0, size, size);
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#150033');
    gradient.addColorStop(0.5, '#1b0048');
    gradient.addColorStop(1, '#12002b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = 'rgba(255, 0, 170, 0.08)';
    for (let i = 0; i < 6; i += 1) {
      ctx.fillRect(0, i * 40 + 12, size, 8);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 2);
    return texture;
  }

  private addTrackMesh(): void {
    const trackShape = new THREE.Shape();
    const halfWidth = TRACK_HALF_WIDTH;
    const bermHeight = 0.35;
    trackShape.moveTo(-halfWidth, 0);
    trackShape.lineTo(halfWidth, 0);
    trackShape.lineTo(halfWidth, -bermHeight);
    trackShape.lineTo(-halfWidth, -bermHeight);
    trackShape.lineTo(-halfWidth, 0);

    const trackGeometry = new THREE.ExtrudeGeometry(trackShape, {
      steps: CENTERLINE_SAMPLES,
      bevelEnabled: false,
      extrudePath: this.centerline,
    });

    const trackMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x0b021a),
      emissive: new THREE.Color(0x3a0a62),
      emissiveIntensity: 0.8,
      map: this.createTrackTexture(),
      metalness: 0.2,
      roughness: 0.65,
    });

    trackMaterial.onBeforeCompile = (shader: any) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>
        float glow = smoothstep(0.2, 0.9, vUv.x);
        totalEmissiveRadiance += vec3(0.25, 0.0, 0.45) * glow * 0.6;
      `,
      );
    };

    const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
    trackMesh.castShadow = false;
    trackMesh.receiveShadow = true;
    trackMesh.frustumCulled = true;
    this.scene.add(trackMesh);
  }

  private addCenterline(): void {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      this.centerlineSamples.map((sample) => sample.point),
    );
    const material = new THREE.LineDashedMaterial({
      color: 0xff33cc,
      linewidth: 1,
      scale: 1,
      dashSize: 3,
      gapSize: 1,
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    line.frustumCulled = true;
    this.scene.add(line);
  }

  private addRunoffBarriers(): void {
    const barrierGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 6);
    const barrierMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0099,
    });
    const instances = CENTERLINE_SAMPLES;
    const instanced = new THREE.InstancedMesh(
      barrierGeometry,
      barrierMaterial,
      instances * 2,
    );
    const matrix = new THREE.Matrix4();
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < instances; i += 1) {
      const sample = this.centerlineSamples[i];
      const point = sample.point as any;
      const tangent = sample.tangent as any;
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x)
        .normalize()
        .multiplyScalar(TRACK_HALF_WIDTH + 0.8);
      matrix.lookAt(point, point.clone().add(tangent), up);
      matrix.setPosition(point.x + normal.x, 0.8, point.z + normal.z);
      instanced.setMatrixAt(i * 2, matrix);

      matrix.setPosition(point.x - normal.x, 0.8, point.z - normal.z);
      instanced.setMatrixAt(i * 2 + 1, matrix);
    }
    instanced.instanceMatrix.needsUpdate = true;
    instanced.frustumCulled = false;
    this.scene.add(instanced);
  }

  private addBackdrop(): void {
    const atlasTexture = this.createBackdropTexture();
    const material = new THREE.MeshStandardMaterial({
      map: atlasTexture,
      emissive: new THREE.Color(0x331155),
      emissiveIntensity: 0.6,
      roughness: 0.8,
      metalness: 0.05,
    });

    const baseGeometry = new THREE.BoxGeometry(3, 15, 3);
    for (let i = 0; i < 60; i += 1) {
      const lod = new THREE.LOD();
      const meshHigh = new THREE.Mesh(baseGeometry, material);
      meshHigh.frustumCulled = true;
      lod.addLevel(meshHigh, 0);

      const meshLow = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 7, 2.4),
        material,
      );
      lod.addLevel(meshLow, 80);

      const angle = (i / 60) * Math.PI * 2;
      const radius = 120 + Math.random() * 40;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      lod.position.set(x, meshHigh.geometry.parameters.height / 2, z);
      lod.rotation.y = angle + Math.random() * 0.5;
      this.scene.add(lod);
    }

    const sunGeometry = new THREE.CircleGeometry(14, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xff2266,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 30, -110);
    this.scene.add(sun);
  }

  private createBackdropTexture(): any {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return new THREE.Texture();
    }
    ctx.fillStyle = '#080022';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff00aa';
    for (let i = 0; i < 8; i += 1) {
      const width = 20 + Math.random() * 20;
      const height = 10 + Math.random() * 60;
      ctx.globalAlpha = 0.4 + Math.random() * 0.4;
      ctx.fillRect(
        Math.random() * (canvas.width - width),
        canvas.height - height - Math.random() * 20,
        width,
        height,
      );
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }

  private addGroundPlane(): void {
    const groundGeometry = new THREE.PlaneGeometry(400, 400, 1, 1);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x04000a,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.4, 0);
    ground.receiveShadow = false;
    ground.frustumCulled = false;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(400, 80, 0x220055, 0x110022);
    (grid.material as any).opacity = 0.15;
    (grid.material as any).transparent = true;
    grid.position.y = -0.39;
    this.scene.add(grid);
  }

  private addAmbientFX(): void {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = Math.random() * 120 + 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    starGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3),
    );
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.6,
      opacity: 0.6,
      transparent: true,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.frustumCulled = false;
    this.scene.add(stars);
  }

  private createCarBody(): Body {
    const body = new Body({
      mass: 650,
      position: new Vec3(0, 0.5, 0),
      fixedRotation: true,
      linearDamping: 0.15,
    });
    const shape = new Box(new Vec3(0.6, 0.35, 1.2));
    body.addShape(shape);
    body.allowSleep = false;
    return body;
  }

  private createCarMesh(): any {
    const carGroup = new THREE.Group();
    const bodyGeometry = new THREE.BoxGeometry(1.2, 0.4, 2.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1111ff,
      emissive: 0x4400ff,
      emissiveIntensity: 0.8,
      metalness: 0.6,
      roughness: 0.3,
    });
    const chassis = new THREE.Mesh(bodyGeometry, bodyMaterial);
    chassis.position.y = 0.35;
    carGroup.add(chassis);

    const canopyGeometry = new THREE.BoxGeometry(0.9, 0.35, 1.1);
    const canopyMaterial = new THREE.MeshStandardMaterial({
      color: 0x6600ff,
      emissive: 0x8800ff,
      emissiveIntensity: 0.4,
      metalness: 0.2,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8,
    });
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.set(0, 0.6, -0.1);
    carGroup.add(canopy);

    const wheelGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.25, 12);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x060606,
      emissive: 0x220033,
      emissiveIntensity: 0.2,
      roughness: 0.8,
    });

    const wheelOffsets: [number, number, number][] = [
      [-0.65, 0.18, 1],
      [0.65, 0.18, 1],
      [-0.65, 0.18, -1],
      [0.65, 0.18, -1],
    ];

    wheelOffsets.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, y, z);
      carGroup.add(wheel);
    });

    const neonGeometry = new THREE.PlaneGeometry(1.1, 2.5);
    const neonMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00aa,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const neon = new THREE.Mesh(neonGeometry, neonMaterial);
    neon.position.set(0, 0.05, 0);
    neon.rotation.x = Math.PI / 2;
    carGroup.add(neon);

    return carGroup;
  }

  private buildTrackPhysics(): void {
    const groundBody = new Body({
      mass: 0,
      position: new Vec3(0, 0, 0),
      shape: new Box(new Vec3(220, 0.05, 220)),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0, 'XYZ');
    this.world.addBody(groundBody);
  }

  private setupPostProcessing(width: number, height: number): void {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.7,
      0.45,
      0.85,
    );
    this.bloomPass.threshold = 0.1;
    this.bloomPass.radius = 0.5;
    this.bloomPass.enabled = this.settings.bloom;
    this.composer.addPass(this.bloomPass);

    this.afterimagePass = new AfterimagePass();
    this.afterimagePass.uniforms.damp.value = 0.92;
    this.afterimagePass.enabled = this.settings.motionBlur;
    this.composer.addPass(this.afterimagePass);
  }

  private registerEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown, {
      passive: false,
    });
    window.addEventListener('keyup', this.handleKeyUp, {
      passive: false,
    });
    window.addEventListener('blur', this.handleWindowBlur);
  }

  private removeEvents(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (!this.hardwareInputEnabled) {
      return;
    }
    if (this.matchBinding('throttle', event.code)) {
      event.preventDefault();
      this.inputState.throttle = true;
    }
    if (this.matchBinding('brake', event.code)) {
      event.preventDefault();
      this.inputState.brake = true;
    }
    if (this.matchBinding('left', event.code)) {
      event.preventDefault();
      this.inputState.left = true;
    }
    if (this.matchBinding('right', event.code)) {
      event.preventDefault();
      this.inputState.right = true;
    }
    if (this.matchBinding('restart', event.code)) {
      event.preventDefault();
      this.restartRun(true);
      this.startRun();
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent) => {
    if (!this.hardwareInputEnabled) {
      return;
    }
    if (this.matchBinding('throttle', event.code)) {
      event.preventDefault();
      this.inputState.throttle = false;
    }
    if (this.matchBinding('brake', event.code)) {
      event.preventDefault();
      this.inputState.brake = false;
    }
    if (this.matchBinding('left', event.code)) {
      event.preventDefault();
      this.inputState.left = false;
    }
    if (this.matchBinding('right', event.code)) {
      event.preventDefault();
      this.inputState.right = false;
    }
  };

  private readonly handleWindowBlur = () => {
    this.resetInputs();
  };

  private matchBinding(action: KeyAction, code: string): boolean {
    return this.keyBindings[action].includes(code);
  }

  private resetInputs(): void {
    Object.assign(this.inputState, DEFAULT_INPUT_STATE);
    Object.assign(this.virtualInputState, DEFAULT_INPUT_STATE);
  }

  private loop = () => {
    if (this.disposed) {
      return;
    }
    const now = performance.now() / 1000;
    const delta = Math.min(now - this.lastTimestamp, 0.12);
    this.lastTimestamp = now;
    this.accumulator += delta;

    const effectiveTimeStep = FIXED_TIME_STEP;
    while (this.accumulator >= effectiveTimeStep) {
      this.stepPhysics(effectiveTimeStep);
      this.accumulator -= effectiveTimeStep;
    }

    this.updateVisuals();
    this.dispatchHUD(delta);

    try {
      if (this.composer) {
        this.composer.render(delta);
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    } catch (error) {
      console.warn('Post-processing failed, falling back to direct render.', error);
      this.composer = null;
      this.renderer.render(this.scene, this.camera);
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private stepPhysics(dt: number): void {
    const throttle =
      this.inputState.throttle || this.virtualInputState.throttle;
    const brake = this.inputState.brake || this.virtualInputState.brake;
    const left = this.inputState.left || this.virtualInputState.left;
    const right = this.inputState.right || this.virtualInputState.right;
    const steering = (right ? 1 : 0) - (left ? 1 : 0);

    const maxSpeed =
      BASE_MAX_SPEED * (1 + this.boost * BOOST_SPEED_MULTIPLIER);
    if (throttle) {
      this.speed = Math.min(
        maxSpeed,
        this.speed + BASE_ACCELERATION * dt * (this.boost > 0.6 ? 1.2 : 1),
      );
    } else {
      this.speed = Math.max(this.speed - DRAG_COEFFICIENT * this.speed * dt, 0);
    }

    if (brake) {
      this.speed = Math.max(0, this.speed - BRAKE_FORCE * dt);
    }

    this.speed = Math.max(
      0,
      this.speed - DRAG_COEFFICIENT * this.speed * dt * (brake ? 1.9 : 1.1),
    );

    const speedRatio = THREE.MathUtils.clamp(this.speed / BASE_MAX_SPEED, 0, 1);
    const turnRate =
      TURN_RATE * (0.6 + speedRatio * 0.8) * (1 + this.boost * 0.25);
    this.carYaw += steering * turnRate * dt;

    const forward = this.tempVecCannon;
    forward.set(Math.sin(this.carYaw), 0, Math.cos(this.carYaw));
    const lateral = this.tempVecCannonB;
    lateral.set(forward.z, 0, -forward.x);

    this.carBody.velocity.x = forward.x * this.speed;
    this.carBody.velocity.y = 0;
    this.carBody.velocity.z = forward.z * this.speed;

    // apply lateral damping for arcade traction feel
    const lateralSpeed =
      this.carBody.velocity.x * lateral.x +
      this.carBody.velocity.z * lateral.z;
    this.carBody.velocity.x -= lateralSpeed * lateral.x * 0.2;
    this.carBody.velocity.z -= lateralSpeed * lateral.z * 0.2;

    const quat = new CannonQuaternion();
    quat.setFromEuler(0, this.carYaw, 0, 'XYZ');
    this.carBody.quaternion.copy(quat);

    this.world.step(FIXED_TIME_STEP, dt, 2);

    const carPos = this.carBody.position;
    carPos.y = 0.4;

    this.evaluateCenterline(dt);
    this.updateBoost(dt);
    this.checkRunState();
    this.updateAudioState();
  }

  private evaluateCenterline(dt: number): void {
    const position = this.tempVec3.set(
      this.carBody.position.x,
      this.carBody.position.y,
      this.carBody.position.z,
    );
    let closestIndex = this.lastCenterlineSample;
    let minDistSq = Number.POSITIVE_INFINITY;
    const windowSize = 40;
    const start = Math.max(0, closestIndex - windowSize);
    const end = Math.min(this.centerlineSamples.length - 1, closestIndex + windowSize);
    for (let i = start; i <= end; i += 1) {
      const distSq = position.distanceToSquared(
        this.centerlineSamples[i].point,
      );
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closestIndex = i;
      }
    }
    this.lastCenterlineSample = closestIndex;
    const sample = this.centerlineSamples[closestIndex];

    const offset = this.tempVec3B.copy(position).sub(sample.point);
    const lateralDir = this.tempVec3C
      .set(-sample.tangent.z, 0, sample.tangent.x)
      .normalize();
    const lateralOffset = THREE.MathUtils.clamp(
      offset.dot(lateralDir),
      -TRACK_HALF_WIDTH * 2,
      TRACK_HALF_WIDTH * 2,
    );

    const runDistance = sample.distance;
    this.lapProgress = THREE.MathUtils.clamp(
      runDistance / this.trackLength,
      0,
      1,
    );

    const forward = new THREE.Vector3(
      Math.sin(this.carYaw),
      0,
      Math.cos(this.carYaw),
    ).normalize();
    const alignment = forward.dot(sample.tangent);
    const alignmentAngle = Math.acos(THREE.MathUtils.clamp(alignment, -1, 1));

    const onLine =
      Math.abs(lateralOffset) < TRACK_HALF_WIDTH * 0.45 &&
      alignmentAngle < THREE.MathUtils.degToRad(9);

    if (onLine && this.speed > 6) {
      this.boost = Math.min(1, this.boost + BOOST_BUILD_RATE * dt);
      this.boostUptime += dt;
    } else {
      const decay = Math.abs(lateralOffset) > TRACK_HALF_WIDTH
        ? BOOST_DRAIN_RATE
        : BOOST_DECAY_RATE;
      this.boost = Math.max(0, this.boost - decay * dt);
    }

    if (Math.abs(lateralOffset) > TRACK_HALF_WIDTH * 0.8) {
      this.offTrackTime += dt;
    }
  }

  private updateBoost(dt: number): void {
    if (this.boost > 0.05) {
      this.speed = Math.min(
        this.speed + (BASE_ACCELERATION * 0.4 + this.boost * 12) * dt,
        BASE_MAX_SPEED * (1 + this.boost * BOOST_SPEED_MULTIPLIER),
      );
    }
  }

  private checkRunState(): void {
    if (!this.runActive) {
      return;
    }
    const now = performance.now() / 1000;
    const duration = now - this.runStartTime;
    if (
      !this.dnfTriggered &&
      (duration > MAX_RUN_DURATION || this.offTrackTime > OFF_TRACK_DNF_THRESHOLD)
    ) {
      this.dnfTriggered = true;
      this.onRunComplete(duration, true);
      return;
    }

    if (
      this.lastLapProgress > 0.85 &&
      this.lapProgress < 0.15 &&
      duration > 8
    ) {
      this.onRunComplete(duration, false);
      return;
    }

    this.lastLapProgress = this.lapProgress;
  }

  private onRunComplete(duration: number, dnf: boolean): void {
    this.runActive = false;
    if (!dnf) {
      if (!this.bestTime || duration < this.bestTime) {
        this.bestTime = duration;
      }
    }
    this.callbacks.onRunComplete(
      {
        runId: this.runId,
        duration,
        boostUptimeRatio:
          this.boostUptime / Math.max(duration, Number.EPSILON),
        offTrackRatio:
          this.offTrackTime / Math.max(duration, Number.EPSILON),
        retries: this.retries,
        dnf,
        timestamp: Date.now(),
      },
      this.bestTime,
    );
    this.restartRun(false);
    setTimeout(() => {
      if (!this.disposed) {
        this.startRun();
      }
    }, 400);
  }

  private updateVisuals(): void {
    this.carMesh.position.set(
      this.carBody.position.x,
      this.carBody.position.y,
      this.carBody.position.z,
    );
    this.carMesh.rotation.y = this.carYaw;
    this.carMesh.rotation.z = THREE.MathUtils.lerp(
      this.carMesh.rotation.z,
      (this.inputState.left || this.virtualInputState.left
        ? 0.08
        : 0) -
        (this.inputState.right || this.virtualInputState.right ? 0.08 : 0),
      0.2,
    );

    const target = this.chaseTarget.set(
      this.carBody.position.x - Math.sin(this.carYaw) * 8,
      4.2 + THREE.MathUtils.clamp(this.speed / 60, 0, 1.5),
      this.carBody.position.z - Math.cos(this.carYaw) * 8,
    );
    this.chaseCurrent.lerp(target, this.isMobile ? 0.08 : 0.12);

    this.camera.position.copy(this.chaseCurrent);
    const lookTarget = this.tempVec3.set(
      this.carBody.position.x,
      this.carBody.position.y + 1.2,
      this.carBody.position.z,
    );
    this.camera.lookAt(lookTarget);
    this.camera.rotation.z = THREE.MathUtils.lerp(
      this.camera.rotation.z,
      THREE.MathUtils.degToRad(
        (this.inputState.right || this.virtualInputState.right ? -6 : 0) +
          (this.inputState.left || this.virtualInputState.left ? 6 : 0),
      ),
      0.1,
    );
  }

  private dispatchHUD(delta: number): void {
    this.hudTimer += delta;
    if (this.hudTimer < HUD_UPDATE_INTERVAL) {
      return;
    }
    this.hudTimer = 0;
    this.updateHUD();
  }

  private updateHUD(force = false): void {
    const now = performance.now() / 1000;
    const runtime = this.runActive ? now - this.runStartTime : 0;
    const boostRatio =
      runtime > 0 ? this.boostUptime / Math.max(runtime, Number.EPSILON) : 0;
    const offTrackRatio =
      runtime > 0 ? this.offTrackTime / Math.max(runtime, Number.EPSILON) : 0;

    const hud: HUDData = {
      boost: this.boost,
      speedKph: this.speed * 3.6,
      currentTime: runtime,
      bestTime: this.bestTime,
      lapProgress: this.lapProgress,
      boostUptimeRatio: boostRatio,
      offTrackRatio,
      runActive: this.runActive,
    };

    if (force || !this.runActive || runtime >= 0) {
      this.callbacks.onHUDUpdate(hud);
    }
  }

  private resetCarState(): void {
    this.speed = 0;
    this.carYaw = 0;
    this.carBody.position.set(0, 0.4, 0);
    this.carBody.velocity.setZero();
    this.carBody.angularVelocity.setZero();
    this.carBody.quaternion.setFromEuler(0, 0, 0, 'XYZ');
    this.chaseCurrent.set(0, 4.5, 8);
    this.chaseTarget.copy(this.chaseCurrent);
  }

  private ensureAudio(): void {
    if (this.audioReady) {
      return;
    }
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;
      if (!AudioContextClass) {
        this.audioReady = false;
        return;
      }
      const context = this.audioContext || new AudioContextClass();
      context.resume().catch(() => undefined);
      this.audioContext = context;
      this.masterGain = context.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(context.destination);

      this.engineOscillator = context.createOscillator();
      this.engineGain = context.createGain();
      this.engineGain.gain.value = 0;
      this.engineOscillator.type = 'sawtooth';
      this.engineOscillator.frequency.value = 40;
      this.engineOscillator.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);
      this.engineOscillator.start();

      this.boostOscillator = context.createOscillator();
      this.boostGain = context.createGain();
      this.boostOscillator.type = 'triangle';
      this.boostOscillator.frequency.value = 220;
      this.boostGain.gain.value = 0;
      this.boostOscillator.connect(this.boostGain);
      this.boostGain.connect(this.masterGain);
      this.boostOscillator.start();

      this.skidGain = context.createGain();
      this.skidGain.gain.value = 0;
      this.skidGain.connect(this.masterGain);
      this.createSkidNoiseBuffer(context);

      this.audioReady = true;
    } catch (error) {
      console.warn('Audio initialization failed', error);
      this.audioReady = false;
    }
  }

  private createSkidNoiseBuffer(context: AudioContext): void {
    const bufferSize = context.sampleRate;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    this.skidNoiseBuffer = buffer;
  }

  private updateAudioState(): void {
    if (!this.audioReady || !this.audioContext || !this.masterGain) {
      return;
    }
    const speedRatio = THREE.MathUtils.clamp(this.speed / BASE_MAX_SPEED, 0, 1);

    if (this.engineOscillator && this.engineGain) {
      this.engineOscillator.frequency.linearRampToValueAtTime(
        80 + speedRatio * 520,
        this.audioContext.currentTime + 0.05,
      );
      this.engineGain.gain.linearRampToValueAtTime(
        0.18 + speedRatio * 0.22,
        this.audioContext.currentTime + 0.03,
      );
    }

    if (this.boostOscillator && this.boostGain) {
      this.boostGain.gain.linearRampToValueAtTime(
        this.boost * 0.35,
        this.audioContext.currentTime + 0.05,
      );
      this.boostOscillator.frequency.linearRampToValueAtTime(
        220 + this.boost * 440,
        this.audioContext.currentTime + 0.05,
      );
    }

    const lateralSlip =
      Math.abs(this.carBody.velocity.x * Math.cos(this.carYaw) -
        this.carBody.velocity.z * Math.sin(this.carYaw)) / 12;

    if (this.skidGain && this.skidNoiseBuffer) {
      const skidVolume = THREE.MathUtils.clamp(
        lateralSlip + (this.inputState.brake ? 0.2 : 0),
        0,
        1,
      );
      this.skidGain.gain.linearRampToValueAtTime(
        skidVolume * 0.2,
        this.audioContext.currentTime + 0.05,
      );
      if (skidVolume > 0.3 && this.audioContext && this.skidSource === null) {
        this.skidSource = this.audioContext.createBufferSource();
        this.skidSource.buffer = this.skidNoiseBuffer;
        this.skidSource.loop = true;
        this.skidSource.connect(this.skidGain);
        this.skidSource.onended = () => {
          this.skidSource = null;
        };
        this.skidSource.start();
      } else if (skidVolume < 0.1 && this.skidSource) {
        this.skidSource.stop();
        this.skidSource.disconnect();
        this.skidSource = null;
      }
    }
  }

  private handleResize(): void {
    if (this.disposed) {
      return;
    }
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(
      width * this.settings.renderScale,
      height * this.settings.renderScale,
      false,
    );
    if (this.composer && this.bloomPass) {
      this.composer.setSize(
        width * this.settings.renderScale,
        height * this.settings.renderScale,
      );
      this.bloomPass.setSize(
        width * this.settings.renderScale,
        height * this.settings.renderScale,
      );
    }
  }
}
