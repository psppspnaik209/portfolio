const CONFIG = {
  github: {
    username: 'psppspnaik209',
  },
  base: '/portfolio/',
  personal: {
    name: 'Kaushik Naik Guguloth',
    headline:
      'Full-stack engineer building AI systems that hold up in real product environments.',
    subheadline:
      'I turn ML-heavy ideas into usable software, from fast React surfaces and TypeScript services to Python-driven model workflows.',
    intro:
      'I am a Computer Science student at the University of North Texas graduating in May 2026. My work sits at the intersection of product engineering, applied AI, and developer tooling, with an emphasis on shipping software that is fast, clear, and operationally sound.',
    location: 'Denton, Texas',
    availability:
      'Open to 2026 software engineering, AI product, and platform roles.',
    primaryCta: {
      label: 'View Resume',
      href: 'https://drive.google.com/drive/folders/1i5USQb2h_LFvm5znHTaxgIt7V_RVlQ_U',
    },
    secondaryCta: {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/g-k-n/',
    },
    metrics: [
      { value: '3.9 GPA', label: 'UNT Computer Science' },
      { value: '2026', label: 'Graduation target' },
      { value: 'AI + full-stack', label: 'Primary focus' },
    ],
  },
  capabilities: [
    {
      title: 'Applied AI',
      summary:
        'Building useful systems on top of ML, LLM, and vision workflows rather than demos that stop at the prototype stage.',
      items: [
        'PyTorch',
        'scikit-learn',
        'LangChain',
        'Transfer learning',
        'LLM workflows',
        'Reinforcement learning',
      ],
    },
    {
      title: 'Product Engineering',
      summary:
        'Shipping interfaces, APIs, and operational glue that make ambitious ideas usable by real people.',
      items: [
        'TypeScript',
        'React',
        'Node.js',
        'REST APIs',
        'Stripe',
        'Dashboard design',
      ],
    },
    {
      title: 'Systems Thinking',
      summary:
        'Comfortable moving across lower-level implementation details, architecture decisions, debugging, and delivery tradeoffs.',
      items: ['C/C++', 'Java', 'SQL', 'Rust', 'Git', 'Computer networks'],
    },
  ],
  projects: {
    github: {
      display: true,
      header: 'Code Portfolio',
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
            eyebrow: 'Accessibility product',
            summary:
              'An accessibility-first communication experience designed to make note taking, captioning, and classroom collaboration easier to navigate.',
            impact:
              'Helped shape the product experience, demo narrative, and implementation direction for a capstone application centered on inclusive communication.',
            stack: ['Flutter', 'Dart', 'Accessibility UX', 'Mobile'],
            ctaLabel: 'View Repository',
            media: {
              type: 'video',
              asset: 'senscribe',
              alt: 'Senscribe demo video',
            },
          },
          {
            repo: 'psppspnaik209/FFLocker',
            label: 'FFLocker',
            featured: true,
            eyebrow: 'Windows utility',
            summary:
              'A focused desktop utility for file protection and quick locking workflows, built with a bias toward clarity over complexity.',
            impact:
              'Designed a narrow-purpose Windows tool with straightforward ergonomics, crisp feedback, and a practical security-oriented use case.',
            stack: ['C#', '.NET', 'Windows', 'Desktop UX'],
            ctaLabel: 'Open on GitHub',
            media: {
              type: 'video',
              asset: 'fflocker',
              alt: 'FFLocker demo video',
            },
          },
          {
            repo: 'psppspnaik209/MicMuteNetPublic',
            label: 'MicMuteNet',
            featured: true,
            eyebrow: 'Productivity tool',
            summary:
              'A lightweight microphone control utility that removes friction from calls, recordings, and quick switching between work contexts.',
            impact:
              'Built around fast interaction loops and a minimal footprint, with the goal of making a single repetitive workflow feel invisible.',
            stack: ['C#', 'Windows APIs', 'Desktop utility'],
            ctaLabel: 'Open on GitHub',
            media: {
              type: 'video',
              asset: 'micmutenet',
              alt: 'MicMuteNet demo video',
            },
          },
          {
            repo: 'psppspnaik209/flutter_gen_ai_demo',
            label: 'Flutter GenAI Demo',
            featured: false,
            eyebrow: 'Mobile AI prototype',
            summary:
              'A mobile prototype exploring how generative AI interactions feel in a constrained, on-device style product experience.',
            impact:
              'Used to test latency, interface guidance, and how AI affordances translate to a mobile-first interaction model.',
            stack: ['Flutter', 'Dart', 'GenAI', 'Mobile UX'],
            ctaLabel: 'View Repository',
            media: {
              type: 'video',
              asset: 'flutterGenAi',
              alt: 'Flutter GenAI demo video',
            },
          },
        ],
      },
    },
    external: {
      header: 'Additional Work',
      projects: [
        {
          title: 'Amazon DeepRacer Simulation',
          link: 'https://github.com/psppspnaik209',
          featured: false,
          eyebrow: 'Reinforcement learning experiment',
          summary:
            'Trained an autonomous racing agent in the Amazon DeepRacer environment, iterating on reward design and training behavior to improve lap consistency.',
          impact:
            'Explored reinforcement learning tradeoffs, simulation tuning, and model behavior in a constrained racing context using AWS tooling.',
          stack: ['Python', 'AWS DeepRacer', 'Reinforcement learning'],
          ctaLabel: 'GitHub Profile',
          imageUrl:
            'https://i.ibb.co/KxQqVH3V/screen-shot-2019-11-27-at-1-13-05-pm.webp',
        },
        {
          title: 'City & Disaster Simulation',
          link: 'https://github.com/psppspnaik209',
          featured: false,
          eyebrow: 'C++ systems simulation',
          summary:
            'A city growth simulation that models zoning, pollution spread, disasters, and resource allocation with an emphasis on structured state management.',
          impact:
            'Built efficient data structures and modular simulation logic to reason about complex interactions between environmental and economic systems.',
          stack: ['C++', 'Simulation design', 'Data structures'],
          ctaLabel: 'GitHub Profile',
          imageUrl: 'https://i.ibb.co/MxzQqzdD/windsimulation.jpg',
        },
      ],
    },
  },
  seo: {
    title: 'Kaushik Naik Guguloth | AI and Full-Stack Engineer',
    description:
      'Portfolio of Kaushik Naik Guguloth, a University of North Texas computer science student building applied AI systems, TypeScript products, and developer-focused software.',
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
  skills: [
    'TypeScript',
    'React',
    'Node.js',
    'Python',
    'PyTorch',
    'C/C++',
    'Java',
    'SQL',
  ],
  experiences: [
    {
      company: 'Attention.Ad',
      position: 'Full Stack Developer Intern',
      from: 'Jun 2025',
      to: 'Aug 2025',
      companyLink: 'https://www.attention.ad/',
      description:
        'Built a social broadcasting workflow in TypeScript and Node.js that amplified Clanker-minted ERC-20 tokens on Base using the Twitter/X API. Shipped a real-time analytics dashboard for token telemetry, trading activity, fee earnings, and leaderboard ranking. Integrated Stripe and Alchemy, then exposed resilient REST APIs with idempotent webhooks, retry logic, and structured logging.',
    },
    {
      company: 'Indo Welsh Company',
      position: 'AI/ML Engineer',
      from: 'Jan 2025',
      to: 'May 2025',
      companyLink: '',
      description:
        'Designed ML systems for analytics, forecasting, and automation using Python, PyTorch, and scikit-learn, improving operational efficiency by 20%. Built an LLM-based support chatbot with LangChain and vector search, and developed a computer vision defect detection workflow with transfer learning. Partnered with backend engineers on FastAPI services and production-minded deployment patterns.',
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
      degree:
        'Bachelor of Science in Computer Science, ABET accredited, GPA 3.9',
      from: 'Aug 2023',
      to: 'May 2026',
      link: 'https://engineering.unt.edu/cse/index.html',
    },
  ],
  themeConfig: {
    defaultTheme: 'procyon',
    disableSwitch: true,
    respectPrefersColorScheme: false,
    displayAvatarRing: false,
    themes: [],
    customTheme: {
      primary: '#2f6b66',
      secondary: '#f1ece2',
      accent: '#b85c38',
      neutral: '#1c1f1d',
      'base-100': '#f5f1e8',
      'base-200': '#efe7d9',
      'base-300': '#e2d8c7',
      '--rounded-box': '1.25rem',
      '--rounded-btn': '999px',
      '--rounded-badge': '999px',
      '--animation-btn': '0.2s',
      '--animation-input': '0.2s',
      '--border-btn': '1px solid #2f6b66',
    },
  },
  footer: 'Designed and engineered by Kaushik Naik Guguloth.',
  enablePWA: true,
};

export default CONFIG;
