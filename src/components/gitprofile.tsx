import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { formatDistance } from 'date-fns';
import { HelmetProvider } from 'react-helmet-async';
import { CustomError, INVALID_CONFIG_ERROR } from '../constants/errors';
import '../styles/index.css';
import {
  getLanguageColor,
  getSanitizedConfig,
  setupHotjar,
  useCopyToClipboard,
} from '../utils';
import {
  SanitizedConfig,
  SanitizedExternalProject,
  SanitizedGitHubManualProject,
  SanitizedProjectMedia,
} from '../interfaces/sanitized-config';
import { GithubProject } from '../interfaces/github-project';
import ErrorPage from './error-page';
import HeadTagEditor from './head-tag-editor';
import YouTubePlayer from './youtube-player';
import { HeroAurora, Magnetic, ScrollProgress, ThemeToggle } from './ui';
import { ToastProvider } from './toast-provider';
import { useToast } from '../toast-context';
import { CommandPalette, CommandItem } from './command-palette';
import { useIsMac, useScrollSpy, useTheme } from '../hooks';

const SECRET_AVATAR = ['https://i.im', 'gur.com/AMn', 'SXrQ.png'].join('');

const navItems = [
  { id: 'top', label: 'Home' },
  { id: 'experience', label: 'Experience' },
  { id: 'work', label: 'Work' },
  { id: 'stack', label: 'Stack' },
  { id: 'contact', label: 'Contact' },
];

const toAbsoluteLinkedIn = (value?: string) => {
  if (!value) return undefined;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `https://www.linkedin.com/in/${value}/`;
};

const toEmailList = (email?: string | string[]) => {
  if (!email) return [];
  const list = Array.isArray(email) ? email : [email];
  return list.map((address) => ({ label: address }));
};

const toPhoneLink = (phone?: string) => {
  if (!phone) return undefined;
  const digits = phone.replace(/[^\d+]/g, '');
  return { label: phone, href: `tel:${digits}` };
};

const resolveMediaSource = (media?: SanitizedProjectMedia) =>
  media?.src || undefined;

const fallbackRepoLink = (repo: string) => `https://github.com/${repo}`;

const getRepoKey = (project: GithubProject) =>
  (project.full_name || project.name).toLowerCase();

const getGithubErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return 'Repository data is temporarily unavailable.';
  }
  if (error.response?.status === 403) {
    const resetHeader = error.response.headers?.['x-ratelimit-reset'];
    const resetTimestamp = Number(resetHeader);
    if (!Number.isNaN(resetTimestamp) && resetTimestamp > 0) {
      const resetTime = formatDistance(
        new Date(resetTimestamp * 1000),
        new Date(),
        { addSuffix: true },
      );
      return `GitHub rate-limited the live repository feed. It should recover ${resetTime}.`;
    }
    return 'GitHub rate-limited the live repository feed. Try again shortly.';
  }
  if (error.response?.status === 404) {
    return 'The configured GitHub profile could not be found.';
  }
  return 'Repository data is temporarily unavailable.';
};

const pad2 = (n: number) => n.toString().padStart(2, '0');

/* -------------------------------------------------------------------------- */
/*                             Reveal wrapper                                 */
/* -------------------------------------------------------------------------- */

const Reveal = ({
  children,
  delay = 0,
  y = 16,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) => {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               Nav component                                */
/* -------------------------------------------------------------------------- */

const TopNav = ({
  activeId,
  onOpenPalette,
  isMac,
}: {
  activeId: string | null;
  onOpenPalette: () => void;
  isMac: boolean;
}) => {
  return (
    <header className="site-nav">
      <ScrollProgress />
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <a
          href="#top"
          className="font-accent text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink)]"
        >
          GKN<span className="text-[var(--accent)]">.</span>
        </a>

        <nav
          className="hidden items-center md:flex"
          aria-label="Primary navigation"
        >
          <div className="nav-group">
            {navItems.map((item) => {
              const isActive = activeId === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  data-active={isActive}
                  className="nav-item"
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="nav-indicator"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 32,
                      }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </a>
              );
            })}
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPalette}
            className="command-trigger hidden sm:inline-flex"
            aria-label="Open command palette"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span>Search</span>
            <kbd className="rounded border border-[var(--line)] bg-[var(--bg)] px-1.5 py-0.5 text-[10px] leading-none text-[var(--ink)]">
              {isMac ? '⌘' : 'Ctrl'} K
            </kbd>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Main component                                */
/* -------------------------------------------------------------------------- */

const GitProfileInner = ({ config }: { config: Config }) => {
  const prefersReducedMotion = useReducedMotion();
  const [sanitizedConfig] = useState<SanitizedConfig | Record<string, never>>(
    getSanitizedConfig(config),
  );
  const [configError, setConfigError] = useState<CustomError | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [githubProjects, setGithubProjects] = useState<GithubProject[]>([]);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [showSecretAvatar, setShowSecretAvatar] = useState(false);
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const [hoveredExperience, setHoveredExperience] = useState<number | null>(
    null,
  );
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { copy } = useCopyToClipboard();
  const { push: pushToast } = useToast();
  const isMac = useIsMac();
  const { theme, toggle: toggleTheme } = useTheme();

  const sectionIds = useMemo(() => navItems.map((n) => n.id), []);
  const activeSection = useScrollSpy(sectionIds);

  const getGithubProjects = useCallback(
    async (publicRepoCount: number): Promise<GithubProject[]> => {
      if (!('projects' in sanitizedConfig)) return [];
      if (sanitizedConfig.projects.github.mode === 'automatic') {
        if (publicRepoCount === 0) return [];

        if (sanitizedConfig.projects.github.automatic.source === 'pinned') {
          const url = `https://gh-pinned-repos.egoist.dev/?username=${sanitizedConfig.github.username}`;
          const repoResponse = await axios.get(url);
          return repoResponse.data.map(
            (project: {
              repo: string;
              link: string;
              description: string;
              stars: number;
              forks: number;
              language: string;
            }) => ({
              name: project.repo,
              full_name: `${sanitizedConfig.github.username}/${project.repo}`,
              html_url: project.link,
              description: project.description || '',
              stargazers_count: project.stars,
              forks_count: project.forks,
              language: project.language || 'Unknown',
            }),
          );
        }

        const excludeRepo =
          sanitizedConfig.projects.github.automatic.exclude.projects
            .map((p) => `+-repo:${p}`)
            .join('');
        const query = `user:${sanitizedConfig.github.username}+fork:${!sanitizedConfig.projects.github.automatic.exclude.forks}${excludeRepo}`;
        const url = `https://api.github.com/search/repositories?q=${query}&sort=${sanitizedConfig.projects.github.automatic.sortBy}&per_page=${sanitizedConfig.projects.github.automatic.limit}&type=Repositories`;
        const repoResponse = await axios.get(url, {
          headers: { 'Content-Type': 'application/vnd.github.v3+json' },
        });
        return repoResponse.data.items.map(
          (item: GithubProject & { full_name?: string }) => ({
            ...item,
            description: item.description || '',
            language: item.language || 'Unknown',
          }),
        );
      }

      if (sanitizedConfig.projects.github.manual.projects.length === 0)
        return [];
      const repos = sanitizedConfig.projects.github.manual.projects
        .map((p) => `+repo:${p.repo}`)
        .join('');
      const url = `https://api.github.com/search/repositories?q=${repos}+fork:true&type=Repositories`;
      const repoResponse = await axios.get(url, {
        headers: { 'Content-Type': 'application/vnd.github.v3+json' },
      });
      return repoResponse.data.items.map(
        (item: GithubProject & { full_name?: string }) => ({
          ...item,
          description: item.description || '',
          language: item.language || 'Unknown',
        }),
      );
    },
    [sanitizedConfig],
  );

  const loadData = useCallback(async () => {
    if (!('github' in sanitizedConfig) || !('projects' in sanitizedConfig))
      return;
    setLoadingRepos(true);
    setGithubError(null);
    try {
      const profileResponse = await axios.get(
        `https://api.github.com/users/${sanitizedConfig.github.username}`,
      );
      const data = profileResponse.data;
      setProfileAvatar(data.avatar_url || null);
      if (!sanitizedConfig.projects.github.display) {
        setGithubProjects([]);
        return;
      }
      try {
        const repos = await getGithubProjects(data.public_repos || 0);
        setGithubProjects(repos);
      } catch (repoError) {
        setGithubProjects([]);
        setGithubError(getGithubErrorMessage(repoError));
      }
    } catch (error) {
      setProfileAvatar(null);
      setGithubProjects([]);
      setGithubError(getGithubErrorMessage(error));
    } finally {
      setLoadingRepos(false);
    }
  }, [getGithubProjects, sanitizedConfig]);

  useEffect(() => {
    if (Object.keys(sanitizedConfig).length === 0) {
      setConfigError(INVALID_CONFIG_ERROR);
      return;
    }
    setConfigError(null);
    if ('hotjar' in sanitizedConfig) setupHotjar(sanitizedConfig.hotjar);
    void loadData();
  }, [sanitizedConfig, loadData]);

  const handleCopyEmail = useCallback(
    async (email: string) => {
      const didCopy = await copy(email);
      if (didCopy) pushToast(`Copied ${email}`, 'success');
    },
    [copy, pushToast],
  );

  if (!('personal' in sanitizedConfig) || configError) {
    return (
      <ErrorPage
        status={configError?.status || INVALID_CONFIG_ERROR.status}
        title={configError?.title || INVALID_CONFIG_ERROR.title}
        subTitle={configError?.subTitle || INVALID_CONFIG_ERROR.subTitle}
      />
    );
  }

  const manualProjects = sanitizedConfig.projects.github.manual.projects;
  const manualProjectMap = new Map(
    manualProjects.map((p) => [p.repo.toLowerCase(), p]),
  );

  const repositoryCards = githubProjects.map((project) => {
    const metadata = manualProjectMap.get(getRepoKey(project));
    return {
      ...project,
      label: metadata?.label || project.name,
      eyebrow: metadata?.eyebrow,
      summary: metadata?.summary || project.description,
      featured: metadata?.featured ?? false,
      stack: metadata?.stack || [],
      ctaLabel: metadata?.ctaLabel || 'Open Repository',
      media: metadata?.media,
      repo:
        metadata?.repo ||
        project.full_name ||
        `${sanitizedConfig.github.username}/${project.name}`,
    };
  });

  const featuredWork: Array<
    | (SanitizedGitHubManualProject & {
        type: 'github';
        href: string;
        liveProject?: GithubProject;
      })
    | (SanitizedExternalProject & {
        type: 'external';
        href: string;
      })
  > = [
    ...manualProjects
      .filter((p) => p.featured)
      .map((p) => ({
        ...p,
        type: 'github' as const,
        href:
          repositoryCards.find(
            (card) => card.repo.toLowerCase() === p.repo.toLowerCase(),
          )?.html_url || fallbackRepoLink(p.repo),
        liveProject: repositoryCards.find(
          (card) => card.repo.toLowerCase() === p.repo.toLowerCase(),
        ),
      })),
    ...sanitizedConfig.projects.external.projects
      .filter((p) => p.featured)
      .map((p) => ({
        ...p,
        type: 'external' as const,
        href: p.link || '#',
      })),
  ];

  const otherRepos = repositoryCards.filter((p) => !p.featured);
  const additionalWork = sanitizedConfig.projects.external.projects.filter(
    (p) => !p.featured,
  );
  const emailLinks = toEmailList(sanitizedConfig.social.email);
  const phoneLink = toPhoneLink(sanitizedConfig.social.phone);
  const linkedInLink = toAbsoluteLinkedIn(sanitizedConfig.social.linkedin);
  const githubProfileLink = `https://github.com/${sanitizedConfig.github.username}`;
  const visibleAvatar =
    showSecretAvatar && profileAvatar ? SECRET_AVATAR : profileAvatar;

  /* ---------------------------- Command palette ---------------------------- */
  const commands: CommandItem[] = [
    ...navItems.map((item) => ({
      id: `go-${item.id}`,
      group: 'Navigate',
      label: `Jump to ${item.label}`,
      icon: '→',
      keywords: [item.id, item.label, 'scroll', 'jump', 'section'],
      perform: () => {
        document
          .getElementById(item.id)
          ?.scrollIntoView({ behavior: 'smooth' });
      },
    })),
    ...featuredWork.map((project, idx) => {
      const title =
        project.type === 'github'
          ? project.label || project.repo
          : project.title;
      return {
        id: `project-${idx}`,
        group: 'Projects',
        label: `Open ${title}`,
        icon: '⚡',
        keywords: [
          title,
          ...project.stack,
          project.eyebrow || '',
          'github',
          'project',
        ],
        perform: () => window.open(project.href, '_blank', 'noopener'),
      };
    }),
    ...emailLinks.map((item) => ({
      id: `copy-${item.label}`,
      group: 'Actions',
      label: `Copy email — ${item.label}`,
      icon: '✎',
      keywords: ['email', 'copy', 'mail', 'contact'],
      perform: () => void handleCopyEmail(item.label),
    })),
    {
      id: 'open-linkedin',
      group: 'Actions',
      label: 'Open LinkedIn',
      icon: '↗',
      keywords: ['linkedin', 'social'],
      perform: () =>
        linkedInLink && window.open(linkedInLink, '_blank', 'noopener'),
    },
    {
      id: 'open-github',
      group: 'Actions',
      label: 'Open GitHub',
      icon: '↗',
      keywords: ['github', 'social', 'code'],
      perform: () => window.open(githubProfileLink, '_blank', 'noopener'),
    },
    ...(sanitizedConfig.resume.fileUrl
      ? [
          {
            id: 'open-resume',
            group: 'Actions',
            label: 'Open resume',
            icon: '↗',
            keywords: ['resume', 'cv', 'download'],
            perform: () =>
              window.open(
                sanitizedConfig.resume.fileUrl!,
                '_blank',
                'noopener',
              ),
          },
        ]
      : []),
    {
      id: 'toggle-theme',
      group: 'Preferences',
      label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`,
      icon: theme === 'dark' ? '☀' : '☾',
      keywords: ['theme', 'dark', 'light', 'mode', 'toggle', 'color'],
      perform: () => toggleTheme(),
    },
    {
      id: 'secret-avatar',
      group: 'Preferences',
      label: 'Toggle profile easter egg',
      icon: '★',
      keywords: ['avatar', 'easter egg', 'secret'],
      perform: () => setShowSecretAvatar((v) => !v),
    },
  ];

  return (
    <HelmetProvider>
      <div className="site-shell min-h-screen">
        <HeadTagEditor googleAnalyticsId={sanitizedConfig.googleAnalytics.id} />

        <TopNav
          activeId={activeSection}
          onOpenPalette={() => setPaletteOpen(true)}
          isMac={isMac}
        />

        <main className="mx-auto flex w-full max-w-6xl flex-col px-5 pb-24 md:px-8">
          {/* ============================== HERO ============================== */}
          <section id="top" className="relative pt-20 md:pt-28">
            <HeroAurora />

            <div className="relative z-10 flex flex-col gap-10 md:flex-row md:items-start md:justify-between md:gap-14">
              <div className="min-w-0 flex-1">
                <Reveal>
                  <p className="status-line inline-flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                    <span className="status-dot" aria-hidden="true" />
                    <span>
                      {sanitizedConfig.personal.availability ||
                        'Available for roles'}
                    </span>
                  </p>
                </Reveal>

                <Reveal delay={0.08}>
                  <h1 className="mt-7 max-w-4xl font-display text-5xl font-semibold leading-[0.94] tracking-[-0.04em] text-[var(--ink)] md:text-7xl">
                    {sanitizedConfig.personal.headline}
                  </h1>
                </Reveal>

                {sanitizedConfig.personal.intro ? (
                  <Reveal delay={0.16}>
                    <p className="mt-8 max-w-3xl text-lg leading-9 text-[var(--ink)] md:text-xl md:leading-9">
                      {sanitizedConfig.personal.intro}
                    </p>
                  </Reveal>
                ) : null}

                <Reveal delay={0.24}>
                  <div className="mt-10 flex flex-wrap items-center gap-4">
                    {sanitizedConfig.personal.primaryCta ? (
                      <Magnetic>
                        <a
                          href={sanitizedConfig.personal.primaryCta.href}
                          target="_blank"
                          rel="noreferrer"
                          className="cta cta-primary rounded-full px-6 py-3 font-accent text-xs font-semibold uppercase tracking-[0.18em]"
                        >
                          <span>
                            {sanitizedConfig.personal.primaryCta.label}
                          </span>
                          <span aria-hidden="true">↗</span>
                        </a>
                      </Magnetic>
                    ) : null}
                    <Magnetic>
                      <a
                        href="#contact"
                        className="cta cta-secondary rounded-full px-6 py-3 font-accent text-xs font-semibold uppercase tracking-[0.18em]"
                      >
                        Get in touch
                      </a>
                    </Magnetic>
                    <button
                      type="button"
                      onClick={() => setPaletteOpen(true)}
                      className="cta cta-ghost inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em]"
                    >
                      <span>Search portfolio</span>
                      <kbd className="rounded border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] leading-none text-[var(--ink)]">
                        {isMac ? '⌘' : 'Ctrl'} K
                      </kbd>
                    </button>
                  </div>
                </Reveal>
              </div>

              {visibleAvatar ? (
                <Reveal delay={0.12} className="order-first md:order-last">
                  <button
                    type="button"
                    onClick={() => setShowSecretAvatar((v) => !v)}
                    className="avatar-btn"
                    aria-label="Toggle profile picture"
                    aria-pressed={showSecretAvatar}
                  >
                    <span className="avatar-frame">
                      <AnimatePresence initial={false}>
                        <motion.img
                          key={showSecretAvatar ? 'secret' : 'real'}
                          src={visibleAvatar}
                          alt={sanitizedConfig.personal.name}
                          className="avatar-img"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 0.45,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          draggable={false}
                        />
                      </AnimatePresence>
                    </span>
                  </button>
                </Reveal>
              ) : null}
            </div>
          </section>

          <div className="my-24 divider-line" />

          {/* ============================ EXPERIENCE ============================ */}
          <section id="experience" className="scroll-mt-28">
            <Reveal>
              <p className="section-kicker">01 / Experience</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] md:text-5xl">
                Where I&apos;ve worked.
              </h2>
            </Reveal>

            <div
              className="exp-list mt-14 flex flex-col gap-14"
              data-hover-active={hoveredExperience !== null}
              onMouseLeave={() => setHoveredExperience(null)}
            >
              {sanitizedConfig.experiences.map((experience, idx) => (
                <Reveal
                  key={`${experience.company}-${experience.from}`}
                  delay={0.04 * idx}
                >
                  <article
                    className="exp-item grid gap-6 border-t border-[var(--line)] pt-8 md:grid-cols-[180px_1fr] md:gap-14"
                    data-hovered={hoveredExperience === idx}
                    onMouseEnter={() => setHoveredExperience(idx)}
                  >
                    <span className="exp-dot" aria-hidden="true" />

                    <div>
                      <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                        {experience.from} → {experience.to}
                      </p>
                      {experience.company ? (
                        experience.companyLink ? (
                          <a
                            href={experience.companyLink}
                            target="_blank"
                            rel="noreferrer"
                            className="link-hover mt-3 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]"
                          >
                            {experience.company}{' '}
                            <span aria-hidden="true">↗</span>
                          </a>
                        ) : (
                          <p className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                            {experience.company}
                          </p>
                        )
                      ) : null}
                    </div>

                    <div>
                      <h3 className="exp-role font-display text-2xl font-semibold tracking-[-0.02em] text-[var(--ink)] transition-colors duration-200">
                        {experience.position}
                      </h3>

                      {experience.highlights &&
                      experience.highlights.length > 0 ? (
                        <ul className="mt-5 space-y-3">
                          {experience.highlights.map((highlight, i) => (
                            <li
                              key={i}
                              className="flex gap-3 text-[15px] leading-7 text-[var(--ink)]"
                            >
                              <span
                                aria-hidden="true"
                                className="mt-[10px] h-[6px] w-[6px] flex-shrink-0 rounded-full bg-[var(--accent)]"
                              />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      ) : experience.description ? (
                        <p className="mt-5 text-[15px] leading-7 text-[var(--ink)]">
                          {experience.description}
                        </p>
                      ) : null}

                      {experience.stack && experience.stack.length > 0 ? (
                        <div className="mt-6 flex flex-wrap gap-2">
                          {experience.stack.map((item) => (
                            <span key={item} className="stack-chip">
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {experience.note ? (
                        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                          {experience.note}
                        </p>
                      ) : null}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          <div className="my-24 divider-line" />

          {/* ============================== WORK ============================== */}
          <section id="work" className="scroll-mt-28">
            <Reveal>
              <div className="flex items-baseline justify-between gap-6">
                <div>
                  <p className="section-kicker">02 / Selected work</p>
                  <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] md:text-5xl">
                    Things I&apos;ve shipped.
                  </h2>
                </div>
                <p className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ink-muted)] md:block">
                  {pad2(featuredWork.length)} projects
                </p>
              </div>
            </Reveal>

            <div
              className="project-list mt-16 flex flex-col gap-28"
              data-hover-active={hoveredProject !== null}
              onMouseLeave={() => setHoveredProject(null)}
            >
              {featuredWork.map((project, index) => {
                const mediaSource =
                  resolveMediaSource(project.media) ||
                  ('imageUrl' in project ? project.imageUrl : undefined);
                const isEmbed = project.media?.type === 'embed' && mediaSource;
                const isVideo = project.media?.type === 'video' && mediaSource;
                const liveStats =
                  project.type === 'github' ? project.liveProject : undefined;
                const hasLiveStats =
                  !!liveStats &&
                  (liveStats.stargazers_count > 0 || liveStats.forks_count > 0);
                const projectTitle =
                  project.type === 'github'
                    ? project.label || project.repo
                    : project.title;
                const playbackProfile =
                  projectTitle === 'Senscribe' ? 'senscribe' : 'muted';
                const projectBody =
                  project.summary ||
                  (project.type === 'external'
                    ? project.description
                    : project.liveProject?.description || '');
                const mediaFirst = index % 2 === 0;

                return (
                  <Reveal key={index} delay={0.04 * index} y={22}>
                    <article
                      className="project-item grid gap-10 lg:grid-cols-12 lg:gap-14"
                      data-hovered={hoveredProject === index}
                      onMouseEnter={() => setHoveredProject(index)}
                    >
                      <div
                        className={`lg:col-span-7 ${mediaFirst ? '' : 'lg:order-2'}`}
                      >
                        {mediaSource ? (
                          isEmbed ? (
                            <div className="media-frame aspect-[16/10] w-full overflow-hidden rounded-2xl">
                              <YouTubePlayer
                                url={mediaSource}
                                title={projectTitle}
                                playbackProfile={playbackProfile}
                                className="h-full w-full"
                              />
                            </div>
                          ) : isVideo ? (
                            <div className="media-frame aspect-[16/10] w-full overflow-hidden rounded-2xl">
                              <video
                                src={mediaSource}
                                poster={project.media?.poster}
                                preload="metadata"
                                autoPlay={!prefersReducedMotion}
                                loop={!prefersReducedMotion}
                                muted
                                playsInline
                                controls={!!prefersReducedMotion}
                                className="h-full w-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="media-frame aspect-[16/10] w-full overflow-hidden rounded-2xl">
                              <img
                                src={mediaSource}
                                alt={project.media?.alt || projectTitle}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )
                        ) : (
                          <div className="media-fallback aspect-[16/10] w-full overflow-hidden rounded-2xl p-8 flex items-end">
                            <span className="font-display text-4xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                              {projectTitle}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="lg:col-span-5">
                        <div className="flex items-center gap-3">
                          <span className="project-number">
                            {pad2(index + 1)}
                          </span>
                          <span className="h-px flex-1 bg-[var(--line)]" />
                          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                            {project.eyebrow || 'Project'}
                          </span>
                        </div>

                        <h3 className="project-title mt-5 text-3xl md:text-4xl">
                          {projectTitle}
                        </h3>

                        <p className="mt-5 text-base leading-8 text-[var(--ink)]">
                          {projectBody}
                        </p>
                        {project.impact ? (
                          <p className="mt-4 text-[15px] leading-7 text-[var(--ink-muted)]">
                            {project.impact}
                          </p>
                        ) : null}

                        {project.stack.length > 0 ? (
                          <div className="mt-6 flex flex-wrap gap-2">
                            {project.stack.map((item) => (
                              <span key={item} className="stack-chip">
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-7 flex flex-wrap items-center gap-5">
                          <a
                            href={project.href}
                            target="_blank"
                            rel="noreferrer"
                            className="project-cta"
                          >
                            <span>{project.ctaLabel || 'View project'}</span>
                            <span className="arrow" aria-hidden="true">
                              ↗
                            </span>
                          </a>
                          {hasLiveStats ? (
                            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                              ★ {liveStats.stargazers_count} ·{' '}
                              {liveStats.forks_count} forks
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>

            {additionalWork.length > 0 ? (
              <Reveal delay={0.1}>
                <div className="mt-28">
                  <p className="section-kicker">Also</p>
                  <div className="mt-6 grid gap-10 md:grid-cols-2">
                    {additionalWork.map((project) => (
                      <article
                        key={project.title}
                        className="border-t border-[var(--line)] pt-6"
                      >
                        <div className="flex items-baseline justify-between gap-4">
                          <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                            {project.title}
                          </h3>
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                            {project.eyebrow}
                          </span>
                        </div>
                        <p className="mt-3 text-[15px] leading-7 text-[var(--ink-muted)]">
                          {project.summary || project.description}
                        </p>
                        {project.stack.length > 0 ? (
                          <p className="mt-3 font-mono text-[12px] text-[var(--ink-muted)]">
                            {project.stack.join(' · ')}
                          </p>
                        ) : null}
                        {project.link ? (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noreferrer"
                            className="link-hover mt-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]"
                          >
                            {project.ctaLabel || 'View'}{' '}
                            <span aria-hidden="true">↗</span>
                          </a>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </div>
              </Reveal>
            ) : null}
          </section>

          {/* ============================== STACK ============================== */}
          <section id="stack" className="scroll-mt-28">
            <Reveal>
              <p className="section-kicker">03 / Stack</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] md:text-5xl">
                What I reach for.
              </h2>
            </Reveal>

            <dl className="mt-12 flex flex-col">
              {sanitizedConfig.capabilities.map((capability, i) => (
                <Reveal key={capability.title} delay={0.05 * i} y={12}>
                  <div
                    className={`grid gap-4 py-8 md:grid-cols-[220px_1fr] md:gap-14 ${i > 0 ? 'border-t border-[var(--line)]' : ''}`}
                  >
                    <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                      {capability.title}
                    </dt>
                    <dd className="m-0">
                      <div className="flex flex-wrap gap-2">
                        {capability.items.map((item) => (
                          <span key={item} className="stack-chip">
                            {item}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                </Reveal>
              ))}
            </dl>
          </section>

          {/* ============================ MORE REPOS ============================ */}
          {(loadingRepos || otherRepos.length > 0 || githubError) && (
            <>
              <div className="my-24 divider-line" />
              <section id="more" className="scroll-mt-28">
                <Reveal>
                  <p className="section-kicker">
                    04 / {sanitizedConfig.projects.github.header}
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] md:text-5xl">
                    Smaller repos.
                  </h2>
                </Reveal>

                {githubError ? (
                  <p className="mt-6 text-sm text-[var(--ink-muted)]">
                    {githubError}
                  </p>
                ) : null}

                {loadingRepos ? (
                  <p className="mt-6 font-mono text-sm uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    Loading repository data...
                  </p>
                ) : null}

                {otherRepos.length > 0 ? (
                  <ul className="mt-10 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                    {otherRepos.map((project, idx) => (
                      <li key={project.repo}>
                        <Reveal delay={0.03 * idx} y={8}>
                          <a
                            href={project.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="repo-row grid items-baseline gap-3 md:grid-cols-[200px_1fr_auto]"
                          >
                            <div>
                              <p className="font-display text-lg font-semibold tracking-[-0.02em] text-[var(--ink)]">
                                {project.label}
                              </p>
                              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                                {project.eyebrow || 'Repository'}
                              </p>
                            </div>
                            <p className="text-[15px] leading-7 text-[var(--ink-muted)]">
                              {project.summary ||
                                'Repository details on GitHub.'}
                            </p>
                            <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                              <span className="flex items-center gap-2">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor: getLanguageColor(
                                      project.language,
                                    ),
                                  }}
                                />
                                {project.language}
                              </span>
                              <span>★ {project.stargazers_count}</span>
                              <span aria-hidden="true">↗</span>
                            </div>
                          </a>
                        </Reveal>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            </>
          )}

          <div className="my-24 divider-line" />

          {/* ============================== CONTACT ============================== */}
          <section id="contact" className="scroll-mt-28">
            <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <Reveal>
                  <p className="section-kicker">05 / Contact</p>
                  <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] md:text-5xl">
                    Let&apos;s talk.
                  </h2>
                  <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--ink)]">
                    {sanitizedConfig.personal.availability} The fastest way to
                    reach me is email or LinkedIn — or hit{' '}
                    <kbd className="rounded border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--ink)]">
                      {isMac ? '⌘' : 'Ctrl'} K
                    </kbd>{' '}
                    to copy any of this straight from the palette.
                  </p>
                </Reveal>

                <ul className="mt-10 space-y-0 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                  {emailLinks.map((item, idx) => (
                    <Reveal key={item.label} delay={0.03 * idx} y={8}>
                      <li
                        className="contact-row flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                        onClick={() => void handleCopyEmail(item.label)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            void handleCopyEmail(item.label);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div>
                          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                            Email
                          </p>
                          <span className="selectable-copy mt-1 block break-all font-mono text-[14px] text-[var(--ink)]">
                            {item.label}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
                          Click to copy
                        </span>
                      </li>
                    </Reveal>
                  ))}

                  {phoneLink ? (
                    <li className="contact-row flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                          Phone
                        </p>
                        <a
                          href={phoneLink.href}
                          className="mt-1 block font-mono text-[14px] text-[var(--ink)]"
                        >
                          {phoneLink.label}
                        </a>
                      </div>
                    </li>
                  ) : null}

                  {linkedInLink ? (
                    <li className="contact-row flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                          LinkedIn
                        </p>
                        <a
                          href={linkedInLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block font-mono text-[14px] text-[var(--ink)]"
                        >
                          /in/{sanitizedConfig.social.linkedin}
                        </a>
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                        ↗
                      </span>
                    </li>
                  ) : null}

                  <li className="contact-row flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                        GitHub
                      </p>
                      <a
                        href={githubProfileLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block font-mono text-[14px] text-[var(--ink)]"
                      >
                        /{sanitizedConfig.github.username}
                      </a>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                      ↗
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-10">
                <Reveal delay={0.08}>
                  <div>
                    <p className="section-kicker">Education</p>
                    {sanitizedConfig.educations.map((education) => (
                      <div
                        key={`${education.institution}-${education.from}`}
                        className="mt-5"
                      >
                        <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                          {education.degree}
                        </h3>
                        {education.link ? (
                          <a
                            href={education.link}
                            target="_blank"
                            rel="noreferrer"
                            className="link-hover mt-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]"
                          >
                            {education.institution}{' '}
                            <span aria-hidden="true">↗</span>
                          </a>
                        ) : (
                          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">
                            {education.institution}
                          </p>
                        )}
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                          Graduating {education.to}
                        </p>
                      </div>
                    ))}
                  </div>
                </Reveal>

                {sanitizedConfig.certifications.length > 0 ? (
                  <Reveal delay={0.14}>
                    <div>
                      <p className="section-kicker">Certifications</p>
                      <div className="mt-5 space-y-4">
                        {sanitizedConfig.certifications.map((certification) => {
                          const titleNode = (
                            <h3 className="cert-title font-display text-lg font-semibold tracking-[-0.02em] text-[var(--ink)]">
                              {certification.name}
                              {certification.link ? (
                                <span className="cert-arrow" aria-hidden="true">
                                  {' '}
                                  ↗
                                </span>
                              ) : null}
                            </h3>
                          );
                          return (
                            <div key={certification.name}>
                              {certification.link ? (
                                <a
                                  href={certification.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="cert-link block"
                                >
                                  {titleNode}
                                </a>
                              ) : (
                                titleNode
                              )}
                              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                                {certification.body}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Reveal>
                ) : null}

                {sanitizedConfig.resume.fileUrl ? (
                  <Reveal delay={0.2}>
                    <Magnetic>
                      <a
                        href={sanitizedConfig.resume.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="cta cta-primary inline-flex w-full items-center justify-center rounded-full px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em]"
                      >
                        <span>Download Resume</span>
                        <span aria-hidden="true">↓</span>
                      </a>
                    </Magnetic>
                  </Reveal>
                ) : null}
              </div>
            </div>
          </section>
        </main>

        <footer className="mx-auto w-full max-w-6xl px-5 pb-10 md:px-8">
          <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-6 md:flex-row md:items-center md:justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              {sanitizedConfig.footer}
            </p>
            <AnimatePresence>
              {visibleAvatar ? (
                <motion.button
                  key="avatar"
                  type="button"
                  onClick={() => setShowSecretAvatar((v) => !v)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  ● {sanitizedConfig.personal.name}
                </motion.button>
              ) : (
                <motion.button
                  key="no-avatar"
                  type="button"
                  onClick={() => setShowSecretAvatar((v) => !v)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  ○ {sanitizedConfig.personal.name}
                </motion.button>
              )}
            </AnimatePresence>
            <div className="flex flex-wrap items-center gap-5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              <a href="#top" className="link-hover hover:text-[var(--ink)]">
                Top
              </a>
              <a
                href="#experience"
                className="link-hover hover:text-[var(--ink)]"
              >
                Experience
              </a>
              <a href="#work" className="link-hover hover:text-[var(--ink)]">
                Work
              </a>
              <a href="#contact" className="link-hover hover:text-[var(--ink)]">
                Contact
              </a>
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="link-hover hover:text-[var(--ink)]"
              >
                ⌘K Search
              </button>
            </div>
          </div>
        </footer>

        <CommandPalette
          items={commands}
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
        />
      </div>
    </HelmetProvider>
  );
};

const GitProfile = ({ config }: { config: Config }) => (
  <HelmetProvider>
    <ToastProvider>
      <GitProfileInner config={config} />
    </ToastProvider>
  </HelmetProvider>
);

export default GitProfile;
