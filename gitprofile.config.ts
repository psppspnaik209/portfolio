const CONFIG = {
  github: {
    username: 'psppspnaik209',
  },
  base: '/portfolio/',
  personal: {
    name: 'Kaushik Naik Guguloth',
    headline: 'Full-stack engineer. I ship software end-to-end.',
    subheadline: undefined,
    intro:
      "Computer Science, UNT '26. I write production TypeScript and Python for the web, C# for Windows, Swift for macOS, and React Native and Flutter for mobile — and I glue the ML and backend behind them together.",
    location: 'Denton, TX',
    availability: 'Open to work',
    primaryCta: {
      label: 'Resume',
      href: 'https://drive.google.com/drive/folders/1i5USQb2h_LFvm5znHTaxgIt7V_RVlQ_U',
    },
    secondaryCta: {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/g-k-n/',
    },
  },
  capabilities: [
    {
      title: 'Languages',
      items: [
        'TypeScript',
        'Python',
        'C#',
        'C / C++',
        'Swift',
        'Kotlin',
        'Java',
        'Dart',
        'Rust',
        'SQL',
      ],
    },
    {
      title: 'Frameworks & Platforms',
      items: [
        'React',
        'Node.js',
        '.NET / WinUI 3',
        'Flutter',
        'FastAPI',
        'AWS',
        'Docker',
      ],
    },
    {
      title: 'ML & AI',
      items: [
        'PyTorch',
        'TensorFlow',
        'LangChain',
        'Vector search',
        'Transfer learning',
        'Reinforcement learning',
        'On-device LLMs',
      ],
    },
  ],
  projects: {
    github: {
      display: true,
      header: 'More on GitHub',
      mode: 'manual',
      automatic: {
        sortBy: 'updated',
        limit: 6,
        exclude: {
          forks: true,
          projects: [],
        },
      },
      manual: {
        projects: [
          {
            repo: 'S-T-A-R-K-Projects/Capstone-Project',
            label: 'Senscribe',
            featured: true,
            eyebrow: 'Capstone · Accessibility',
            summary:
              'A cross-platform mobile app that gives people with hearing impairments real-time awareness of the sounds around them — classifying environmental sounds, transcribing speech, recognizing names, flagging trigger words, and cueing sound direction on a high-contrast UI.',
            impact:
              'Built with Team STARK. On-device models keep latency low and the experience private; the app also summarizes ongoing conversations and speaks back with text-to-speech when the user needs it.',
            stack: [
              'Flutter',
              'Dart',
              'On-device AI',
              'Speech-to-text',
              'Text-to-speech',
              'Accessibility',
            ],
            ctaLabel: 'View Repository',
            media: {
              type: 'embed',
              src: 'https://www.youtube.com/embed/z16rOocf61Q?rel=0&modestbranding=1',
              alt: 'Senscribe demo',
            },
          },
          {
            repo: 'psppspnaik209/FFLocker',
            label: 'FFLocker',
            featured: true,
            eyebrow: 'Windows utility · C# / .NET',
            summary:
              'A Windows file-locking utility built around one job done well: lock or unlock files from a right-click in under a second.',
            impact:
              'No bloat, no background services, no "premium" upsell. It is a small .NET binary with a focused UI, the way desktop utilities used to ship.',
            stack: ['C#', '.NET', 'Windows', 'Desktop UX'],
            ctaLabel: 'Open on GitHub',
            media: {
              type: 'embed',
              src: 'https://www.youtube.com/embed/8XnIJNrXXPs?rel=0&modestbranding=1',
              alt: 'FFLocker demo',
            },
          },
          {
            repo: 'psppspnaik209/flutter_gen_ai_demo',
            label: 'Flutter Local GenAI',
            featured: true,
            eyebrow: 'Mobile AI · Flutter',
            summary:
              'A Flutter prototype running a quantized Phi-3.5 model fully on-device — no server, no API key, no round-trip to the cloud.',
            impact:
              'Most of the work was the boring-but-important stuff: getting the ONNX Runtime to behave reliably on-device without crashing, keeping memory in check, and proving mobile-first GenAI can feel immediate instead of laggy.',
            stack: ['Flutter', 'Dart', 'Phi-3.5', 'On-device AI', 'Mobile'],
            ctaLabel: 'View Repository',
            media: {
              type: 'embed',
              src: 'https://www.youtube.com/embed/8zgdKdnkcPU?rel=0&modestbranding=1',
              alt: 'Flutter Local GenAI demo',
            },
          },
          {
            repo: 'psppspnaik209/MicMuteNetPublic',
            label: 'MicMuteNet',
            featured: false,
            eyebrow: 'Windows utility',
            summary:
              'System-tray mic toggle for Windows. One tray icon, one hotkey, no overhead.',
            stack: ['C#', 'Windows APIs'],
            ctaLabel: 'View Repository',
          },
          {
            repo: 'psppspnaik209/FinderPath26',
            label: 'FinderPath26',
            featured: false,
            eyebrow: 'macOS utility · Swift',
            summary:
              'A macOS 12+ menu bar utility that overlays an editable path field into Finder’s toolbar — tracks the front window via Accessibility APIs, navigates on Return, reverts on Escape.',
            stack: ['Swift', 'macOS', 'Accessibility APIs'],
            ctaLabel: 'View Repository',
          },
        ],
      },
    },
    external: {
      header: 'Other work',
      projects: [
        {
          title: 'Amazon DeepRacer',
          featured: false,
          eyebrow: 'Reinforcement learning',
          summary:
            'Trained an autonomous racing agent on AWS DeepRacer; iterated on reward shaping and training runs to get consistent and fast lap times.',
          stack: ['Python', 'AWS DeepRacer', 'RL'],
          imageUrl:
            'https://i.ibb.co/KxQqVH3V/screen-shot-2019-11-27-at-1-13-05-pm.webp',
        },
        {
          title: 'City & Disaster Simulation',
          featured: false,
          eyebrow: 'C++ systems',
          summary:
            'A turn-based city simulator modeling zoning, pollution spread, disasters, and resource flow — written in modern C++ with an emphasis on clean state management and structured data layouts.',
          stack: ['C++', 'Simulation', 'Data structures'],
          imageUrl: 'https://i.ibb.co/MxzQqzdD/windsimulation.jpg',
        },
      ],
    },
  },
  seo: {
    title: 'Kaushik Naik Guguloth — Full-stack engineer',
    description:
      'Portfolio of Kaushik Naik Guguloth — full-stack engineer shipping TypeScript, C#, Swift, and on-device AI. CS at UNT, graduating 2026.',
    imageURL: '',
  },
  social: {
    linkedin: 'g-k-n',
    researchGate: '',
    facebook: '',
    instagram: '',
    reddit: '',
    threads: '',
    youtube: '',
    udemy: '',
    dribbble: '',
    behance: '',
    stackoverflow: '',
    skype: '',
    telegram: '',
    website: 'https://psppspnaik209.github.io/portfolio/',
    phone: '940.278.8260',
    email: ['koushikguguloth290@gmail.com', 'KoushikNaikGuguloth@my.unt.edu'],
  },
  resume: {
    fileUrl:
      'https://drive.google.com/drive/folders/1i5USQb2h_LFvm5znHTaxgIt7V_RVlQ_U',
  },
  experiences: [
    {
      company: 'Citigroup (IWC)',
      position: 'Generative AI Software Engineer',
      from: 'Sep 2025',
      to: 'Present',
      highlights: [
        'Architect and deploy enterprise-grade Generative AI agents using Python and advanced LLM orchestration frameworks to automate multi-step internal financial analysis and predictive risk workflows.',
        'Engineer secure Retrieval-Augmented Generation (RAG) pipelines seamlessly integrated with corporate Role-Based Access Control (RBAC) schemas, guaranteeing zero-leak data privacy and absolute compliance with strict financial data governance standards.',
        'Optimize LLM context utilization, prompt strategies, and token length configurations, driving down corporate token expenditures by 70% while simultaneously boosting model extraction accuracy on complex, multi-page regulatory documentation.',
        'Implement semantic caching layers and request-throttling mechanisms to accelerate system inference latency, effectively decoupling underlying model calls from high-frequency system queries.',
        'Collaborate with distributed cross-functional software units to expose advanced agentic features via secure, high-throughput REST APIs, implementing robust telemetry tracking to evaluate production model drift and hallucinations.',
        'Construct automated evaluation pipelines using LLM-as-a-judge frameworks to programmatically benchmark agent accuracy and prevent performance regression prior to production deployment.',
        'Integrate advanced semantic search re-ranking techniques (Cross-Encoders) into vector database retrieval steps, accelerating chunk relevance and minimizing hallucination rates under dense financial datasets.',
      ],
      stack: [
        'Python',
        'LLM orchestration',
        'RAG',
        'RBAC',
        'REST APIs',
        'Vector search',
        'Cross-Encoders',
      ],
    },
    {
      company: 'Attention.Ad',
      position: 'Full Stack Developer',
      from: 'Jun 2025',
      to: 'Aug 2025',
      companyLink: 'https://www.attention.ad/',
      highlights: [
        'Developed a high-throughput social broadcasting service using a TypeScript and Node.js backend to ingest live social data feeds and automatically amplify Clanker-minted ERC-20 tokens on the Base Network.',
        'Shipped a real-time analytics dashboard in TypeScript for on-chain telemetry: token trading volume, cumulative fee earnings, and leaderboard rankings with low-latency updates.',
        'Integrated the Twitter/X API with custom rate-limiting algorithms to securely fetch and cache viral tweet metadata for a downstream tokenization engine that processed trending content semantics in real time.',
        'Engineered on-chain telemetry helper modules using the Uniswap API to query distributed liquidity pools and compute instantaneous token pricing models.',
        'Constructed end-to-end payment and chain-data plumbing by linking Stripe checkout webhooks and Alchemy nodes, packaging the core features into resilient REST APIs with idempotent retry blocks and structured logging.',
        'Authored comprehensive Markdown API documentation and operational technical runbooks, accelerating onboarding timelines for cross-functional engineering team members by 50%.',
      ],
      stack: [
        'TypeScript',
        'Node.js',
        'Base / Alchemy',
        'Stripe',
        'Twitter API',
        'Uniswap API',
      ],
      note: 'Product link: site and features may have been updated after my tenure.',
    },
    {
      company: 'Robinhood (IWC)',
      position: 'AI / ML Engineer',
      from: 'Sep 2024',
      to: 'May 2025',
      highlights: [
        'Operationalized and served privacy-conscious LLM workloads, securely remoting into private on-premise infrastructure to manage the lifecycle from standalone Docker servers to distributed Kubernetes clusters.',
        'Built an internal RAG-driven knowledge assistant using LangChain and vector databases to index internal documentation, improving semantic accuracy and response utility for support-style use cases.',
        'Engineered Python-based inference and retrieval endpoints with FastAPI, incorporating production reliability configurations including request validation, timeouts, retries, and structured logging.',
        'Established service monitoring and performance benchmarking loops, configuring health checks and metrics to tune model parameters like context limits and caching/batching.',
        'Coordinated across backend and DevOps teams to align on interface schemas, authoring operational runbooks and setup documentation to support long-term maintainability.',
        'Designed a dynamic backup routing architecture that redirected high-concurrency runtime traffic to quantized, lower-footprint alternative models during localized hardware compute spikes.',
        'Refined data engineering ingestion pipelines, optimizing text-chunking strategies and overlap thresholds to increase data density before indexing into vector embedding stores.',
      ],
      stack: [
        'Python',
        'Docker',
        'Kubernetes',
        'LangChain',
        'FastAPI',
        'Vector search',
        'On-prem LLMs',
      ],
    },
    {
      company: 'Sumitomo Mitsui Banking Corporation (IWC)',
      position: 'Cybersecurity Intern',
      from: 'Aug 2023',
      to: 'Jul 2024',
      highlights: [
        'Engineered automated security orchestration pipelines for enterprise-scale Intrusion Detection and Prevention Systems (IDS/IPS), building custom Python parsing modules to accelerate stateful packet inspections.',
        'Architected programmatic network emulation and packet-injection frameworks to synthetically reproduce advanced persistent threats and anomalous traffic behavior, executing regression suites to safeguard production security appliances.',
        'Streamlined distributed network telemetry and SIEM log aggregation systems, optimizing corporate firewall Access Control Lists and stateful rule matrices to eliminate alert fatigue and slash false positives by 99.9%.',
        'Developed automated policy-compliance scanners to audit and flag misconfigured infrastructure, identifying and remediating drifting network security topologies across isolated staging and production networks.',
        'Conducted deep-dive packet captures and behavioral telemetry audits on internal tool suites, ensuring edge configurations conformed with Zero-Trust network architecture blueprints.',
        'Automated security patch verification processes across staging clusters, using lightweight execution scripts to confirm signature definitions without disrupting active network simulations.',
      ],
      stack: [
        'Python',
        'IDS / IPS',
        'SIEM',
        'Network emulation',
        'Firewall ACLs',
        'Zero Trust',
      ],
    },
  ],
  certifications: [
    {
      name: 'Artificial Intelligence Certificate',
      body: 'University of North Texas',
      link: 'https://www.unt.edu/academics/programs/artificial-intelligence-certificate.html',
    },
  ],
  educations: [
    {
      institution: 'University of North Texas',
      degree: 'B.S. Computer Science',
      from: '',
      to: '2026',
      link: 'https://engineering.unt.edu/cse/index.html',
    },
  ],
  footer: '© Built by TNBB',
  enablePWA: true,
};

export default CONFIG;
