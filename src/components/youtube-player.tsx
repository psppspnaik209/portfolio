import { useEffect, useRef } from 'react';

type PlaybackProfile = 'senscribe' | 'muted';

type YouTubePlayerInstance = {
  destroy: () => void;
  getAvailableQualityLevels?: () => string[];
  mute: () => void;
  setPlaybackQuality: (quality: string) => void;
  setVolume: (volume: number) => void;
  unMute: () => void;
};

type YouTubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, number>;
      events?: {
        onReady?: (event: { target: YouTubePlayerInstance }) => void;
        onStateChange?: (event: {
          data: number;
          target: YouTubePlayerInstance;
        }) => void;
      };
    },
  ) => YouTubePlayerInstance;
  PlayerState: {
    PLAYING: number;
  };
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youTubeApiPromise: Promise<YouTubeNamespace> | null = null;

const extractVideoId = (url: string) => {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '');
    }

    if (parsed.searchParams.get('v')) {
      return parsed.searchParams.get('v');
    }

    const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
    return embedMatch?.[1] || null;
  } catch {
    return null;
  }
};

const loadYouTubeApi = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is unavailable.'));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youTubeApiPromise) {
    return youTubeApiPromise;
  }

  youTubeApiPromise = new Promise<YouTubeNamespace>((resolve) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );

    const handleReady = () => {
      if (window.YT?.Player) {
        resolve(window.YT);
      }
    };

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      handleReady();
    };

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    } else if (window.YT?.Player) {
      handleReady();
    }
  });

  return youTubeApiPromise;
};

const requestBestQuality = (player: YouTubePlayerInstance) => {
  const availableLevels = player.getAvailableQualityLevels?.() || [];
  const preferredLevels = ['highres', 'hd1080', 'hd720', 'large'];
  const bestQuality =
    preferredLevels.find((quality) => availableLevels.includes(quality)) ||
    availableLevels[0] ||
    'hd720';

  player.setPlaybackQuality(bestQuality);
};

const applyPlaybackProfile = (
  player: YouTubePlayerInstance,
  profile: PlaybackProfile,
) => {
  if (profile === 'senscribe') {
    player.unMute();
    player.setVolume(20);
    return;
  }

  player.mute();
};

const YouTubePlayer = ({
  className,
  title,
  url,
  playbackProfile,
}: {
  className?: string;
  title: string;
  url: string;
  playbackProfile: PlaybackProfile;
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);

  useEffect(() => {
    const videoId = extractVideoId(url);
    const mountNode = mountRef.current;

    if (!videoId || !mountNode) {
      return;
    }

    let cancelled = false;

    void loadYouTubeApi().then((YT) => {
      if (cancelled || !mountRef.current) {
        return;
      }

      playerRef.current?.destroy();
      mountRef.current.innerHTML = '';

      playerRef.current = new YT.Player(mountRef.current, {
        videoId,
        playerVars: {
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: ({ target }) => {
            requestBestQuality(target);
            applyPlaybackProfile(target, playbackProfile);
          },
          onStateChange: ({ data, target }) => {
            if (data === YT.PlayerState.PLAYING) {
              requestBestQuality(target);
              applyPlaybackProfile(target, playbackProfile);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [playbackProfile, url]);

  return (
    <div
      ref={mountRef}
      className={className}
      aria-label={title}
      title={title}
    />
  );
};

export default YouTubePlayer;
