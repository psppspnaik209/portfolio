import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {
  Body,
  Box,
  Quaternion as CannonQuaternion,
  Vec3,
  World,
} from 'cannon-es';
import {
  AudioSettings,
  CenterlineSample,
  GameSettings,
  HUDData,
  KeyAction,
  KeyBindings,
  RacerGameCallbacks,
  TrackDefinition,
  TrackTheme,
} from './types';

interface SynthwaveRacerOptions {
  keyBindings: KeyBindings;
  settings: GameSettings;
  isMobile: boolean;
  track: TrackDefinition;
}

interface InternalInputState {
  throttle: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  restart: boolean;
}

const TRACK_HALF_WIDTH = 6.5;
const CENTERLINE_SAMPLES = 480;
const BOOST_BUILD_RATE = 0.35;
const BOOST_DECAY_RATE = 0.45;
const BOOST_DRAIN_RATE = 0.58;
const BASE_MAX_SPEED = 64;
const BOOST_SPEED_MULTIPLIER = 0.5;
const BASE_ACCELERATION = 26;
const BRAKE_FORCE = 96;
const DRAG_COEFFICIENT = 0.1;
const TURN_RATE = 2.05;
const FIXED_TIME_STEP = 1 / 120;
const HUD_UPDATE_INTERVAL = 0.05;
const MAX_RUN_DURATION = 70;
const OFF_TRACK_DNF_THRESHOLD = 15;

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
  private fillLight: any;
  private directionalLight: any;

  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
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

  private track: TrackDefinition;
  private centerline: any;
  private centerlineSamples: CenterlineSample[] = [];
  private trackLength = 0;
  private lastCenterlineSample = 0;
  private trackGroup: any = null;
  private lastSafeSampleIndex = 0;
  private readonly lastSafePosition = new THREE.Vector3();
  private readonly lastSafeTangent = new THREE.Vector3(0, 0, 1);
  private offTrackTimer = 0;

  private readonly chaseTarget = new THREE.Vector3();
  private readonly chaseCurrent = new THREE.Vector3();

  private readonly listener: any;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineOscillator: OscillatorNode | null = null;
  private engineHarmonic: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineNoise: AudioBufferSourceNode | null = null;
  private engineNoiseGain: GainNode | null = null;
  private boostOscillator: OscillatorNode | null = null;
  private boostGain: GainNode | null = null;
  private skidNoiseBuffer: AudioBuffer | null = null;
  private skidSource: AudioBufferSourceNode | null = null;
  private skidGain: GainNode | null = null;
  private audioReady = false;
  private musicGain: GainNode | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicPlaylist: string[] = [];
  private musicCache = new Map<string, AudioBuffer>();
  private musicIndex = 0;
  private musicEnabled = true;
  private sfxEnabled = true;
  private musicVolume = 0.5;
  private sfxVolume = 0.5;
  private musicLoading = false;
  private gltfLoader: GLTFLoader | null = null;
  private throttleInput = 0;

  private settings: GameSettings;
  private disposed = false;

  private readonly resizeObserver: ResizeObserver;

  private readonly isMobile: boolean;
  private currentTheme: TrackTheme | undefined;

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
    this.fillLight = new THREE.AmbientLight(0x442266, 0.35);
    this.scene.add(this.fillLight);
    this.directionalLight = new THREE.DirectionalLight(0xff33aa, 0.2);
    this.directionalLight.position.set(50, 100, 20);
    this.scene.add(this.directionalLight);

    this.world = new World({
      gravity: new Vec3(0, -9.82, 0),
    });
    this.world.allowSleep = true;

    this.track = options.track;
    this.carBody = this.createCarBody();
    this.carMesh = this.createCarMesh();
    this.scene.add(this.carMesh);
    this.world.addBody(this.carBody);

    this.buildTrackPhysics();
    this.loadTrack(options.track, true);

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

  loadTrack(track: TrackDefinition, initial = false): void {
    if (this.disposed) {
      return;
    }
    this.track = track;
    this.currentTheme = track.theme;
    const points =
      track.centerline.length > 0
        ? track.centerline.map(
            ([x, z]) => new THREE.Vector3(x, 0, z),
          )
        : [new THREE.Vector3(0, 0, 0)];
    this.centerline = new THREE.CatmullRomCurve3(
      points,
      true,
      'catmullrom',
      0.6,
    );
    const { samples, length } = this.precomputeCenterlineSamples();
    this.centerlineSamples = samples;
    this.trackLength = length;
    this.lastCenterlineSample = 0;
    this.lastSafeSampleIndex = 0;
    if (samples.length > 0) {
      const first = samples[0];
      this.lastSafePosition.set(first.point.x, 0.4, first.point.z);
      this.lastSafeTangent.set(first.tangent.x, first.tangent.y, first.tangent.z);
    }
    this.offTrackTimer = 0;
    this.disposeTrackGroup();
    this.addEnvironment();
    if (this.carMesh) {
      this.resetCarState();
      if (!initial) {
        this.restartRun(false);
      } else {
        this.updateHUD(true);
      }
    }
    this.applyTrackTheme();
  }

  private disposeTrackGroup(): void {
    if (!this.trackGroup) {
      return;
    }
    this.scene.remove(this.trackGroup);
    this.trackGroup.traverse((child: any) => {
      if (child.isMesh) {
        child.geometry?.dispose?.();
        if (Array.isArray(child.material)) {
          child.material.forEach((mat: any) => mat?.dispose?.());
        } else {
          child.material?.dispose?.();
        }
      }
      if (child.isLine) {
        child.geometry?.dispose?.();
        child.material?.dispose?.();
      }
      if (child.isPoints) {
        child.geometry?.dispose?.();
        child.material?.dispose?.();
      }
    });
    this.trackGroup = null;
  }

  private applyTrackTheme(): void {
    const theme = this.currentTheme;
    const fogColor = theme?.fogColor ?? 0x08011a;
    const horizonColor = theme?.horizonColor ?? 0x05010f;
    this.scene.fog.color.setHex(fogColor);
    this.scene.background = new THREE.Color(horizonColor);
    if (this.ambientLight) {
      this.ambientLight.intensity = 0.8;
    }
    if (this.fillLight) {
      this.fillLight.intensity = 0.32;
    }
    if (this.directionalLight) {
      if (theme?.accentColor) {
        this.directionalLight.color.setHex(theme.accentColor);
      }
      this.directionalLight.intensity = 0.55;
    }
  }

  startRun(): void {
    if (this.runActive) {
      return;
    }
    this.ensureAudio();
    this.ensureMusic();
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
    if (this.composer && this.bloomPass) {
      this.bloomPass.enabled = settings.bloom;
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

  setAudioSettings(settings: AudioSettings): void {
    this.sfxVolume = settings.sfxVolume;
    this.musicVolume = settings.musicVolume;
    this.musicEnabled = settings.musicEnabled;
    this.sfxEnabled = settings.sfxEnabled;
    if (this.masterGain) {
      this.masterGain.gain.value = this.sfxEnabled ? this.sfxVolume : 0;
    }
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicEnabled ? this.musicVolume : 0;
    }
    if (this.musicEnabled) {
      this.ensureMusic();
    } else {
      this.stopMusic();
    }
  }

  setMusicLibrary(urls: string[]): void {
    this.musicPlaylist = urls.filter(Boolean);
    this.shufflePlaylist();
    this.musicIndex = 0;
    if (this.musicEnabled) {
      this.ensureMusic();
    }
  }

  private shufflePlaylist(): void {
    for (let i = this.musicPlaylist.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.musicPlaylist[i], this.musicPlaylist[j]] = [
        this.musicPlaylist[j],
        this.musicPlaylist[i],
      ];
    }
  }

  private ensureMusic(): void {
    if (!this.musicEnabled || this.musicPlaylist.length === 0) {
      return;
    }
    this.ensureAudio();
    if (!this.audioReady || !this.audioContext) {
      return;
    }
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicEnabled ? this.musicVolume : 0;
    }
    if (this.musicSource || this.musicLoading) {
      return;
    }
    this.playNextMusic().catch(() => undefined);
  }

  private stopMusic(): void {
    if (this.musicSource) {
      try {
        this.musicSource.stop();
      } catch (error) {
        console.warn('Failed stopping music', error);
      }
      this.musicSource.disconnect();
      this.musicSource = null;
    }
    this.musicLoading = false;
  }

  private async playNextMusic(): Promise<void> {
    if (!this.audioContext || !this.musicGain || this.musicPlaylist.length === 0) {
      return;
    }
    if (this.musicSource || this.musicLoading || !this.musicEnabled) {
      return;
    }
    this.musicLoading = true;
    try {
      const index = this.musicIndex % this.musicPlaylist.length;
      const url = this.musicPlaylist[index];
      this.musicIndex = (this.musicIndex + 1) % this.musicPlaylist.length;
      const buffer = await this.loadMusicBuffer(url);
      if (!buffer || !this.audioContext || !this.musicEnabled) {
        return;
      }
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.musicGain);
      this.musicSource = source;
      source.onended = () => {
        if (this.musicSource === source) {
          this.musicSource = null;
        }
        if (this.musicEnabled) {
          this.playNextMusic().catch(() => undefined);
        }
      };
      source.start(0);
    } catch (error) {
      console.warn('Unable to start music playback', error);
    } finally {
      this.musicLoading = false;
    }
  }

  private async loadMusicBuffer(url: string): Promise<AudioBuffer | null> {
    if (!this.audioContext) {
      return null;
    }
    if (this.musicCache.has(url)) {
      return this.musicCache.get(url) ?? null;
    }
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.musicCache.set(url, buffer);
      return buffer;
    } catch (error) {
      console.warn('Failed to load music buffer', error);
      return null;
    }
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    cancelAnimationFrame(this.animationFrameId);
    this.resizeObserver.disconnect();
    this.removeEvents();
    this.stopMusic();
    this.disposeTrackGroup();
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
    if (this.engineOscillator) {
      try {
        this.engineOscillator.stop();
      } catch (error) {
        console.warn('Failed stopping engineOscillator', error);
      }
      this.engineOscillator.disconnect();
      this.engineOscillator = null;
    }
    if (this.engineHarmonic) {
      try {
        this.engineHarmonic.stop();
      } catch (error) {
        console.warn('Failed stopping engineHarmonic', error);
      }
      this.engineHarmonic.disconnect();
      this.engineHarmonic = null;
    }
    if (this.engineNoise) {
      try {
        this.engineNoise.stop();
      } catch (error) {
        console.warn('Failed stopping engineNoise', error);
      }
      this.engineNoise.disconnect();
      this.engineNoise = null;
    }
    this.engineNoiseGain = null;
    this.engineFilter = null;
    this.engineGain = null;
    if (this.boostOscillator) {
      try {
        this.boostOscillator.stop();
      } catch (error) {
        console.warn('Failed stopping boostOscillator', error);
      }
      this.boostOscillator.disconnect();
      this.boostOscillator = null;
    }
    this.boostGain = null;
    this.renderer.dispose();
    if (this.composer) {
      this.composer.dispose();
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => undefined);
    }
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
    this.trackGroup = new THREE.Group();
    this.scene.add(this.trackGroup);
    this.addTrackMesh();
    this.addCenterline();
    this.addGuardRails();
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
    ctx.fillStyle = '#050012';
    ctx.fillRect(0, 0, size, size);
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#12002b');
    gradient.addColorStop(0.5, '#1d0138');
    gradient.addColorStop(1, '#090014');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const accent = new THREE.Color(this.track?.color ?? '#ff33cc');
    const accentStyle = `rgba(${Math.round(accent.r * 255)}, ${Math.round(
      accent.g * 255,
    )}, ${Math.round(accent.b * 255)}, 0.14)`;
    ctx.fillStyle = accentStyle;
    for (let i = 0; i < 6; i += 1) {
      ctx.fillRect(0, i * 40 + 12, size, 6);
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

    const accent = new THREE.Color(this.track?.color ?? '#ff33cc');
    const trackMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x08001a),
      emissive: accent.clone().multiplyScalar(0.45),
      emissiveIntensity: 0.75,
      map: this.createTrackTexture(),
      metalness: 0.22,
      roughness: 0.6,
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
    if (this.trackGroup) {
      this.trackGroup.add(trackMesh);
    } else {
      this.scene.add(trackMesh);
    }
  }

  private addCenterline(): void {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      this.centerlineSamples.map((sample) => sample.point),
    );
    const material = new THREE.LineDashedMaterial({
      color: new THREE.Color(this.track?.color ?? '#ff33cc'),
      linewidth: 1,
      scale: 1,
      dashSize: 3,
      gapSize: 1,
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    line.frustumCulled = true;
    if (this.trackGroup) {
      this.trackGroup.add(line);
    } else {
      this.scene.add(line);
    }
  }

  private addGuardRails(): void {
    if (this.centerlineSamples.length < 2) {
      return;
    }
    const accent = new THREE.Color(this.track?.color ?? '#ff33cc');
    const leftPoints: THREE.Vector3[] = [];
    const rightPoints: THREE.Vector3[] = [];
    const width = TRACK_HALF_WIDTH + 0.7;
    for (let i = 0; i < this.centerlineSamples.length; i += 1) {
      const sample = this.centerlineSamples[i];
      const tangent = new THREE.Vector3(sample.tangent.x, 0, sample.tangent.z).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
      const left = new THREE.Vector3(
        sample.point.x + normal.x * width,
        0.55,
        sample.point.z + normal.z * width,
      );
      const right = new THREE.Vector3(
        sample.point.x - normal.x * width,
        0.55,
        sample.point.z - normal.z * width,
      );
      leftPoints.push(left);
      rightPoints.push(right);
    }
    const leftCurve = new THREE.CatmullRomCurve3(leftPoints, true, 'catmullrom', 0.6);
    const rightCurve = new THREE.CatmullRomCurve3(rightPoints, true, 'catmullrom', 0.6);
    const railMaterial = new THREE.MeshStandardMaterial({
      color: accent.clone().multiplyScalar(0.9),
      emissive: accent.clone().multiplyScalar(0.25),
      emissiveIntensity: 0.6,
      roughness: 0.35,
      metalness: 0.6,
    });
    const tubularSegments = Math.max(200, this.centerlineSamples.length * 3);
    const leftRail = new THREE.Mesh(
      new THREE.TubeGeometry(leftCurve, tubularSegments, 0.18, 10, true),
      railMaterial,
    );
    const rightRail = new THREE.Mesh(
      new THREE.TubeGeometry(rightCurve, tubularSegments, 0.18, 10, true),
      railMaterial,
    );
    leftRail.frustumCulled = false;
    rightRail.frustumCulled = false;
    if (this.trackGroup) {
      this.trackGroup.add(leftRail);
      this.trackGroup.add(rightRail);
    } else {
      this.scene.add(leftRail);
      this.scene.add(rightRail);
    }
  }

  private addBackdrop(): void {
    const atlasTexture = this.createBackdropTexture();
    const accent = new THREE.Color(this.track?.color ?? '#ff33cc');
    const material = new THREE.MeshStandardMaterial({
      map: atlasTexture,
      emissive: accent.clone().multiplyScalar(0.35),
      emissiveIntensity: 0.7,
      roughness: 0.82,
      metalness: 0.06,
    });

    const baseGeometry = new THREE.BoxGeometry(3, 15, 3);
    for (let i = 0; i < 32; i += 1) {
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
      if (this.trackGroup) {
        this.trackGroup.add(lod);
      } else {
        this.scene.add(lod);
      }
    }

    const sunGeometry = new THREE.CircleGeometry(14, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: accent.clone().lerp(new THREE.Color(0xffffff), 0.2),
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 30, -110);
    if (this.trackGroup) {
      this.trackGroup.add(sun);
    } else {
      this.scene.add(sun);
    }
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
    if (this.trackGroup) {
      this.trackGroup.add(ground);
    } else {
      this.scene.add(ground);
    }

    const grid = new THREE.GridHelper(400, 80, 0x220055, 0x110022);
    (grid.material as any).opacity = 0.15;
    (grid.material as any).transparent = true;
    grid.position.y = -0.39;
    if (this.trackGroup) {
      this.trackGroup.add(grid);
    } else {
      this.scene.add(grid);
    }
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
    const accent = new THREE.Color(this.track?.color ?? '#ff33cc');
    const starMaterial = new THREE.PointsMaterial({
      color: accent.clone().lerp(new THREE.Color(0xffffff), 0.5),
      size: 0.6,
      opacity: 0.6,
      transparent: true,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.frustumCulled = false;
    if (this.trackGroup) {
      this.trackGroup.add(stars);
    } else {
      this.scene.add(stars);
    }
  }

  private createCarBody(): Body {
    const body = new Body({
      mass: 650,
      position: new Vec3(0, 0.5, 0),
      fixedRotation: true,
      linearDamping: 0.22,
    });
    const shape = new Box(new Vec3(0.6, 0.35, 1.2));
    body.addShape(shape);
    body.allowSleep = false;
    body.angularDamping = 0.6;
    return body;
  }

  private createCarMesh(): any {
    const carGroup = new THREE.Group();
    carGroup.name = 'synthwave-car';
    const placeholder = this.createPlaceholderCar();
    placeholder.name = 'synthwave-placeholder';
    carGroup.add(placeholder);
    this.loadF1Model(carGroup, placeholder);
    return carGroup;
  }

  private createPlaceholderCar(): any {
    const group = new THREE.Group();
    const bodyGeometry = new THREE.BoxGeometry(1.2, 0.34, 2.3);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x111133,
      emissive: 0x3422ff,
      emissiveIntensity: 0.6,
      metalness: 0.4,
      roughness: 0.32,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.32;
    group.add(body);

    const haloGeometry = new THREE.TorusGeometry(0.35, 0.04, 8, 32, Math.PI * 1.4);
    const haloMaterial = new THREE.MeshBasicMaterial({ color: 0x8a5bff, opacity: 0.8, transparent: true });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.rotateX(Math.PI / 2);
    halo.position.set(0, 0.55, -0.1);
    group.add(halo);

    const wheelGeometry = new THREE.CylinderGeometry(0.33, 0.33, 0.28, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x070707,
      emissive: 0x1a1433,
      emissiveIntensity: 0.4,
      roughness: 0.6,
      metalness: 0.3,
    });
    const wheelPositions: [number, number, number][] = [
      [-0.7, 0.18, 1],
      [0.7, 0.18, 1],
      [-0.65, 0.18, -1.05],
      [0.65, 0.18, -1.05],
    ];
    wheelPositions.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, y, z);
      group.add(wheel);
    });

    const underglowGeometry = new THREE.PlaneGeometry(1.4, 2.6);
    const underglowMaterial = new THREE.MeshBasicMaterial({
      color: 0x4d00ff,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const underglow = new THREE.Mesh(underglowGeometry, underglowMaterial);
    underglow.rotation.x = Math.PI / 2;
    underglow.position.set(0, 0.05, 0);
    group.add(underglow);

    return group;
  }

  private loadF1Model(target: any, placeholder: any): void {
    if (this.gltfLoader === null) {
      this.gltfLoader = new GLTFLoader();
    }
    const modelPath = `${import.meta.env.BASE_URL ?? '/'}assets/racer/F1/F1.gltf`;
    this.gltfLoader.load(
      modelPath,
      (gltf) => {
        try {
          if (placeholder && placeholder.parent) {
            placeholder.parent.remove(placeholder);
          }
          const model = gltf.scene;
          model.scale.setScalar(0.58);
          model.position.set(0, -0.28, 0);
          model.rotation.y = Math.PI;
          const accent = new THREE.Color(this.track?.color ?? '#ff33cc');
          model.traverse((child: any) => {
            if (child.isMesh) {
              child.castShadow = false;
              child.receiveShadow = true;
              if (child.material && 'emissive' in child.material) {
                child.material.emissive = accent.clone().multiplyScalar(0.35);
                child.material.emissiveIntensity = 0.6;
              }
            }
          });
          target.add(model);
        } catch (error) {
          console.warn('Failed to integrate F1 model, keeping placeholder.', error);
          if (placeholder && !placeholder.parent) {
            target.add(placeholder);
          }
        }
      },
      undefined,
      (error) => {
        console.warn('Unable to load F1 model', error);
      },
    );
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
    const steering = (left ? 1 : 0) - (right ? 1 : 0);

    this.throttleInput = throttle
      ? Math.min(1, this.throttleInput + dt * 3)
      : Math.max(0, this.throttleInput - dt * 2.2);

    const maxSpeed =
      BASE_MAX_SPEED * (1 + this.boost * BOOST_SPEED_MULTIPLIER);
    const baseAccel = BASE_ACCELERATION * (1 + this.boost * 0.4);
    if (throttle) {
      this.speed = Math.min(
        maxSpeed,
        this.speed + baseAccel * dt,
      );
    } else {
      const coastingDrag = DRAG_COEFFICIENT * (1 + (this.speed / BASE_MAX_SPEED) * 0.4);
      this.speed = Math.max(
        0,
        this.speed - (coastingDrag * this.speed + 1.2) * dt,
      );
    }

    if (brake) {
      this.speed = Math.max(
        0,
        this.speed - (BRAKE_FORCE * 0.5 + this.speed * 1.2) * dt,
      );
    }

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
    this.carBody.velocity.x -= lateralSpeed * lateral.x * 0.24;
    this.carBody.velocity.z -= lateralSpeed * lateral.z * 0.24;

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

    if (Math.abs(lateralOffset) > TRACK_HALF_WIDTH * 1.05) {
      const clampedOffset = THREE.MathUtils.clamp(
        lateralOffset,
        -TRACK_HALF_WIDTH * 0.92,
        TRACK_HALF_WIDTH * 0.92,
      );
      const correctionAmount = clampedOffset - lateralOffset;
      const correction = new THREE.Vector3().copy(lateralDir).multiplyScalar(correctionAmount);
      this.carBody.position.x += correction.x;
      this.carBody.position.z += correction.z;
      this.speed *= 0.85;
      this.carBody.velocity.x *= 0.65;
      this.carBody.velocity.z *= 0.65;
    }

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
      Math.abs(lateralOffset) < TRACK_HALF_WIDTH * 0.55 &&
      alignmentAngle < THREE.MathUtils.degToRad(12);

    if (onLine) {
      this.lastSafeSampleIndex = closestIndex;
      this.lastSafePosition.set(sample.point.x, 0.4, sample.point.z);
      this.lastSafeTangent.set(sample.tangent.x, sample.tangent.y, sample.tangent.z);
      this.offTrackTimer = 0;
      if (this.speed > 4) {
        this.boost = Math.min(1, this.boost + BOOST_BUILD_RATE * dt);
        this.boostUptime += dt;
      }
    } else {
      this.offTrackTimer += dt;
      const decay = Math.abs(lateralOffset) > TRACK_HALF_WIDTH
        ? BOOST_DRAIN_RATE
        : BOOST_DECAY_RATE;
      this.boost = Math.max(0, this.boost - decay * dt);
      if (Math.abs(lateralOffset) > TRACK_HALF_WIDTH * 0.85) {
        this.offTrackTime += dt;
      }
      if (Math.abs(lateralOffset) > TRACK_HALF_WIDTH * 1.2 && this.offTrackTimer > 3) {
        this.respawnToSample(this.lastSafeSampleIndex, true);
        this.offTrackTimer = 0;
      }
    }
  }

  private updateBoost(dt: number): void {
    if (this.boost > 0.05) {
      this.speed = Math.min(
        this.speed + (BASE_ACCELERATION * 0.25 + this.boost * 8) * dt,
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

  private respawnToSample(sampleIndex: number, preserveSafe = false): void {
    if (this.centerlineSamples.length === 0) {
      this.carBody.position.set(0, 0.4, 0);
      this.carBody.velocity.setZero();
      this.carBody.angularVelocity.setZero();
      this.carYaw = 0;
      this.carBody.quaternion.setFromEuler(0, 0, 0, 'XYZ');
      this.chaseCurrent.set(0, 4.5, 8);
      this.chaseTarget.copy(this.chaseCurrent);
      return;
    }
    const safeIndex = Math.max(0, Math.min(this.centerlineSamples.length - 1, sampleIndex));
    const sample = this.centerlineSamples[safeIndex];
    this.carBody.position.set(sample.point.x, 0.4, sample.point.z);
    this.carBody.velocity.setZero();
    this.carBody.angularVelocity.setZero();
    this.speed = 0;
    this.boost = 0;
    const yaw = Math.atan2(sample.tangent.x, sample.tangent.z);
    this.carYaw = yaw;
    this.carBody.quaternion.setFromEuler(0, yaw, 0, 'XYZ');
    this.chaseCurrent.set(
      sample.point.x - sample.tangent.x * 6,
      4.4,
      sample.point.z - sample.tangent.z * 6,
    );
    this.chaseTarget.copy(this.chaseCurrent);
    if (!preserveSafe) {
      this.lastSafeSampleIndex = safeIndex;
      this.lastSafePosition.set(sample.point.x, 0.4, sample.point.z);
      this.lastSafeTangent.set(sample.tangent.x, sample.tangent.y, sample.tangent.z);
    }
    this.lastCenterlineSample = safeIndex;
    this.offTrackTimer = 0;
  }

  private resetCarState(): void {
    this.speed = 0;
    this.boost = 0;
    this.offTrackTimer = 0;
    this.lastSafeSampleIndex = 0;
    this.respawnToSample(0, false);
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
      this.masterGain.gain.value = this.sfxEnabled ? this.sfxVolume : 0;
      this.masterGain.connect(context.destination);
      this.musicGain = context.createGain();
      this.musicGain.gain.value = this.musicEnabled ? this.musicVolume : 0;
      this.musicGain.connect(context.destination);

      this.engineOscillator = context.createOscillator();
      this.engineOscillator.type = 'sawtooth';
      this.engineOscillator.frequency.value = 80;

      this.engineHarmonic = context.createOscillator();
      this.engineHarmonic.type = 'triangle';
      this.engineHarmonic.frequency.value = 160;

      this.engineFilter = context.createBiquadFilter();
      this.engineFilter.type = 'bandpass';
      this.engineFilter.Q.value = 1.4;

      this.engineGain = context.createGain();
      this.engineGain.gain.value = 0.05;
      this.engineGain.connect(this.masterGain);

      this.engineOscillator.connect(this.engineFilter);
      this.engineHarmonic.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineOscillator.start();
      this.engineHarmonic.start();

      this.engineNoiseGain = context.createGain();
      this.engineNoiseGain.gain.value = 0;
      this.engineNoiseGain.connect(this.masterGain);
      const engineNoiseBuffer = this.createEngineNoiseBuffer(context);
      this.engineNoise = context.createBufferSource();
      this.engineNoise.buffer = engineNoiseBuffer;
      this.engineNoise.loop = true;
      this.engineNoise.connect(this.engineNoiseGain);
      this.engineNoise.start();

      this.boostOscillator = context.createOscillator();
      this.boostGain = context.createGain();
      this.boostOscillator.type = 'triangle';
      this.boostOscillator.frequency.value = 320;
      this.boostGain.gain.value = 0;
      this.boostOscillator.connect(this.boostGain);
      this.boostGain.connect(this.masterGain);
      this.boostOscillator.start();

      this.skidGain = context.createGain();
      this.skidGain.gain.value = 0;
      this.skidGain.connect(this.masterGain);
      this.createSkidNoiseBuffer(context);

      this.audioReady = true;
      if (this.musicEnabled) {
        this.ensureMusic();
      }
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

  private createEngineNoiseBuffer(context: AudioContext): AudioBuffer {
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 2.5;
    }
    return buffer;
  }

  private updateAudioState(): void {
    if (!this.audioReady || !this.audioContext || !this.masterGain) {
      return;
    }
    const speedRatio = THREE.MathUtils.clamp(this.speed / BASE_MAX_SPEED, 0, 1);
    const throttle = this.throttleInput;
    const sfxScalar = this.sfxEnabled ? this.sfxVolume : 0;
    this.masterGain.gain.value = sfxScalar;
    const audioTime = this.audioContext.currentTime + 0.03;

    if (
      this.engineOscillator &&
      this.engineHarmonic &&
      this.engineGain &&
      this.engineFilter
    ) {
      const tonalEnergy = THREE.MathUtils.clamp(
        Math.pow(speedRatio, 1.4) + throttle * 0.25,
        0,
        1,
      );
      const baseHz = 160 + tonalEnergy * 1600;
      const harmonicHz = baseHz * 2.15;
      this.engineOscillator.frequency.linearRampToValueAtTime(baseHz, audioTime);
      this.engineHarmonic.frequency.linearRampToValueAtTime(
        harmonicHz,
        audioTime,
      );
      this.engineFilter.frequency.linearRampToValueAtTime(
        380 + Math.pow(speedRatio, 1.6) * 2600 + throttle * 220,
        audioTime,
      );
      this.engineFilter.Q.value = 1.6 - speedRatio * 0.5;
      const engineGainTarget = (0.07 + speedRatio * 0.25 + throttle * 0.12) * sfxScalar;
      this.engineGain.gain.linearRampToValueAtTime(
        engineGainTarget,
        audioTime,
      );
      if (this.engineNoiseGain) {
        const noiseGain =
          THREE.MathUtils.clamp(speedRatio * 0.32 + throttle * 0.18, 0.04, 0.48) *
          sfxScalar;
        this.engineNoiseGain.gain.linearRampToValueAtTime(
          noiseGain,
          audioTime,
        );
      }
    }

    if (this.boostOscillator && this.boostGain) {
      this.boostGain.gain.linearRampToValueAtTime(
        this.boost * 0.28 * sfxScalar,
        audioTime,
      );
      this.boostOscillator.frequency.linearRampToValueAtTime(
        260 + this.boost * 520,
        audioTime,
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
        skidVolume * 0.22 * sfxScalar,
        audioTime,
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
