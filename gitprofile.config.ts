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
      "Computer Science, UNT '26. I write production TypeScript and Python for the web, C# for Windows, Swift for macOS, and Flutter/Dart for mobile — and I glue the ML and backend behind them together.",
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
              src: 'https://www.youtube.com/embed/zRVEkm9QCYE?rel=0&modestbranding=1',
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
      company: 'Attention.Ad',
      position: 'Full-Stack Engineer',
      from: 'Jun 2025',
      to: 'Aug 2025',
      companyLink: 'https://www.attention.ad/',
      highlights: [
        'Built a TypeScript/Node service that auto-broadcasts Clanker-minted ERC-20 tokens on Base through the Twitter/X API.',
        'Shipped a real-time analytics dashboard for on-chain telemetry — trading volume, cumulative fee earnings, and leaderboard rankings.',
        'Integrated Stripe and Alchemy; exposed REST APIs with idempotent webhooks, retries, and structured logging behind the tokenization backend.',
      ],
      stack: [
        'TypeScript',
        'Node.js',
        'Base / Alchemy',
        'Stripe',
        'Twitter API',
      ],
      note: 'Site and features may have been updated since my tenure.',
    },
    {
      company: 'Indo Welsh Company',
      position: 'AI / ML Engineer',
      from: 'Jan 2025',
      to: 'May 2025',
      companyLink: 'https://indowelshcompany.com/',
      highlights: [
        'Deployed local/on-prem LLM inference workloads — started in Docker on single servers, then migrated to Kubernetes for repeatable releases and scaling.',
        'Built a RAG support assistant with LangChain and a vector store, served through FastAPI with request validation, timeouts, retries, and structured logging.',
        'Added monitoring for deployed model services — health checks, performance metrics, and basic deployment automation.',
        'Benchmarked and tuned local inference (model selection, context limits, caching/batching) to balance latency, cost, and response quality.',
      ],
      stack: [
        'Python',
        'Docker',
        'Kubernetes',
        'LangChain',
        'FastAPI',
        'Vector search',
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
