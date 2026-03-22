import { useCallback, useState } from 'react';
import { hotjar } from 'react-hotjar';
import colors from '../data/colors.json';
import {
  SanitizedCapability,
  SanitizedConfig,
  SanitizedExternalProject,
  SanitizedGitHubManualProject,
  SanitizedHotjar,
  SanitizedPersonal,
  SanitizedProjectMedia,
} from '../interfaces/sanitized-config';

type Colors = {
  [key: string]: { color: string | null; url: string };
};

type ExternalProjectConfig = NonNullable<ExternalProjects['projects']>[number];

const sanitizeProjectMedia = (
  media?: ProjectMedia,
): SanitizedProjectMedia | undefined => {
  if (!media?.type) {
    return undefined;
  }

  return {
    type: media.type,
    asset: media.asset,
    src: media.src,
    alt: media.alt,
    poster: media.poster,
  };
};

const sanitizeManualGitHubProject = (
  project: string | ManualGitHubProject,
): SanitizedGitHubManualProject => {
  if (typeof project === 'string') {
    return {
      repo: project,
      featured: false,
      stack: [],
    };
  }

  return {
    repo: project.repo,
    label: project.label,
    featured: project.featured ?? false,
    eyebrow: project.eyebrow,
    summary: project.summary,
    impact: project.impact,
    stack: project.stack || [],
    ctaLabel: project.ctaLabel,
    media: sanitizeProjectMedia(project.media),
  };
};

const sanitizeExternalProject = (
  project: ExternalProjectConfig,
): SanitizedExternalProject => ({
  title: project.title,
  description: project.description,
  imageUrl: project.imageUrl,
  link: project.link,
  featured: project.featured ?? false,
  eyebrow: project.eyebrow,
  summary: project.summary,
  impact: project.impact,
  stack: project.stack || [],
  media: sanitizeProjectMedia(project.media),
  ctaLabel: project.ctaLabel,
});

const sanitizePersonal = (config: Config): SanitizedPersonal => ({
  name: config?.personal?.name || 'Portfolio Owner',
  headline: config?.personal?.headline || 'Software engineer',
  subheadline: config?.personal?.subheadline,
  intro: config?.personal?.intro,
  location: config?.personal?.location,
  availability: config?.personal?.availability,
  primaryCta: config?.personal?.primaryCta,
  secondaryCta: config?.personal?.secondaryCta,
});

const sanitizeCapabilities = (config: Config): SanitizedCapability[] =>
  (config?.capabilities || []).filter(
    (group) => group.title && group.items && group.items.length > 0,
  );

export const getSanitizedConfig = (
  config: Config,
): SanitizedConfig | Record<string, never> => {
  try {
    return {
      github: {
        username: config.github.username,
      },
      projects: {
        github: {
          display: config?.projects?.github?.display ?? true,
          header: config?.projects?.github?.header || 'Code Portfolio',
          mode: config?.projects?.github?.mode || 'automatic',
          automatic: {
            sortBy: config?.projects?.github?.automatic?.sortBy || 'stars',
            limit: config?.projects?.github?.automatic?.limit || 8,
            exclude: {
              forks:
                config?.projects?.github?.automatic?.exclude?.forks || false,
              projects:
                config?.projects?.github?.automatic?.exclude?.projects || [],
            },
            source:
              (config?.projects?.github?.automatic?.source as
                | 'api'
                | 'pinned') || 'api',
          },
          manual: {
            projects:
              config?.projects?.github?.manual?.projects?.map(
                sanitizeManualGitHubProject,
              ) || [],
          },
        },
        external: {
          header: config?.projects?.external?.header || 'Additional Work',
          projects:
            config?.projects?.external?.projects
              ?.filter((project) => project.title)
              .map(sanitizeExternalProject) || [],
        },
      },
      seo: {
        title: config?.seo?.title,
        description: config?.seo?.description,
        imageURL: config?.seo?.imageURL,
      },
      social: {
        linkedin: config?.social?.linkedin,
        x: config?.social?.x,
        mastodon: config?.social?.mastodon,
        facebook: config?.social?.facebook,
        instagram: config?.social?.instagram,
        reddit: config?.social?.reddit,
        threads: config?.social?.threads,
        youtube: config?.social?.youtube,
        udemy: config?.social?.udemy,
        dribbble: config?.social?.dribbble,
        behance: config?.social?.behance,
        medium: config?.social?.medium,
        dev: config?.social?.dev,
        stackoverflow: config?.social?.stackoverflow,
        website: config?.social?.website,
        phone: config?.social?.phone,
        email: config?.social?.email,
        skype: config?.social?.skype,
        telegram: config?.social?.telegram,
        researchGate: config?.social?.researchGate,
      },
      personal: sanitizePersonal(config),
      capabilities: sanitizeCapabilities(config),
      resume: {
        fileUrl: config?.resume?.fileUrl || '',
      },
      experiences:
        config?.experiences?.filter(
          (experience) =>
            experience.company ||
            experience.position ||
            experience.from ||
            experience.to,
        ) || [],
      certifications:
        config?.certifications?.filter(
          (certification) =>
            certification.year || certification.name || certification.body,
        ) || [],
      educations:
        config?.educations?.filter(
          (item) => item.institution || item.degree || item.from || item.to,
        ) || [],
      googleAnalytics: {
        id: config?.googleAnalytics?.id,
      },
      hotjar: {
        id: config?.hotjar?.id,
        snippetVersion: config?.hotjar?.snippetVersion || 6,
      },
      footer: config?.footer,
      enablePWA: config?.enablePWA ?? true,
    };
  } catch {
    return {};
  }
};

export const setupHotjar = (hotjarConfig: SanitizedHotjar): void => {
  if (hotjarConfig?.id) {
    const snippetVersion = hotjarConfig?.snippetVersion || 6;
    hotjar.initialize({ id: parseInt(hotjarConfig.id), sv: snippetVersion });
  }
};

export const getLanguageColor = (language: string): string => {
  const languageColors: Colors = colors;
  if (typeof languageColors[language] !== 'undefined') {
    return languageColors[language].color || 'gray';
  } else {
    return 'gray';
  }
};

export const useCopyToClipboard = () => {
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
      return true;
    } catch (error) {
      console.error('Failed to copy: ', error);
      setIsCopied(false);
      return false;
    }
  }, []);

  return { isCopied, copy };
};
