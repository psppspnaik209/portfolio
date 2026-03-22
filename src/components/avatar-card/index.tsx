import { motion } from 'framer-motion';
import { type ReactElement, useState } from 'react';
import { FALLBACK_IMAGE } from '../../constants';
import { Profile } from '../../interfaces/profile';
import { skeleton } from '../../utils';
import LazyImage from '../lazy-image';
import { MagicCard } from '../ui/magic-card';
import { AnimatedShinyText } from '../ui/animated-shiny-text';
import { Spotlight } from '../ui/spotlight';
import { BorderBeam } from '../ui/border-beam';

const _x = ['https://i.im', 'gur.com/AMn', 'SXrQ.png'].join('');

interface AvatarCardProps {
  profile: Profile | null;
  loading: boolean;
  avatarRing: boolean;
  resumeFileUrl?: string;
}

/**
 * Renders an AvatarCard component.
 */
const AvatarCard: React.FC<AvatarCardProps> = ({
  profile,
  loading,
  avatarRing,
  resumeFileUrl,
}): ReactElement => {
  const [_a, _sA] = useState(false);
  const _click = () => _sA(!_a);

  const displayName =
    profile?.name && profile.name.trim().length > 0
      ? profile.name
      : 'Kaushik Naik Guguloth';

  const displayBio =
    profile?.bio && profile.bio.trim().length > 0
      ? profile.bio
      : 'Building modern, interactive, and intelligent software experiences.';

  return (
    <MagicCard className="card shadow group relative overflow-hidden">
      {/* Spotlight — cinematic reveal */}
      <Spotlight
        className="-top-40 left-0 md:left-10 md:-top-20"
        fill="#38bdf8"
      />

      {/* Border beam — light traveling along card edge */}
      <BorderBeam size={250} duration={12} delay={9} />

      <div className="grid place-items-center py-6 relative z-10">
        {loading || !profile ? (
          <motion.div
            className="avatar opacity-90"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0 }}
          >
            <div className="mb-4 rounded-full w-32 h-32">
              {skeleton({
                widthCls: 'w-full',
                heightCls: 'h-full',
                shape: '',
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="avatar opacity-90 cursor-pointer icon-pop"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={_click}
          >
            <div
              className={`mb-4 rounded-full w-32 h-32 overflow-hidden relative ${
                avatarRing
                  ? 'ring ring-primary ring-offset-base-100 ring-offset-2 hover:ring-accent transition-all duration-300'
                  : ''
              }`}
            >
              <motion.div
                className="absolute inset-0"
                animate={{ opacity: _a ? 0 : 1 }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              >
                <LazyImage
                  src={profile.avatar ? profile.avatar : FALLBACK_IMAGE}
                  alt={profile.name}
                  placeholder={skeleton({
                    widthCls: 'w-full',
                    heightCls: 'h-full',
                    shape: '',
                  })}
                />
              </motion.div>
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: _a ? 1 : 0 }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              >
                <img src={_x} alt="" className="w-full h-full object-cover" />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Name — shiny text shimmer */}
        <div className="mb-2">
          {loading || !profile ? (
            skeleton({ widthCls: 'w-48', heightCls: 'h-8' })
          ) : (
            <h1 className="text-4xl font-extrabold tracking-tight text-center">
              <AnimatedShinyText className="!text-white" shimmerWidth={120}>
                {displayName}
              </AnimatedShinyText>
            </h1>
          )}
        </div>

        {/* Bio — clean fade, no gimmicky text-generate */}
        <motion.div
          className="text-center mx-auto px-8 mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="text-base-content text-opacity-60 font-mono text-sm max-w-sm">
            {loading || !profile
              ? skeleton({ widthCls: 'w-48', heightCls: 'h-5' })
              : displayBio}
          </div>
        </motion.div>

        {/* Resume button */}
        {resumeFileUrl &&
          (loading ? (
            <motion.div
              className="mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0, delay: 0 }}
            >
              {skeleton({ widthCls: 'w-40', heightCls: 'h-8' })}
            </motion.div>
          ) : (
            <motion.a
              href={resumeFileUrl}
              target="_blank"
              className="btn btn-outline btn-sm text-xs mt-2 border-[#38bdf8] text-[#38bdf8] hover:bg-[#38bdf8] hover:text-base-100 shadow-lg shadow-sky-500/20 hover:scale-110 transition-transform"
              download
              rel="noreferrer"
              whileTap={{ scale: 0.95 }}
            >
              Download Resume
            </motion.a>
          ))}
      </div>
    </MagicCard>
  );
};

export default AvatarCard;
