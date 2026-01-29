import { motion } from 'framer-motion';
import { FALLBACK_IMAGE } from '../../constants';
import { Profile } from '../../interfaces/profile';
import { skeleton } from '../../utils';
import LazyImage from '../lazy-image';

interface AvatarCardProps {
  profile: Profile | null;
  loading: boolean;
  avatarRing: boolean;
  resumeFileUrl?: string;
}

/**
 * Renders an AvatarCard component.
 * @param profile - The profile object.
 * @param loading - A boolean indicating if the profile is loading.
 * @param avatarRing - A boolean indicating if the avatar should have a ring.
 * @param resumeFileUrl - The URL of the resume file.
 * @returns JSX element representing the AvatarCard.
 */
const AvatarCard: React.FC<AvatarCardProps> = ({
  profile,
  loading,
  avatarRing,
  resumeFileUrl,
}): JSX.Element => {
  return (
    <motion.div
      className="card shadow-2xl compact bg-base-100/60 border border-primary/20 backdrop-blur-lg rounded-xl card-hover neon-glow liquid-card"
      whileHover={{
        scale: 1.02,
        y: -2,
        transition: { duration: 0 },
      }}
    >
      <div className="grid place-items-center py-8">
        {loading || !profile ? (
          <motion.div
            className="avatar opacity-90"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0 }}
          >
            <div className="mb-8 rounded-full w-32 h-32">
              {skeleton({
                widthCls: 'w-full',
                heightCls: 'h-full',
                shape: '',
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="avatar opacity-90"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0 }}
          >
            <div
              className={`mb-8 rounded-full w-32 h-32 ${
                avatarRing
                  ? 'ring ring-primary ring-offset-base-100 ring-offset-2'
                  : ''
              }`}
            >
              {
                <LazyImage
                  src={profile.avatar ? profile.avatar : FALLBACK_IMAGE}
                  alt={profile.name}
                  placeholder={skeleton({
                    widthCls: 'w-full',
                    heightCls: 'h-full',
                    shape: '',
                  })}
                />
              }
            </div>
          </motion.div>
        )}
        
        {/* Name display */}
        <motion.h2
          className="text-2xl font-bold text-base-content mt-4 mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0 }}
        >
          Kaushik Naik Guguloth
        </motion.h2>
        <motion.div
          className="text-center mx-auto px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0, delay: 0 }}
        >
          <motion.h5 className="font-bold text-2xl">
            {loading || !profile ? (
              skeleton({ widthCls: 'w-48', heightCls: 'h-8' })
            ) : (
              <span className="text-base-content opacity-70">
                {profile.name}
              </span>
            )}
          </motion.h5>
          <motion.div className="mt-3 text-base-content text-opacity-60 font-mono">
            {loading || !profile
              ? skeleton({ widthCls: 'w-48', heightCls: 'h-5' })
              : profile.bio}
          </motion.div>
        </motion.div>
        {resumeFileUrl &&
          (loading ? (
            <motion.div
              className="mt-6"
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
              className="btn btn-outline btn-sm text-xs mt-6 border-accent text-accent hover:bg-accent hover:text-base-100 shadow-lg shadow-accent/20"
              download
              rel="noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Download Resume
            </motion.a>
          ))}
      </div>
    </motion.div>
  );
};

export default AvatarCard;
