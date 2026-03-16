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
import AsciiBackground from './ascii-background';
import '../assets/index.css';
import { getInitialTheme, getSanitizedConfig, setupHotjar } from '../utils';
import { SanitizedConfig } from '../interfaces/sanitized-config';
import { Profile } from '../interfaces/profile';
import { GithubProject } from '../interfaces/github-project';
import ErrorPage from './error-page';
import HeadTagEditor from './head-tag-editor';
import { DEFAULT_THEMES } from '../constants/default-themes';

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

/**
 * Renders the GitProfile component.
 *
 * @param {Object} config - the configuration object
 * @return {JSX.Element} the rendered GitProfile component
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

  return (
    <HelmetProvider>
      <div className="fade-in min-h-screen relative overflow-visible">
        <CustomCursor />
        <AsciiBackground />
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
              className={`p-6 lg:p-12 bg-transparent relative z-10 glitch font-cyber pointer-events-auto`}
              data-text="Portfolio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0 }}
            >
              <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 w-full max-w-7xl mx-auto">
                
                {/* Left Pane - Sticky Sidebar */}
                <motion.div 
                  className="w-full lg:w-[40%] flex flex-col gap-6 lg:sticky lg:top-12 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto pb-8 no-scrollbar"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  <motion.div variants={itemVariants}>
                    <AvatarCard
                      profile={profile}
                      loading={loading}
                      avatarRing={
                        sanitizedConfig.themeConfig.displayAvatarRing
                      }
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

                  {/* Navigation Index (Desktop Only) */}
                  <motion.nav variants={itemVariants} className="hidden lg:flex flex-col gap-2 mt-4 pl-4 border-l-2 border-white/10">
                    <span className="text-xs font-cyber tracking-widest text-[#00ffff] mb-2 font-bold uppercase">Index</span>
                    <a href="#projects" className="text-sm text-base-content/60 hover:text-white hover:translate-x-2 transition-all cursor-pointer">01. Projects</a>
                    <a href="#experience" className="text-sm text-base-content/60 hover:text-white hover:translate-x-2 transition-all cursor-pointer">02. Experience</a>
                    <a href="#education" className="text-sm text-base-content/60 hover:text-white hover:translate-x-2 transition-all cursor-pointer">03. Education</a>
                    <a href="#skills" className="text-sm text-base-content/60 hover:text-white hover:translate-x-2 transition-all cursor-pointer">04. Skills</a>
                  </motion.nav>
                </motion.div>

                {/* Right Pane - Scrollable Main Content */}
                <motion.div
                  className="w-full lg:w-[60%] flex flex-col gap-10 pb-24"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  <Suspense fallback={<div className="h-32 mb-6 skeleton rounded-xl"></div>}>
                    
                    {/* Projects Section */}
                    <div id="projects" className="scroll-mt-24">
                      <h2 className="text-2xl font-cyber font-bold mb-6 text-white flex items-center gap-4">
                        <span className="text-[#00ffff] text-sm">01.</span> Projects
                        <div className="h-px bg-gradient-to-r from-white/20 to-transparent flex-grow ml-2"></div>
                      </h2>
                      <div className="space-y-6">
                        {sanitizedConfig.projects.github.display && (
                          <motion.div className="card-hover w-full" variants={itemVariants}>
                            <GithubProjectCard
                              header={sanitizedConfig.projects.github.header}
                              limit={sanitizedConfig.projects.github.automatic.limit}
                              githubProjects={githubProjects}
                              loading={loading}
                              username={sanitizedConfig.github.username}
                            />
                          </motion.div>
                        )}
                        {sanitizedConfig.projects.external.projects.length !== 0 && (
                          <motion.div className="card-hover w-full" variants={itemVariants}>
                            <ExternalProjectCard
                              loading={loading}
                              header={sanitizedConfig.projects.external.header}
                              externalProjects={sanitizedConfig.projects.external.projects}
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
                      <div id="experience" className="scroll-mt-24">
                        <h2 className="text-2xl font-cyber font-bold mb-6 text-white flex items-center gap-4">
                          <span className="text-[#00ffff] text-sm">02.</span> Experience
                          <div className="h-px bg-gradient-to-r from-white/20 to-transparent flex-grow ml-2"></div>
                        </h2>
                        <motion.div variants={itemVariants}>
                          <ExperienceCard
                            loading={loading}
                            experiences={sanitizedConfig.experiences}
                          />
                        </motion.div>
                      </div>
                    )}

                    {/* Education & Certs */}
                    {(sanitizedConfig.educations.length !== 0 || sanitizedConfig.certifications.length !== 0) && (
                      <div id="education" className="scroll-mt-24">
                        <h2 className="text-2xl font-cyber font-bold mb-6 text-white flex items-center gap-4">
                          <span className="text-[#00ffff] text-sm">03.</span> Education
                          <div className="h-px bg-gradient-to-r from-white/20 to-transparent flex-grow ml-2"></div>
                        </h2>
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
                      <div id="skills" className="scroll-mt-24">
                        <h2 className="text-2xl font-cyber font-bold mb-6 text-white flex items-center gap-4">
                          <span className="text-[#00ffff] text-sm">04.</span> Skills
                          <div className="h-px bg-gradient-to-r from-white/20 to-transparent flex-grow ml-2"></div>
                        </h2>
                        <motion.div className="card-hover pointer-events-auto" variants={itemVariants}>
                          <SkillCard
                            loading={loading}
                            skills={sanitizedConfig.skills}
                          />
                        </motion.div>
                      </div>
                    )}

                    {/* Blog Section */}
                    {sanitizedConfig.blog.display && (
                      <div id="blog" className="scroll-mt-24">
                        <h2 className="text-2xl font-cyber font-bold mb-6 text-white flex items-center gap-4">
                          <span className="text-[#00ffff] text-sm">05.</span> Writing
                          <div className="h-px bg-gradient-to-r from-white/20 to-transparent flex-grow ml-2"></div>
                        </h2>
                        <motion.div variants={itemVariants}>
                          <BlogCard
                            loading={loading}
                            googleAnalyticsId={sanitizedConfig.googleAnalytics.id}
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
