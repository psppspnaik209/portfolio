// gitprofile.config.ts

const CONFIG = {
  github: {
    username: 'psppspnaik209', // Your GitHub org/user name. (This is the only required config)
  },
  /**
   * If you are deploying to https://<USERNAME>.github.io/, for example your repository is at https://github.com/arifszn/arifszn.github.io, set base to '/'.
   * If you are deploying to https://<USERNAME>.github.io/<REPO_NAME>/,
   * for example your repository is at https://github.com/arifszn/portfolio, then set base to '/portfolio/'.
   */
  base: '/portfolio/',
  projects: {
    github: {
      display: true, // Display GitHub projects?
      header: 'Github Projects',
      mode: 'manual', // Mode can be: 'automatic' or 'manual'
      automatic: {
        sortBy: 'updated', // Sort projects by 'stars' or 'updated'
        limit: 8, // How many projects to display.
        exclude: {
          forks: true, // Forked projects will not be displayed if set to true.
          projects: [], // These projects will not be displayed. example: ['arifszn/my-project1', 'arifszn/my-project2']
        },
      },
      manual: {
        // Properties for manually specifying projects
        projects: [
          'S-T-A-R-K-Projects/Capstone-Project',
          'psppspnaik209/FFLocker',
          'psppspnaik209/portfolio',
          'psppspnaik209/WinTaskBarAutoHideFix',
        ], // List of repository names to display. example: ['arifszn/my-project1', 'arifszn/my-project2']
      },
    },
    external: {
      header: 'My Projects',
      // To hide the `External Projects` section, keep it empty.
      projects: [
        {
          title: 'Amazon Deepracer Simulation',
          description:
            'Solo developed a reinforcement learning simulation on the Amazon DeepRacer platform, training an autonomous vehicle to navigate a virtual track using state-of-the-art machine learning algorithms. Designed and implemented reward functions and tuning strategies to optimize performance, showcasing a strong grasp of reinforcement learning principles in an autonomous driving context. Leveraged AWS machine learning tools and services to build a robust training pipeline, demonstrating advanced technical proficiency and innovation in applying ML to real-world scenarios.',
          imageUrl:
            'https://img.freepik.com/free-vector/illustration-gallery-icon_53876-27002.jpg',
          link: 'https://example.com',
        },
        {
          title: 'City & Disaster Simulation',
          description:
            'Solo Developed a city growth simulation in C++ that models residential, commercial, and industrial zones while incorporating pollution spread, disaster simulations, and resource allocation. Designed and implemented efficient data structures for effective zone management and region analysis. Followed modular coding practices and employed Git for version control, and design documents in UML format.',
          imageUrl:
            'https://img.freepik.com/free-vector/illustration-gallery-icon_53876-27002.jpg',
          link: 'https://example.com',
        },
      ],
    },
  },
  seo: {
    title: 'Portfolio of Kaushik Naik',
    description:
      'I am a dedicated Computer Science student at the University of North Texas, set to graduate in May 2026 from an ABET-accredited program. I specialize in C/C++, Python, AI, ML, HTML, CSS, JavaScript, and React, and I am passionate about leveraging my technical skills to drive innovative projects. With strong expertise in coding, programming, and data structures and algorithms, I am eager to contribute to exciting opportunities that challenge me to achieve tangible results in the ever-evolving world of technology.',
    imageURL: '',
  },
  social: {
    linkedin: 'g-k-n',
    ///x: 'arif_szn',
    ///mastodon: 'arifszn@mastodon.social',
    researchGate: '',
    facebook: '',
    instagram: '',
    reddit: '',
    threads: '',
    youtube: '', // example: 'pewdiepie'
    udemy: '',
    dribbble: '',
    behance: '',
    ///medium: 'arifszn',
    ///dev: 'arifszn',
    stackoverflow: '', // example: '1/jeff-atwood'
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
    'C/C++',
    'Python',
    'Java',
    'SQL',
    'Rust',
    'C#',
    'HTML',
    'CSS',
    'JavaScript',
    'React',
    'TypeScript',
    'Node.js',
    'REST APIs',
    'AI',
    'ML',
    'Artificial Intelligence',
    'Machine Learning',
    'Deep Learning',
    'Neural Networks',
    'LLM’s',
    'Prompt Engineering',
    'Visual Studio Code',
    'Git',
    'UML',
    'Software Management',
    'Computer Networks',
    'Microsoft Office',
    'Troubleshooting',
    'Leadership',
    'Time Management',
    'Communication',
    'Problem-Solving',
    'Critical Thinking',
    'Multitasking',
    'Active Listening',
    'Adaptability',
    'Attention to Detail',
    'Analytical Thinking',
    'Interpersonal Skills',
    'Punctuality',
    'Reliability',
    'Multilingual (English, Hindi, Telugu)',
  ],
  experiences: [
    {
      company: 'Attenion.Ad',
      position: 'Full Stack Developer Intern',
      from: 'Jun 2025',
      to: 'Aug 2025',
      companyLink: '',
      description:
        'Collaborated on a 5-member full-stack team using TypeScript/Node.js REST APIs to refactor and create a Web 3 Crypto Prodcut. Integrated Twitter/X, Clanker, Privy, Alchemy, Stripe, Grok, OpenAl API for metadata caching, rate-limiting, trending-topic feeds, Authorizations, Payments, Base Network, Token Trading, and Image generation. Developed Uniswap modules for on-chain liquidity queries and real-time token pricing and trading. Updated front-end: token-explore pages, leaderboards, profiles, and price-history charts. Built a unified responsive user dashboard, created Franchising, Sponsorship, and Memathon tabs. Created Backend API and Front-End design docs to accelerate developer documentation.',
    },
  ],
  certifications: [
    {
      name: 'University of North Texas Artificial Intelligence',
      body: 'Certification in Artificial Intelligence',
      //year: 'Expected May 2026',
      link: 'https://www.unt.edu/academics/programs/artificial-intelligence-certificate.html',
    },
  ],
  educations: [
    {
      institution: 'University of North Texas',
      degree:
        'Bachelor of Science in Computer Science (ABET accredited), GPA: 3.9',
      from: 'Aug 2023',
      to: 'May 2026',
      link: 'https://engineering.unt.edu/cse/index.html',
    },
  ],
  // Display articles from your medium or dev account. (Optional)
  /*blog: {
    source: 'dev', // medium | dev
    username: 'arifszn', // to hide blog section, keep it empty
    limit: 2, // How many articles to display. Max is 10.
  },
  googleAnalytics: {
    id: '', // GA3 tracking id/GA4 tag id UA-XXXXXXXXX-X | G-XXXXXXXXXX
  },
  // Track visitor interaction and behavior. https://www.hotjar.com
  hotjar: {
    id: '',
    snippetVersion: 6,
  },*/
  themeConfig: {
    defaultTheme: 'procyon',

    // Hides the switch in the navbar
    // Useful if you want to support a single color mode
    disableSwitch: true,

    // Should use the prefers-color-scheme media-query,
    // using user system preferences, instead of the hardcoded defaultTheme
    respectPrefersColorScheme: false,

    // Display the ring in Profile picture
    displayAvatarRing: true,

    // Available themes. To remove any theme, exclude from here.
    themes: [],

    // Custom theme, applied to `procyon` theme
    customTheme: {
      primary: '#00ffff',
      secondary: '#1a1a2e',
      accent: '#ffff00',
      neutral: '#16213e',
      'base-100': '#0f0f23',
      'base-200': '#1a1a2e',
      'base-300': '#16213e',
      '--rounded-box': '0.5rem',
      '--rounded-btn': '0.5rem',
      '--rounded-badge': '1.5rem',
      '--animation-btn': '0.25s',
      '--animation-input': '0.2s',
      '--border-btn': '1px solid #00ffff',
    },
  },

  footer: `A TNBB Project`,

  enablePWA: true,
};

export default CONFIG;
