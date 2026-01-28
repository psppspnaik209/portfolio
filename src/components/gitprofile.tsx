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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
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

          return repoData.map((project: any) => ({
            name: project.repo,
            html_url: project.link,
            description: project.description,
            stargazers_count: project.stars,
            forks_count: project.forks,
            language: project.language,
          }));
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
              transition={{ duration: 1 }}
            >
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 rounded-none"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <motion.div className="col-span-1" variants={itemVariants}>
                  <Suspense fallback={<div></div>}>
                    <div className="grid grid-cols-1 gap-6">
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
                      {sanitizedConfig.skills.length !== 0 && (
                        <motion.div
                          className="card-hover"
                          variants={itemVariants}
                        >
                          <SkillCard
                            loading={loading}
                            skills={sanitizedConfig.skills}
                          />
                        </motion.div>
                      )}
                      {sanitizedConfig.experiences.length !== 0 && (
                        <motion.div
                          className="card-hover"
                          variants={itemVariants}
                        >
                          <ExperienceCard
                            loading={loading}
                            experiences={sanitizedConfig.experiences}
                          />
                        </motion.div>
                      )}
                      {sanitizedConfig.certifications.length !== 0 && (
                        <motion.div
                          className="card-hover"
                          variants={itemVariants}
                        >
                          <CertificationCard
                            loading={loading}
                            certifications={sanitizedConfig.certifications}
                          />
                        </motion.div>
                      )}
                      {sanitizedConfig.educations.length !== 0 && (
                        <motion.div
                          className="card-hover"
                          variants={itemVariants}
                        >
                          <EducationCard
                            loading={loading}
                            educations={sanitizedConfig.educations}
                          />
                        </motion.div>
                      )}
                    </div>
                  </Suspense>
                </motion.div>
                <motion.div
                  className="lg:col-span-2 col-span-1"
                  variants={itemVariants}
                >
                  <Suspense fallback={<div></div>}>
                    <div className="grid grid-cols-1 gap-6">
                      {sanitizedConfig.projects.github.display && (
                        <motion.div
                          className="card-hover"
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
                      {sanitizedConfig.publications.length !== 0 && (
                        <motion.div variants={itemVariants}>
                          <PublicationCard
                            loading={loading}
                            publications={sanitizedConfig.publications}
                          />
                        </motion.div>
                      )}
                      {sanitizedConfig.projects.external.projects.length !==
                        0 && (
                        <motion.div
                          className="card-hover"
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
                      {sanitizedConfig.blog.display && (
                        <motion.div variants={itemVariants}>
                          <BlogCard
                            loading={loading}
                            googleAnalyticsId={
                              sanitizedConfig.googleAnalytics.id
                            }
                            blog={sanitizedConfig.blog}
                          />
                        </motion.div>
                      )}
                    </div>
                  </Suspense>
                </motion.div>
              </motion.div>
            </motion.div>
          </>
        )}
      </div>
    </HelmetProvider>
  );
};

export default GitProfile;
