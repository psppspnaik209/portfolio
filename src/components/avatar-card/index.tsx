import { motion } from 'framer-motion';
import { useState } from 'react';
import { FALLBACK_IMAGE } from '../../constants';
import { Profile } from '../../interfaces/profile';
import { skeleton } from '../../utils';
import LazyImage from '../lazy-image';

const _x = ['https://i.im', 'gur.com/AMn', 'SXrQ.png'].join('');

interface AvatarCardProps {
  profile: Profile | null;
  loading: boolean;
  avatarRing: boolean;
  resumeFileUrl?: string;
}

// Interactive name component with letter-by-letter hover animation
const InteractiveName = ({ name }: { name: string }) => {
  return (
    <div className="flex justify-center flex-wrap cursor-default select-none">
      {name.split('').map((letter, index) => (
        <span
          key={index}
          className="inline-block text-3xl font-bold transition-all duration-150 hover:text-yellow-400 hover:-translate-y-2 hover:scale-110"
          style={{ transitionDelay: '0ms' }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </span>
      ))}
    </div>
  );
};

/**
 * Renders an AvatarCard component.
 */
const AvatarCard: React.FC<AvatarCardProps> = ({
  profile,
  loading,
  avatarRing,
  resumeFileUrl,
}): JSX.Element => {
  const [_a, _sA] = useState(false);

  // Toggle between normal and alternate view
  const _click = () => _sA(!_a);

  return (
    <motion.div
      className="card shadow-2xl compact bg-base-100/85 border border-primary/20 rounded-xl card-hover neon-glow liquid-card"
    >
      <div className="grid place-items-center py-6">
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
            className="avatar opacity-90 cursor-pointer hover:scale-110 transition-transform"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0 }}
            onClick={_click}
          >
            <div
              className={`mb-4 rounded-full w-32 h-32 overflow-hidden relative ${
                avatarRing
                  ? 'ring ring-primary ring-offset-base-100 ring-offset-2 hover:ring-accent transition-all duration-300'
                  : ''
              }`}
            >
              {/* Default avatar - fades out when clicked */}
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

              {/* Alternate view - fades in when clicked */}
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

        {/* Interactive name with letter hover animation */}
        <div className="mb-2">
          <InteractiveName name="Kaushik Naik Guguloth" />
        </div>

        {/* Bio */}
        <motion.div
          className="text-center mx-auto px-8 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0, delay: 0 }}
        >
          <motion.div className="text-base-content text-opacity-60 font-mono text-sm">
            {loading || !profile
              ? skeleton({ widthCls: 'w-48', heightCls: 'h-5' })
              : profile.bio}
          </motion.div>
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
              className="btn btn-outline btn-sm text-xs mt-2 border-accent text-accent hover:bg-accent hover:text-base-100 shadow-lg shadow-accent/20 hover:scale-110 transition-transform"
              download
              rel="noreferrer"
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
