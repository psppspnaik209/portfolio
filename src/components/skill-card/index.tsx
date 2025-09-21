import { motion } from 'framer-motion';
import { skeleton } from '../../utils';

const SkillCard = ({
  loading,
  skills,
}: {
  loading: boolean;
  skills: string[];
}) => {
  const renderSkeleton = () => {
    const array = [];
    for (let index = 0; index < 12; index++) {
      array.push(
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          {skeleton({ widthCls: 'w-16', heightCls: 'h-4', className: 'm-1' })}
        </motion.div>,
      );
    }

    return array;
  };

  return (
    <motion.div
      className="card shadow-2xl compact bg-base-100/60 border border-primary/20 backdrop-blur-lg rounded-xl card-hover neon-glow liquid-card"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-body">
        <motion.div
          className="mx-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h5 className="card-title">
            {loading ? (
              skeleton({ widthCls: 'w-32', heightCls: 'h-8' })
            ) : (
              <span className="text-base-content opacity-70">Tech Stack</span>
            )}
          </motion.h5>
        </motion.div>
        <div className="p-3 flow-root">
          <div className="-m-1 flex flex-wrap justify-center">
            {loading
              ? renderSkeleton()
              : skills.map((skill, index) => (
                  <motion.div
                    key={index}
                    className="m-1 text-xs inline-flex items-center font-bold leading-sm px-3 py-1 badge badge-accent bg-accent/80 rounded-full skill-badge-hover border border-accent/50 shadow-lg shadow-accent/30 hover:shadow-accent/50 transition-shadow duration-300"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.1, y: -5 }}
                  >
                    {skill}
                  </motion.div>
                ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SkillCard;
