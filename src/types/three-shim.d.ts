declare module 'three' {
  const Three: any;
  export = Three;
}

declare module 'three/examples/jsm/postprocessing/EffectComposer' {
  export class EffectComposer {
    constructor(renderer: any);
    render(delta?: number): void;
    setSize(width: number, height: number): void;
    addPass(pass: any): void;
    dispose(): void;
  }
}

declare module 'three/examples/jsm/postprocessing/RenderPass' {
  export class RenderPass {
    constructor(scene: any, camera: any);
  }
}

declare module 'three/examples/jsm/postprocessing/UnrealBloomPass' {
  export class UnrealBloomPass {
    constructor(
      resolution: any,
      strength?: number,
      radius?: number,
      threshold?: number,
    );
    threshold: number;
    radius: number;
    enabled: boolean;
    setSize(width: number, height: number): void;
  }
}

declare module 'three/examples/jsm/postprocessing/AfterimagePass' {
  export class AfterimagePass {
    uniforms: Record<string, { value: number }>;
    enabled: boolean;
    render(
      renderer: any,
      writeBuffer: any,
      readBuffer: any,
      deltaTime: number,
    ): void;
  }
}

