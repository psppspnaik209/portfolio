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
      'Computer Science graduate from UNT (3.93 GPA) building full-stack and backend systems, AI/ML features, and cloud deployments — React and TypeScript front ends, Node.js and Django back ends, Java and Spring Boot microservices, PostgreSQL, Docker, and Kubernetes. I also ship accessibility and security apps in Flutter and .NET.',
    location: 'Denton, TX',
    availability: 'Open to full-time Software Engineer roles.',
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
        'C / C++',
        'C#',
        'Python',
        'Java',
        'TypeScript',
        'JavaScript',
        'SQL',
        'Rust',
      ],
    },
    {
      title: 'Web & Frameworks',
      items: [
        'React.js',
        'Node.js',
        'Django',
        '.NET',
        'Spring Boot',
        'REST APIs',
        'HTML / CSS',
        'Flutter',
      ],
    },
    {
      title: 'AI & ML',
      items: [
        'PyTorch',
        'TensorFlow',
        'RAG',
        'LLMs',
        'MCP',
        'LangChain',
        'LangGraph',
        'Neural Networks',
      ],
    },
    {
      title: 'Cloud & DevOps',
      items: [
        'Docker',
        'Kubernetes',
        'AWS',
        'Google Cloud Platform',
        'Microsoft Azure',
        'GitHub Actions',
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
            label: 'SenScribe',
            featured: true,
            eyebrow: 'Capstone · Accessibility',
            summary:
              'An AI accessibility app for hearing-impaired users that turns ambient sound into visible information in real time — classifying environmental sounds, detecting critical alerts, and cueing sound direction on a low-latency, platform-adaptive UI.',
            impact:
              "Integrated YAMNet and Apple's SoundAnalysis through native channels for sound classification and critical-alert detection with confidence filtering. Added on-device summarization with Liquid AI using a map-reduce strategy for large transcripts, plus speech-to-text/text-to-speech and low-latency haptic keyword recognition.",
            stack: [
              'Flutter',
              'Dart',
              'YAMNet',
              'SoundAnalysis',
              'Liquid AI',
              'On-device AI',
              'Accessibility',
            ],
            ctaLabel: 'View Repository',
            media: {
              type: 'embed',
              src: 'https://www.youtube.com/embed/z16rOocf61Q?rel=0&modestbranding=1',
              alt: 'SenScribe demo',
            },
          },
          {
            repo: 'psppspnaik209/FFLocker',
            label: 'File & Folder Locker',
            featured: true,
            eyebrow: 'Windows security utility · C# / .NET',
            summary:
              'A cryptographically secure Windows file vault built from scratch with AES-256-GCM authenticated encryption and Argon2id key derivation, designed against hardware-accelerated offline attacks.',
            impact:
              'Fail-safe atomic I/O performs all cryptographic work on temporary files before commit, so interruptions never corrupt original data. Integrated Windows Hello biometric authentication and a self-contained .ffl format that embeds all metadata for portability across machines.',
            stack: [
              'C#',
              '.NET',
              'AES-256-GCM',
              'Argon2id',
              'Windows Hello',
              'Windows',
            ],
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
          eyebrow: 'Reinforcement learning · 2025',
          summary:
            'Trained a reinforcement learning model to pilot a 1/18th scale vehicle through virtual tracks in AWS DeepRacer. Engineered multi-variable reward functions and tuned hyperparameters in Amazon SageMaker to reduce lap times and track deviation.',
          stack: ['Python', 'AWS DeepRacer', 'Amazon SageMaker', 'RL'],
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
    title: 'Kaushik Naik Guguloth — Full-stack & backend engineer',
    description:
      'Portfolio of Kaushik Naik Guguloth — full-stack and backend engineer working across React, Node.js, Django, Java/Spring Boot, PostgreSQL, and cloud. UNT Computer Science graduate, 3.93 GPA.',
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
    email: 'koushikguguloth290@gmail.com',
  },
  resume: {
    fileUrl:
      'https://drive.google.com/drive/folders/1i5USQb2h_LFvm5znHTaxgIt7V_RVlQ_U',
  },
  experiences: [
    {
      company: 'Citigroup (IWC)',
      position: 'Full-Stack AI Engineer',
      from: 'September 2025',
      to: 'Present',
      highlights: [
        'Built React and TypeScript dashboards rendering real-time security alerts and threat metrics from asynchronous Django REST endpoints.',
        'Integrated OpenAI APIs into a Node.js back end to generate automated system-log summaries, with retry logic, exponential backoff, and fallback handling for rate limits.',
        'Refactored PostgreSQL access by replacing nested ORM queries with explicit SQL joins and compound indexes on high-traffic columns.',
        'Expanded PyTest and Jest test coverage for authentication, token refresh, and account-management routes, using AI-assisted tooling to generate unit and integration suites.',
      ],
      stack: [
        'React',
        'TypeScript',
        'Node.js',
        'OpenAI API',
        'PostgreSQL',
        'Django REST',
        'PyTest',
        'Jest',
      ],
    },
    {
      company: 'Attention.ad',
      position: 'Full Stack Developer Intern',
      from: 'June 2025',
      to: 'August 2025',
      companyLink: 'https://www.attention.ad/',
      highlights: [
        'Built a high-throughput TypeScript/Node.js social broadcasting service ingesting live social feeds and amplifying Clanker-minted ERC-20 tokens on Base.',
        'Shipped a real-time analytics dashboard for on-chain telemetry, including token trading volume, fee earnings, and leaderboard rankings with low-latency updates.',
        'Integrated the Twitter/X API with custom rate limiting and caching for viral tweet metadata, feeding a downstream tokenization engine processing trending content in real time.',
        'Built on-chain telemetry with the Uniswap API to query liquidity pools and compute token pricing models.',
        'Linked Stripe checkout webhooks and Alchemy nodes into resilient REST APIs with idempotent retry logic and structured logging, and authored API documentation and runbooks for engineering onboarding.',
      ],
      stack: [
        'TypeScript',
        'Node.js',
        'Base / Alchemy',
        'Stripe',
        'Twitter API',
        'Uniswap API',
      ],
    },
    {
      company: 'Robinhood (IWC)',
      position: 'Backend & Cloud Engineer Intern',
      from: 'September 2024',
      to: 'May 2025',
      highlights: [
        'Built Java/Spring Boot microservices for authentication and authorization, caching session tokens and permissions in Redis to reduce primary database load.',
        'Containerized Spring Boot services with Docker and automated deployments to Azure Kubernetes Service (AKS) with ArgoCD and GitOps workflows.',
        'Configured Datadog distributed tracing, APM monitors, and custom log alerts across microservices to isolate latency bottlenecks during incidents.',
        'Implemented OAuth2 authentication and role-based access control (RBAC) middleware for granular permission checks on external REST APIs.',
      ],
      stack: [
        'Java',
        'Spring Boot',
        'Redis',
        'Docker',
        'Kubernetes (AKS)',
        'ArgoCD',
        'Datadog',
        'OAuth2 / RBAC',
      ],
    },
    {
      company: 'Sumitomo Mitsui Banking Corporation (IWC)',
      position: 'Software Engineer Intern',
      from: 'August 2023',
      to: 'July 2024',
      highlights: [
        'Automated CI/CD with Python scripts and GitHub Actions running PyTest suites, linting, and static security scans on every pull request.',
        'Built a C++/Python command-line diagnostic tool for Linux to parse raw TCP/IP packet logs into structured JSON for local debugging.',
        'Authored technical design documents (RFCs) covering architecture, database schema migrations, REST API contracts, and error handling before implementation.',
        'Reviewed pull requests on GitHub for edge cases, input validation, test coverage, and coding standards.',
      ],
      stack: [
        'Python',
        'GitHub Actions',
        'PyTest',
        'C++',
        'Linux',
        'TCP/IP',
        'REST APIs',
        'Code Review',
      ],
    },
  ],
  certifications: [
    {
      name: 'Artificial Intelligence Certificate',
      body: 'University of North Texas',
      link: 'https://www.unt.edu/academics/programs/artificial-intelligence-certificate.html',
    },
    {
      name: 'ISC2 CC — Certified in Cybersecurity',
      body: 'ISC2',
      link: 'https://www.isc2.org/certifications/cc',
    },
    {
      name: 'National Society of Leadership and Success',
      body: 'NSLS',
      link: 'https://www.nsls.org/',
    },
  ],
  educations: [
    {
      institution: 'University of North Texas',
      degree: 'B.S. Computer Science · GPA 3.93',
      from: 'August 2023',
      to: 'May 2026',
      link: 'https://engineering.unt.edu/cse/index.html',
      coursework: [
        'Data Structures & Algorithms',
        'Software Engineering',
        'Database Systems',
        'Computer Networks',
        'Foundations of Cybersecurity',
        'Machine Learning',
        'Natural Language Processing',
        'Systems Programming',
      ],
    },
  ],
  footer: '© Built by TNBB',
  enablePWA: true,
};

export default CONFIG;
