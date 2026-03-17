import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios, { AxiosError } from 'axios';
import { formatDistance } from 'date-fns';
import {
  CustomError,
  GENERIC_ERROR,
  INVALID_CONFIG_ERROR,
  INVALID_GITHUB_USERNAME_ERROR,
  setTooManyRequestError,
} from '../constants/errors';
import { HelmetProvider } from 'react-helmet-async';
import '../assets/index.css';
import { getInitialTheme, getSanitizedConfig, setupHotjar } from '../utils';
import { SanitizedConfig } from '../interfaces/sanitized-config';
import { Profile } from '../interfaces/profile';
import { GithubProject } from '../interfaces/github-project';
import ErrorPage from './error-page';
import HeadTagEditor from './head-tag-editor';
import { DEFAULT_THEMES } from '../constants/default-themes';
import { Particles } from './ui/particles';
import { DotPattern } from './ui/dot-pattern';
import { AnimatedShinyText } from './ui/animated-shiny-text';

const AvatarCard = lazy(() => import('./avatar-card'));
const DetailsCard = lazy(() => import('./details-card'));
const SkillCard = lazy(() => import('./skill-card'));
const ExperienceCard = lazy(() => import('./experience-card'));
const EducationCard = lazy(() => import('./education-card'));
const CertificationCard = lazy(() => import('./certification-card'));
const GithubProjectCard = lazy(() => import('./github-project-card'));
const ExternalProjectCard = lazy(() => import('./external-project-card'));
const BlogCard = lazy(() => import('./blog-card'));
const PublicationCard = lazy(() => import('./publication-card'));

import CustomCursor from './custom-cursor';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1 },
};

// Premium section heading component
const SectionHeading = ({
  number,
  title,
}: {
  number: string;
  title: string;
}) => (
  <h2 className="text-2xl font-cyber font-bold mb-6 text-white flex items-center gap-4">
    <span className="inline-flex items-center justify-center text-xs font-mono text-[#38bdf8] border border-[#38bdf8]/30 rounded-md px-2 py-0.5 bg-[#38bdf8]/5">
      {number}
    </span>
    <AnimatedShinyText className="!text-white text-2xl font-cyber font-bold">
      {title}
    </AnimatedShinyText>
    <div className="h-px bg-gradient-to-r from-[#38bdf8]/40 via-white/10 to-transparent flex-grow ml-2" />
  </h2>
);

/**
 * Renders the GitProfile component.
 */
const GitProfile = ({ config }: { config: Config }) => {
  const [sanitizedConfig] = useState<SanitizedConfig | Record<string, never>>(
    getSanitizedConfig(config),
  );
  const [theme, setTheme] = useState<string>(DEFAULT_THEMES[0]);
  const [error, setError] = useState<CustomError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [githubProjects, setGithubProjects] = useState<GithubProject[]>([]);
  const [activeSection, setActiveSection] = useState<string>('projects');

  const getGithubProjects = useCallback(
    async (publicRepoCount: number): Promise<GithubProject[]> => {
      if (sanitizedConfig.projects.github.mode === 'automatic') {
        if (publicRepoCount === 0) {
          return [];
        }

        if (sanitizedConfig.projects.github.automatic.source === 'pinned') {
          const url = `https://gh-pinned-repos.egoist.dev/?username=${sanitizedConfig.github.username}`;
          const repoResponse = await axios.get(url);
          const repoData = repoResponse.data;

          return repoData.map(
            (project: {
              repo: string;
              link: string;
              description: string;
              stars: number;
              forks: number;
              language: string;
            }) => ({
              name: project.repo,
              html_url: project.link,
              description: project.description,
              stargazers_count: project.stars,
              forks_count: project.forks,
              language: project.language,
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
        const repoData = repoResponse.data;
        return repoData.items;
      } else {
        if (sanitizedConfig.projects.github.manual.projects.length === 0) {
          return [];
        }
        const repos = sanitizedConfig.projects.github.manual.projects
          .map((project) => `+repo:${project}`)
          .join('');

        const url = `https://api.github.com/search/repositories?q=${repos}+fork:true&type=Repositories`;

        const repoResponse = await axios.get(url, {
          headers: { 'Content-Type': 'application/vnd.github.v3+json' },
        });
        const repoData = repoResponse.data;

        return repoData.items;
      }
    },
    [
      sanitizedConfig.github.username,
      sanitizedConfig.projects.github.mode,
      sanitizedConfig.projects.github.manual.projects,
      sanitizedConfig.projects.github.automatic.sortBy,
      sanitizedConfig.projects.github.automatic.limit,
      sanitizedConfig.projects.github.automatic.exclude.forks,
      sanitizedConfig.projects.github.automatic.exclude.projects,
      sanitizedConfig.projects.github.automatic.source,
    ],
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `https://api.github.com/users/${sanitizedConfig.github.username}`,
      );
      const data = response.data;

      setProfile({
        avatar: data.avatar_url,
        name: data.name || ' ',
        bio: data.bio || '',
        location: data.location || '',
        company: data.company || '',
      });

      if (!sanitizedConfig.projects.github.display) {
        return;
      }

      setGithubProjects(await getGithubProjects(data.public_repos));
    } catch (error) {
      handleError(error as AxiosError | Error);
    } finally {
      setLoading(false);
    }
  }, [
    sanitizedConfig.github.username,
    sanitizedConfig.projects.github.display,
    getGithubProjects,
  ]);

  useEffect(() => {
    if (Object.keys(sanitizedConfig).length === 0) {
      setError(INVALID_CONFIG_ERROR);
    } else {
      setError(null);
      setTheme(getInitialTheme(sanitizedConfig.themeConfig));
      setupHotjar(sanitizedConfig.hotjar);
      loadData();
    }
  }, [sanitizedConfig, loadData]);

  useEffect(() => {
    theme && document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Intersection observer for active section tracking
  useEffect(() => {
    const sections = document.querySelectorAll('[data-section]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.getAttribute('data-section') || '');
          }
        });
      },
      { rootMargin: '-20% 0px -20% 0px', threshold: 0.1 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [loading]);

  const handleError = (error: AxiosError | Error): void => {
    console.error('Error:', error);

    if (error instanceof AxiosError) {
      try {
        const reset = formatDistance(
          new Date(error.response?.headers?.['x-ratelimit-reset'] * 1000),
          new Date(),
          { addSuffix: true },
        );

        if (typeof error.response?.status === 'number') {
          switch (error.response.status) {
            case 403:
              setError(setTooManyRequestError(reset));
              break;
            case 404:
              setError(INVALID_GITHUB_USERNAME_ERROR);
              break;
            default:
              setError(GENERIC_ERROR);
              break;
          }
        } else {
          setError(GENERIC_ERROR);
        }
      } catch (innerError) {
        setError(GENERIC_ERROR);
      }
    } else {
      setError(GENERIC_ERROR);
    }
  };

  const navItems = [
    { id: 'projects', label: 'Projects', num: '01' },
    { id: 'experience', label: 'Experience', num: '02' },
    { id: 'education', label: 'Education', num: '03' },
    { id: 'skills', label: 'Skills', num: '04' },
  ];

  return (
    <HelmetProvider>
      <div className="fade-in min-h-screen relative overflow-visible">
        <CustomCursor />

        {/* Dot pattern texture — behind everything */}
        <DotPattern
          className="absolute inset-0 z-0 h-full w-full opacity-30 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]"
          width={20}
          height={20}
          cr={0.8}
        />

        {/* Particles canvas on top of dot pattern */}
        <Particles
          className="absolute inset-0 z-[1] h-[100%] max-h-screen min-h-screen w-full pointer-events-none"
          quantity={100}
          staticity={40}
          ease={50}
          color="#64748b"
          refresh
        />

        {error ? (
          <ErrorPage
            status={error.status}
            title={error.title}
            subTitle={error.subTitle}
          />
        ) : (
          <>
            <HeadTagEditor
              googleAnalyticsId={sanitizedConfig.googleAnalytics.id}
            />
            <motion.div
              className={`p-6 lg:p-12 bg-transparent relative z-10 font-cyber pointer-events-auto`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0 }}
            >
              <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start w-full max-w-7xl mx-auto">
                {/* Left Pane - Sticky Sidebar */}
                <motion.div
                  className="w-full lg:w-[40%] flex flex-col gap-6 lg:sticky lg:top-12"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  <motion.div variants={itemVariants}>
                    <AvatarCard
                      profile={profile}
                      loading={loading}
                      avatarRing={sanitizedConfig.themeConfig.displayAvatarRing}
                      resumeFileUrl={sanitizedConfig.resume.fileUrl}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <DetailsCard
                      profile={profile}
                      loading={loading}
                      github={sanitizedConfig.github}
                      social={sanitizedConfig.social}
                    />
                  </motion.div>

                  {/* Navigation Index (Desktop Only) — with active indicators */}
                  <motion.nav
                    variants={itemVariants}
                    className="hidden lg:flex flex-col gap-1 mt-4 pl-4 border-l border-white/10"
                  >
                    <span className="text-[10px] font-mono tracking-[0.2em] text-[#38bdf8]/60 mb-3 font-semibold uppercase">
                      Navigate
                    </span>
                    {navItems.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`group/nav flex items-center gap-3 text-sm py-1.5 transition-all duration-150 ${
                          activeSection === item.id
                            ? 'text-white'
                            : 'text-base-content/40 hover:text-base-content/80'
                        }`}
                      >
                        <span
                          className={`h-px transition-all duration-150 ${
                            activeSection === item.id
                              ? 'w-8 bg-white'
                              : 'w-4 bg-white/20 group-hover/nav:w-6 group-hover/nav:bg-white/40'
                          }`}
                        />
                        <span className="text-[10px] font-mono text-[#38bdf8]/50">
                          {item.num}.
                        </span>
                        <span className="font-medium">{item.label}</span>
                      </a>
                    ))}
                  </motion.nav>
                </motion.div>

                {/* Right Pane - Scrollable Main Content */}
                <motion.div
                  className="w-full lg:w-[60%] flex flex-col gap-10 pb-24"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  <Suspense
                    fallback={
                      <div className="h-32 mb-6 skeleton rounded-xl"></div>
                    }
                  >
                    {/* Projects Section */}
                    <div
                      id="projects"
                      data-section="projects"
                      className="scroll-mt-24"
                    >
                      <SectionHeading number="01" title="Projects" />
                      <div className="space-y-6">
                        {sanitizedConfig.projects.github.display && (
                          <motion.div
                            className="card-hover w-full"
                            variants={itemVariants}
                          >
                            <GithubProjectCard
                              header={sanitizedConfig.projects.github.header}
                              limit={
                                sanitizedConfig.projects.github.automatic.limit
                              }
                              githubProjects={githubProjects}
                              loading={loading}
                              username={sanitizedConfig.github.username}
                            />
                          </motion.div>
                        )}
                        {sanitizedConfig.projects.external.projects.length !==
                          0 && (
                          <motion.div
                            className="card-hover w-full"
                            variants={itemVariants}
                          >
                            <ExternalProjectCard
                              loading={loading}
                              header={sanitizedConfig.projects.external.header}
                              externalProjects={
                                sanitizedConfig.projects.external.projects
                              }
                            />
                          </motion.div>
                        )}
                        {sanitizedConfig.publications.length !== 0 && (
                          <motion.div variants={itemVariants}>
                            <PublicationCard
                              loading={loading}
                              publications={sanitizedConfig.publications}
                            />
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Experience Section */}
                    {sanitizedConfig.experiences.length !== 0 && (
                      <div
                        id="experience"
                        data-section="experience"
                        className="scroll-mt-24"
                      >
                        <SectionHeading number="02" title="Experience" />
                        <motion.div variants={itemVariants}>
                          <ExperienceCard
                            loading={loading}
                            experiences={sanitizedConfig.experiences}
                          />
                        </motion.div>
                      </div>
                    )}

                    {/* Education & Certs */}
                    {(sanitizedConfig.educations.length !== 0 ||
                      sanitizedConfig.certifications.length !== 0) && (
                      <div
                        id="education"
                        data-section="education"
                        className="scroll-mt-24"
                      >
                        <SectionHeading number="03" title="Education" />
                        <div className="space-y-6">
                          {sanitizedConfig.educations.length !== 0 && (
                            <motion.div variants={itemVariants}>
                              <EducationCard
                                loading={loading}
                                educations={sanitizedConfig.educations}
                              />
                            </motion.div>
                          )}
                          {sanitizedConfig.certifications.length !== 0 && (
                            <motion.div variants={itemVariants}>
                              <CertificationCard
                                loading={loading}
                                certifications={sanitizedConfig.certifications}
                              />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Skills Section */}
                    {sanitizedConfig.skills.length !== 0 && (
                      <div
                        id="skills"
                        data-section="skills"
                        className="scroll-mt-24"
                      >
                        <SectionHeading number="04" title="Skills" />
                        <motion.div
                          className="card-hover pointer-events-auto"
                          variants={itemVariants}
                        >
                          <SkillCard
                            loading={loading}
                            skills={sanitizedConfig.skills}
                          />
                        </motion.div>
                      </div>
                    )}

                    {/* Blog Section */}
                    {sanitizedConfig.blog.display && (
                      <div
                        id="blog"
                        data-section="blog"
                        className="scroll-mt-24"
                      >
                        <SectionHeading number="05" title="Writing" />
                        <motion.div variants={itemVariants}>
                          <BlogCard
                            loading={loading}
                            googleAnalyticsId={
                              sanitizedConfig.googleAnalytics.id
                            }
                            blog={sanitizedConfig.blog}
                          />
                        </motion.div>
                      </div>
                    )}
                  </Suspense>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </HelmetProvider>
  );
};

export default GitProfile;
