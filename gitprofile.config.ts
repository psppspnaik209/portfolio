const CONFIG = {
  github: {
    username: 'psppspnaik209',
  },
  base: '/portfolio/',
  personal: {
    name: 'Kaushik Naik Guguloth',
    headline: 'I build software that feels clear, useful, and solid to use.',
    subheadline:
      'My work spans web apps, mobile prototypes, desktop tools, and the backend systems that support them.',
    intro:
      'I am a Computer Science student at the University of North Texas graduating in 2026. I like building products that solve practical problems, especially when they need thoughtful UI, clean implementation, and a bit of systems thinking behind the scenes.',
    availability: 'Open to software engineering roles in 2026.',
    primaryCta: {
      label: 'View Resume',
      href: 'https://drive.google.com/drive/folders/1i5USQb2h_LFvm5znHTaxgIt7V_RVlQ_U',
    },
    secondaryCta: {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/g-k-n/',
    },
    metrics: [],
  },
  capabilities: [
    {
      title: 'Programming Languages',
      summary:
        'Languages I reach for across product work, systems work, and experiments.',
      items: [
        'C/C++',
        'C#',
        'Python',
        'Java',
        'Swift',
        'Kotlin',
        'SQL',
        'Rust',
        'Dart',
      ],
    },
    {
      title: 'Web & Frameworks',
      summary:
        'Frameworks and platforms I use to ship interfaces, APIs, and desktop experiences.',
      items: [
        'TypeScript',
        'JavaScript',
        'React',
        'Node.js',
        '.NET',
        'WinUI 3',
        'HTML/CSS',
        'Flutter',
      ],
    },
    {
      title: 'AI & Machine Learning',
      summary:
        'Areas I use when a product needs classification, language, or model-driven interaction.',
      items: [
        'PyTorch/TensorFlow',
        'Deep Learning',
        'Reinforcement Learning',
        'LLM Prompt Engineering',
      ],
    },
    {
      title: 'Developer Tools & Platforms',
      summary: 'Tools I use to build, debug, document, and ship work.',
      items: [
        'Git',
        'Visual Studio',
        'AWS',
        'Docker',
        'Figma',
        'Mermaid',
        'UML',
      ],
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
              'A cross-platform accessibility app built to help people with hearing impairments catch what is happening around them in real time.',
            impact:
              'Built as part of Team STARK, Senscribe combines real-time sound classification, speech-to-text, text-to-speech, name recognition, trigger-word alerts, sound direction cues, and on-device conversation summaries inside a high-contrast mobile UI.',
            stack: [
              'Flutter',
              'Dart',
              'Speech-to-text',
              'Text-to-speech',
              'On-device AI',
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
            eyebrow: 'Windows utility',
            summary:
              'A Windows file utility focused on fast locking workflows and a straightforward, no-fuss interface.',
            impact:
              'Built around a small surface area and clear desktop behavior, with the goal of making a repetitive security task feel quick instead of heavy.',
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
            eyebrow: 'Mobile AI demo',
            summary:
              'A Flutter prototype showing how a small language model can run locally on a mobile device instead of relying on a hosted backend.',
            impact:
              'The project focuses on packaging local AI on-device, working around model size constraints, and proving that mobile-first GenAI can feel immediate without sending every request to the cloud.',
            stack: ['Flutter', 'Dart', 'On-device AI', 'Phi-3.5', 'Mobile'],
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
            eyebrow: 'Utility app',
            summary:
              'A lightweight microphone control utility built to remove friction from day-to-day call and recording setups.',
            impact:
              'A compact desktop-focused tool designed around quick toggles, low overhead, and a single job done well.',
            stack: ['C#', 'Windows APIs', 'Desktop utility'],
            ctaLabel: 'View Repository',
          },
          {
            repo: 'psppspnaik209/FinderPath26',
            label: 'FinderPath26',
            featured: false,
            eyebrow: 'macOS menu bar utility',
            summary:
              'A macOS 12+ menu bar utility that overlays an editable path field directly into Finder’s toolbar pathname region.',
            impact:
              'Tracks the front Finder window with Accessibility APIs, syncs the visible path, navigates on Return, reverts on Escape, and can run with an optional status bar icon.',
            stack: ['Swift', 'macOS', 'Accessibility APIs', 'Menu bar utility'],
            ctaLabel: 'View Repository',
          },
        ],
      },
    },
    external: {
      header: 'Additional Work',
      projects: [
        {
          title: 'Amazon DeepRacer Simulation',
          featured: false,
          eyebrow: 'Reinforcement learning experiment',
          summary:
            'Trained an autonomous racing agent in the Amazon DeepRacer environment, iterating on reward design and training behavior to improve lap consistency.',
          impact:
            'Explored reinforcement learning tradeoffs, simulation tuning, and model behavior in a constrained racing context using AWS tooling.',
          stack: ['Python', 'AWS DeepRacer', 'Reinforcement learning'],
          imageUrl:
            'https://i.ibb.co/KxQqVH3V/screen-shot-2019-11-27-at-1-13-05-pm.webp',
        },
        {
          title: 'City & Disaster Simulation',
          featured: false,
          eyebrow: 'C++ systems simulation',
          summary:
            'A city growth simulation that models zoning, pollution spread, disasters, and resource allocation with an emphasis on structured state management.',
          impact:
            'Built efficient data structures and modular simulation logic to reason about complex interactions between environmental and economic systems.',
          stack: ['C++', 'Simulation design', 'Data structures'],
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
      position: 'Full Stack Developer',
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
      companyLink: 'https://indowelshcompany.com/',
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
      degree: 'Bachelor of Science in Computer Science',
      from: '',
      to: '2026',
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
  footer: 'Designed and built by GKN',
  enablePWA: true,
};

export default CONFIG;
