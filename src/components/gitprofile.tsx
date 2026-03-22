import { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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

const SECRET_AVATAR = ['https://i.im', 'gur.com/AMn', 'SXrQ.png'].join('');

const navItems = [
  { id: 'featured-work', label: 'Featured Work' },
  { id: 'code-portfolio', label: 'Code Portfolio' },
  { id: 'experience', label: 'Experience' },
  { id: 'credentials', label: 'Credentials' },
];

const sectionMotion = (reducedMotion: boolean, delay = 0) =>
  reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: {
          duration: 0.6,
          delay,
          ease: [0.22, 1, 0.36, 1] as const,
        },
      };

const toAbsoluteLinkedIn = (value?: string) => {
  if (!value) {
    return undefined;
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  return `https://www.linkedin.com/in/${value}/`;
};

const toEmailList = (email?: string | string[]) => {
  if (!email) {
    return [];
  }

  const list = Array.isArray(email) ? email : [email];
  return list.map((address) => ({
    label: address,
  }));
};

const toPhoneLink = (phone?: string) => {
  if (!phone) {
    return undefined;
  }

  const digits = phone.replace(/[^\d+]/g, '');
  return {
    label: phone,
    href: `tel:${digits}`,
  };
};

const resolveMediaSource = (media?: SanitizedProjectMedia) => {
  if (!media) {
    return undefined;
  }

  return media.src;
};

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

const SectionHeader = ({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) => (
  <div className="max-w-3xl">
    <p className="section-kicker mb-3">{eyebrow}</p>
    <div className="section-heading mb-5">
      <h2 className="font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)] md:text-5xl">
        {title}
      </h2>
    </div>
    {body ? (
      <p className="max-w-2xl text-base leading-7 text-[var(--ink-muted)] md:text-lg">
        {body}
      </p>
    ) : null}
  </div>
);

const GitProfile = ({ config }: { config: Config }) => {
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
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const { copy } = useCopyToClipboard();

  const getGithubProjects = useCallback(
    async (publicRepoCount: number): Promise<GithubProject[]> => {
      if (!('projects' in sanitizedConfig)) {
        return [];
      }

      if (sanitizedConfig.projects.github.mode === 'automatic') {
        if (publicRepoCount === 0) {
          return [];
        }

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
            .map((project) => `+-repo:${project}`)
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

      if (sanitizedConfig.projects.github.manual.projects.length === 0) {
        return [];
      }

      const repos = sanitizedConfig.projects.github.manual.projects
        .map((project) => `+repo:${project.repo}`)
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
    if (!('github' in sanitizedConfig) || !('projects' in sanitizedConfig)) {
      return;
    }

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
    if ('hotjar' in sanitizedConfig) {
      setupHotjar(sanitizedConfig.hotjar);
    }

    void loadData();
  }, [sanitizedConfig, loadData]);

  const handleCopyEmail = useCallback(
    async (email: string) => {
      const didCopy = await copy(email);

      if (!didCopy) {
        return;
      }

      setCopiedEmail(email);
      window.setTimeout(() => {
        setCopiedEmail((current) => (current === email ? null : current));
      }, 1500);
    },
    [copy],
  );

  if (!('personal' in sanitizedConfig) || configError) {
    return (
      <HelmetProvider>
        <ErrorPage
          status={configError?.status || INVALID_CONFIG_ERROR.status}
          title={configError?.title || INVALID_CONFIG_ERROR.title}
          subTitle={configError?.subTitle || INVALID_CONFIG_ERROR.subTitle}
        />
      </HelmetProvider>
    );
  }

  const manualProjects = sanitizedConfig.projects.github.manual.projects;
  const manualProjectMap = new Map(
    manualProjects.map((project) => [project.repo.toLowerCase(), project]),
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
      .filter((project) => project.featured)
      .map((project) => ({
        ...project,
        type: 'github' as const,
        href:
          repositoryCards.find(
            (card) => card.repo.toLowerCase() === project.repo.toLowerCase(),
          )?.html_url || fallbackRepoLink(project.repo),
        liveProject: repositoryCards.find(
          (card) => card.repo.toLowerCase() === project.repo.toLowerCase(),
        ),
      })),
    ...sanitizedConfig.projects.external.projects
      .filter((project) => project.featured)
      .map((project) => ({
        ...project,
        type: 'external' as const,
        href: project.link || '#',
      })),
  ];

  const additionalWork = sanitizedConfig.projects.external.projects.filter(
    (project) => !project.featured,
  );

  const emailLinks = toEmailList(sanitizedConfig.social.email);
  const phoneLink = toPhoneLink(sanitizedConfig.social.phone);
  const linkedInLink = toAbsoluteLinkedIn(sanitizedConfig.social.linkedin);
  const websiteLink = sanitizedConfig.social.website || undefined;
  const githubProfileLink = `https://github.com/${sanitizedConfig.github.username}`;
  const visibleAvatar =
    showSecretAvatar && profileAvatar ? SECRET_AVATAR : profileAvatar;

  return (
    <HelmetProvider>
      <div className="site-shell min-h-screen">
        <HeadTagEditor googleAnalyticsId={sanitizedConfig.googleAnalytics.id} />

        <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[rgba(245,241,232,0.82)] backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-5 py-4 md:px-8">
            <a
              href="#top"
              className="font-accent text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink)]"
            >
              GKN / Portfolio
            </a>
            <nav
              className="hidden items-center gap-2 md:flex"
              aria-label="Section navigation"
            >
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="nav-pill rounded-full px-4 py-2 font-accent text-[11px] font-medium uppercase tracking-[0.18em]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-5 pb-16 pt-10 md:px-8 md:pt-16">
          <motion.section
            id="top"
            className="grid gap-8 md:gap-12 lg:grid-cols-[1.18fr_0.82fr]"
            {...sectionMotion(!!prefersReducedMotion)}
          >
            <div className="space-y-8">
              <div className="space-y-5">
                <p className="section-kicker">Kaushik Naik Guguloth</p>
                <h1 className="max-w-4xl font-display text-5xl font-semibold leading-[0.95] text-[var(--ink)] md:text-7xl">
                  {sanitizedConfig.personal.headline}
                </h1>
                {sanitizedConfig.personal.subheadline ? (
                  <p className="max-w-3xl text-lg leading-8 text-[var(--ink)] md:text-2xl md:leading-10">
                    {sanitizedConfig.personal.subheadline}
                  </p>
                ) : null}
                {sanitizedConfig.personal.intro ? (
                  <p className="max-w-2xl text-base leading-8 text-[var(--ink-muted)] md:text-lg">
                    {sanitizedConfig.personal.intro}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {sanitizedConfig.personal.primaryCta ? (
                  <a
                    href={sanitizedConfig.personal.primaryCta.href}
                    target="_blank"
                    rel="noreferrer"
                    className="cta-primary rounded-full bg-[var(--ink)] px-6 py-3 font-accent text-xs font-semibold uppercase tracking-[0.18em] text-[var(--paper-soft)] shadow-[0_16px_40px_rgba(29,33,31,0.18)]"
                  >
                    {sanitizedConfig.personal.primaryCta.label}
                  </a>
                ) : null}
                {sanitizedConfig.personal.secondaryCta ? (
                  <a
                    href={sanitizedConfig.personal.secondaryCta.href}
                    target="_blank"
                    rel="noreferrer"
                    className="cta-secondary rounded-full border border-[var(--line-strong)] bg-white/50 px-6 py-3 font-accent text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink)]"
                  >
                    {sanitizedConfig.personal.secondaryCta.label}
                  </a>
                ) : null}
              </div>
            </div>

            <div>
              <div className="surface-strong editorial-frame rounded-[2rem] p-6 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-kicker mb-3">Profile</p>
                    <p className="font-display text-2xl font-semibold text-[var(--ink)]">
                      {sanitizedConfig.personal.name}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--ink-muted)]">
                      {sanitizedConfig.personal.availability}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSecretAvatar((current) => !current)}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper-strong)]"
                    aria-label="Toggle profile easter egg"
                  >
                    {visibleAvatar ? (
                      <img
                        src={visibleAvatar}
                        alt={sanitizedConfig.personal.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-2xl font-semibold text-[var(--teal)]">
                        {sanitizedConfig.personal.name
                          .split(' ')
                          .map((piece) => piece[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                    )}
                  </button>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={githubProfileLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[var(--line)] bg-white/55 px-4 py-2 font-accent text-[11px] uppercase tracking-[0.15em] text-[var(--ink)]"
                  >
                    GitHub
                  </a>
                  {linkedInLink ? (
                    <a
                      href={linkedInLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[var(--line)] bg-white/55 px-4 py-2 font-accent text-[11px] uppercase tracking-[0.15em] text-[var(--ink)]"
                    >
                      LinkedIn
                    </a>
                  ) : null}
                  {websiteLink ? (
                    <a
                      href={websiteLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[var(--line)] bg-white/55 px-4 py-2 font-accent text-[11px] uppercase tracking-[0.15em] text-[var(--ink)]"
                    >
                      Website
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            className="space-y-8"
            {...sectionMotion(!!prefersReducedMotion, 0.03)}
          >
            <SectionHeader
              eyebrow="Capabilities"
              title="Tools I reach for"
              body="A quick overview of the languages, frameworks, and platforms I use most often."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {sanitizedConfig.capabilities.map((capability) => (
                <div
                  key={capability.title}
                  className="surface rounded-[1.7rem] p-5"
                >
                  <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
                    {capability.title}
                  </h2>
                  {capability.summary ? (
                    <p className="mt-3 text-sm leading-7 text-[var(--ink-muted)]">
                      {capability.summary}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {capability.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[var(--line)] bg-white/50 px-3 py-1.5 font-accent text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            id="featured-work"
            className="space-y-10"
            {...sectionMotion(!!prefersReducedMotion, 0.05)}
          >
            <SectionHeader
              eyebrow="Selected Projects"
              title="Selected projects"
              body="A few projects that show the kind of work I enjoy: clear interfaces, practical features, and implementation details that hold together."
            />

            <div className="grid gap-6">
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

                return (
                  <article
                    key={`${project.type}-${project.type === 'github' ? project.repo : project.title}`}
                    className="surface-strong project-card overflow-hidden rounded-[2rem]"
                  >
                    <div className="grid gap-0 lg:grid-cols-[0.88fr_1.12fr]">
                      <div
                        className={`media-panel flex min-h-0 items-center justify-center p-4 md:p-6 ${
                          index % 2 === 1 ? 'lg:order-2' : ''
                        }`}
                      >
                        {mediaSource ? (
                          isEmbed ? (
                            <div className="aspect-[16/10] w-full overflow-hidden rounded-[1.4rem] border border-black/10 bg-[#111315] shadow-[0_18px_40px_rgba(15,17,18,0.14)]">
                              <YouTubePlayer
                                url={mediaSource}
                                title={projectTitle}
                                playbackProfile={playbackProfile}
                                className="h-full w-full"
                              />
                            </div>
                          ) : isVideo ? (
                            <div className="aspect-[16/10] w-full overflow-hidden rounded-[1.4rem] border border-black/10 bg-[#111315] shadow-[0_18px_40px_rgba(15,17,18,0.14)]">
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
                            <div className="aspect-[16/10] w-full overflow-hidden rounded-[1.4rem] border border-black/10 bg-white shadow-[0_18px_40px_rgba(15,17,18,0.12)]">
                              <img
                                src={mediaSource}
                                alt={project.media?.alt || projectTitle}
                                className="h-full w-full object-contain"
                              />
                            </div>
                          )
                        ) : (
                          <div className="media-fallback flex h-full min-h-[280px] items-end p-8">
                            <div className="rounded-[1.4rem] border border-white/40 bg-white/50 px-4 py-3 font-accent text-[11px] uppercase tracking-[0.16em] text-[var(--ink)]">
                              {project.type === 'github'
                                ? project.repo
                                : project.title}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between gap-8 p-6 md:p-8">
                        <div>
                          <div className="mb-4 flex flex-wrap items-center gap-3">
                            <span className="eyebrow-badge rounded-full px-3 py-1.5 font-accent text-[11px] uppercase tracking-[0.16em]">
                              {project.eyebrow || 'Project'}
                            </span>
                            {hasLiveStats ? (
                              <span className="font-accent text-[11px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                                {liveStats.stargazers_count} stars /{' '}
                                {liveStats.forks_count} forks
                              </span>
                            ) : null}
                          </div>

                          <h3 className="font-display text-3xl font-semibold text-[var(--ink)]">
                            {projectTitle}
                          </h3>
                          <p className="mt-4 text-base leading-8 text-[var(--ink)]">
                            {projectBody}
                          </p>
                          {project.impact ? (
                            <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">
                              {project.impact}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-5">
                          {project.stack.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {project.stack.map((item) => (
                                <span
                                  key={item}
                                  className="rounded-full border border-[var(--line)] bg-white/60 px-3 py-1.5 font-accent text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          <a
                            href={project.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-fit items-center gap-3 rounded-full border border-[var(--line-strong)] bg-[var(--paper-soft)] px-5 py-3 font-accent text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink)]"
                          >
                            <span>{project.ctaLabel || 'View Project'}</span>
                            <span aria-hidden="true">↗</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            id="code-portfolio"
            className="space-y-10"
            {...sectionMotion(!!prefersReducedMotion, 0.08)}
          >
            <SectionHeader
              eyebrow="Repository View"
              title={sanitizedConfig.projects.github.header}
              body="A few repositories behind the work above, plus smaller projects that are easier to show in code than in a hero section."
            />

            {githubError ? (
              <div className="surface rounded-[1.6rem] px-5 py-4 text-sm leading-7 text-[var(--ink-muted)]">
                {githubError}
              </div>
            ) : null}

            {loadingRepos ? (
              <div className="surface rounded-[2rem] px-6 py-8 text-sm uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Loading live repository data...
              </div>
            ) : null}

            {!loadingRepos && repositoryCards.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {repositoryCards.map((project) => (
                  <article
                    key={project.repo}
                    className="repo-card rounded-[1.6rem] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="section-kicker mb-2">
                          {project.eyebrow || 'Repository'}
                        </p>
                        <h3 className="font-display text-xl font-semibold text-[var(--ink)]">
                          {project.label}
                        </h3>
                      </div>
                      {project.featured ? (
                        <span className="rounded-full bg-[var(--teal-soft)] px-3 py-1 font-accent text-[10px] uppercase tracking-[0.14em] text-[var(--teal)]">
                          Featured
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">
                      {project.summary ||
                        'Repository details available on GitHub.'}
                    </p>

                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
                      <div className="flex items-center gap-4 text-sm text-[var(--ink-muted)]">
                        <span>{project.stargazers_count} stars</span>
                        <span>{project.forks_count} forks</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: getLanguageColor(project.language),
                          }}
                        />
                        <span>{project.language}</span>
                      </div>
                    </div>

                    <a
                      href={project.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex items-center gap-2 font-accent text-[11px] uppercase tracking-[0.16em] text-[var(--ink)]"
                    >
                      {project.ctaLabel}
                      <span aria-hidden="true">↗</span>
                    </a>
                  </article>
                ))}
              </div>
            ) : null}

            {additionalWork.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {additionalWork.map((project) => (
                  <article
                    key={project.title}
                    className="surface rounded-[1.6rem] p-5"
                  >
                    <p className="section-kicker mb-2">
                      {project.eyebrow || 'Additional work'}
                    </p>
                    <h3 className="font-display text-2xl font-semibold text-[var(--ink)]">
                      {project.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">
                      {project.summary || project.description}
                    </p>
                    {project.stack.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.stack.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-[var(--line)] bg-white/50 px-3 py-1.5 font-accent text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {project.link ? (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex items-center gap-2 font-accent text-[11px] uppercase tracking-[0.16em] text-[var(--ink)]"
                      >
                        {project.ctaLabel || 'View More'}
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}
          </motion.section>

          <motion.section
            id="experience"
            className="space-y-10"
            {...sectionMotion(!!prefersReducedMotion, 0.1)}
          >
            <SectionHeader
              eyebrow="Professional Work"
              title="Professional work"
              body="The roles below reflect the work I like most: building features end to end, tightening rough product edges, and making technical systems easier to use."
            />

            <div className="surface-strong rounded-[2rem] p-6 md:p-8">
              <div className="space-y-10">
                {sanitizedConfig.experiences.map((experience) => (
                  <article
                    key={`${experience.company}-${experience.from}`}
                    className="border-b border-[var(--line)] pb-8 last:border-b-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="section-kicker mb-3">
                          {experience.from} to {experience.to}
                        </p>
                        <h3 className="font-display text-2xl font-semibold text-[var(--ink)]">
                          {experience.position}
                        </h3>
                        {experience.company ? (
                          experience.companyLink ? (
                            <a
                              href={experience.companyLink}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--teal)]"
                            >
                              {experience.company}
                              <span aria-hidden="true">↗</span>
                            </a>
                          ) : (
                            <p className="mt-2 text-sm text-[var(--teal)]">
                              {experience.company}
                            </p>
                          )
                        ) : null}
                      </div>
                    </div>

                    {experience.description ? (
                      <p className="mt-5 max-w-4xl text-base leading-8 text-[var(--ink-muted)]">
                        {experience.description}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            id="credentials"
            className="space-y-10"
            {...sectionMotion(!!prefersReducedMotion, 0.12)}
          >
            <SectionHeader
              eyebrow="Credentials + Contact"
              title="Education, certification, and direct ways to reach me."
            />

            <div className="surface-strong editorial-frame rounded-[2rem] p-6 md:p-8">
              <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr_1fr]">
                <div>
                  <p className="section-kicker mb-4">Education</p>
                  {sanitizedConfig.educations.map((education) => (
                    <div
                      key={`${education.institution}-${education.from}`}
                      className="space-y-2"
                    >
                      <h3 className="font-display text-2xl font-semibold text-[var(--ink)]">
                        {education.degree}
                      </h3>
                      <p className="text-sm text-[var(--ink-muted)]">
                        {education.from
                          ? `${education.from} to ${education.to}`
                          : education.to}
                      </p>
                      {education.link ? (
                        <a
                          href={education.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-[var(--teal)]"
                        >
                          {education.institution}
                          <span aria-hidden="true">↗</span>
                        </a>
                      ) : (
                        <p className="text-sm text-[var(--teal)]">
                          {education.institution}
                        </p>
                      )}
                    </div>
                  ))}

                  {sanitizedConfig.certifications.length > 0 ? (
                    <div className="mt-8 border-t border-[var(--line)] pt-6">
                      <p className="section-kicker mb-4">Certification</p>
                      {sanitizedConfig.certifications.map((certification) => (
                        <div key={certification.name} className="space-y-2">
                          <h4 className="font-display text-xl font-semibold text-[var(--ink)]">
                            {certification.name}
                          </h4>
                          <p className="text-sm text-[var(--ink-muted)]">
                            {certification.body}
                          </p>
                          {certification.link ? (
                            <a
                              href={certification.link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-[var(--teal)]"
                            >
                              Program details
                              <span aria-hidden="true">↗</span>
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div>
                  <p className="section-kicker mb-4">Reach Out</p>
                  <div className="space-y-3">
                    {phoneLink ? (
                      <a
                        href={phoneLink.href}
                        className="contact-row block py-3 text-sm text-[var(--ink-muted)]"
                      >
                        <span className="block font-accent text-[11px] uppercase tracking-[0.16em] text-[var(--ink)]">
                          Phone
                        </span>
                        <span className="mt-1 block">{phoneLink.label}</span>
                      </a>
                    ) : null}

                    {emailLinks.map((item, index) => (
                      <div
                        key={item.label}
                        className="contact-row py-3 text-sm text-[var(--ink-muted)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="block font-accent text-[11px] uppercase tracking-[0.16em] text-[var(--ink)]">
                            Email {emailLinks.length > 1 ? index + 1 : ''}
                          </span>
                          <span
                            className="font-accent text-[10px] uppercase tracking-[0.14em] text-[var(--teal)]"
                            aria-live="polite"
                          >
                            {copiedEmail === item.label
                              ? 'Email copied'
                              : 'Click to copy'}
                          </span>
                        </div>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => void handleCopyEmail(item.label)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              void handleCopyEmail(item.label);
                            }
                          }}
                          className="selectable-copy mt-1 block break-all text-[var(--ink-muted)]"
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}

                    {linkedInLink ? (
                      <a
                        href={linkedInLink}
                        target="_blank"
                        rel="noreferrer"
                        className="contact-row block py-3 text-sm text-[var(--ink-muted)]"
                      >
                        <span className="block font-accent text-[11px] uppercase tracking-[0.16em] text-[var(--ink)]">
                          LinkedIn
                        </span>
                        <span className="mt-1 block">
                          /in/{sanitizedConfig.social.linkedin}
                        </span>
                      </a>
                    ) : null}

                    <a
                      href={githubProfileLink}
                      target="_blank"
                      rel="noreferrer"
                      className="contact-row block py-3 text-sm text-[var(--ink-muted)]"
                    >
                      <span className="block font-accent text-[11px] uppercase tracking-[0.16em] text-[var(--ink)]">
                        GitHub
                      </span>
                      <span className="mt-1 block">
                        /{sanitizedConfig.github.username}
                      </span>
                    </a>

                    {websiteLink ? (
                      <a
                        href={websiteLink}
                        target="_blank"
                        rel="noreferrer"
                        className="block py-3 text-sm text-[var(--ink-muted)]"
                      >
                        <span className="block font-accent text-[11px] uppercase tracking-[0.16em] text-[var(--ink)]">
                          Website
                        </span>
                        <span className="mt-1 block break-all">
                          {websiteLink}
                        </span>
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-6 rounded-[1.8rem] border border-[var(--line)] bg-white/45 p-6">
                  <div>
                    <p className="section-kicker mb-4">Current Focus</p>
                    <p className="font-display text-2xl font-semibold text-[var(--ink)]">
                      Building useful software across web, mobile, and desktop.
                    </p>
                    <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">
                      I like products that feel calm and well put together, even
                      when the work behind them is fairly technical.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {sanitizedConfig.resume.fileUrl ? (
                      <a
                        href={sanitizedConfig.resume.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="cta-primary inline-flex w-full items-center justify-center rounded-full bg-[var(--ink)] px-5 py-3 font-accent text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-soft)]"
                      >
                        Download Resume
                      </a>
                    ) : null}
                    <a
                      href={githubProfileLink}
                      target="_blank"
                      rel="noreferrer"
                      className="cta-secondary inline-flex w-full items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--paper-soft)] px-5 py-3 font-accent text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink)]"
                    >
                      View GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </main>

        <footer className="mx-auto w-full max-w-7xl px-5 pb-10 md:px-8">
          <div className="flex flex-col gap-4 border-t border-[var(--line)] pt-6 md:flex-row md:items-center md:justify-between">
            <p className="font-accent text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              {sanitizedConfig.footer}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--ink-muted)]">
              <a href="#top">Back to top</a>
              <a href="#featured-work">Featured work</a>
              <a href="#credentials">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </HelmetProvider>
  );
};

export default GitProfile;
