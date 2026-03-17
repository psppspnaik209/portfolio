import { Fragment, useState } from 'react';
import { motion } from 'framer-motion';
import { SanitizedExperience } from '../../interfaces/sanitized-config';
import { skeleton } from '../../utils';
import Modal from '../modal'; // Import the new Modal component
import { MagicCard } from '../ui/magic-card';

const ListItem = ({
  experience,
  onClick,
}: {
  experience: SanitizedExperience;
  onClick: () => void;
}) => (
  <motion.li
    className="mb-5 !ml-6 cursor-pointer list-item-hover"
    onClick={onClick}
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.2 }}
  >
    <div
      className="absolute w-2 h-2 bg-base-300 rounded-full border border-base-300 mt-1.5"
      style={{ left: '-29px' }}
    ></div>
    <div className="my-0.5 text-xs">
      {experience.from} - {experience.to}
    </div>
    <h3 className="font-semibold">{experience.position}</h3>
    <div className="mb-4 font-normal">
      <a href={experience.companyLink} target="_blank" rel="noreferrer">
        {experience.company}
      </a>
    </div>
  </motion.li>
);

const ExperienceCard = ({
  experiences,
  loading,
}: {
  experiences: SanitizedExperience[];
  loading: boolean;
}) => {
  const [modalExperience, setModalExperience] =
    useState<SanitizedExperience | null>(null);

  const renderSkeleton = () => {
    const array = [];
    for (let index = 0; index < 2; index++) {
      array.push(
        <motion.li
          className="mb-5 ml-4"
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0 }}
        >
          <div
            className="absolute w-2 h-2 bg-accent rounded-full border border-accent mt-1.5 shadow-lg shadow-accent/50"
            style={{ left: '-4.5px' }}
          ></div>
          <div className="my-0.5 text-xs">
            {skeleton({ widthCls: 'w-5/12', heightCls: 'h-4' })}
          </div>
          <h3 className="font-semibold">
            {skeleton({
              widthCls: 'w-6/12',
              heightCls: 'h-4',
              className: 'my-1.5',
            })}
          </h3>
          <div className="mb-4 font-normal">
            {skeleton({ widthCls: 'w-6/12', heightCls: 'h-3' })}
          </div>
        </motion.li>,
      );
    }

    return array;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <MagicCard className="card shadow group">
          <div className="card-body">
            <motion.div
              className="mx-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <motion.h5 className="card-title">
                {loading ? (
                  skeleton({ widthCls: 'w-32', heightCls: 'h-8' })
                ) : (
                  <span className="text-base-content opacity-70">
                    Experience
                  </span>
                )}
              </motion.h5>
            </motion.div>
            <div className="text-base-content text-opacity-60">
              <ol className="relative border-l border-primary/20 my-2 mx-4">
                {loading ? (
                  renderSkeleton()
                ) : (
                  <Fragment>
                    {experiences.map((experience, index) => (
                      <ListItem
                        key={index}
                        experience={experience}
                        onClick={() => setModalExperience(experience)}
                      />
                    ))}
                  </Fragment>
                )}
              </ol>
            </div>
          </div>
        </MagicCard>
      </motion.div>
      <Modal
        isOpen={!!modalExperience}
        onClose={() => setModalExperience(null)}
        title={modalExperience?.position || ''}
      >
        {modalExperience && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Company & Date */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8]">
                {modalExperience.company}
              </span>
              <span className="text-xs text-white/40 font-mono">
                {modalExperience.from} — {modalExperience.to}
              </span>
            </div>

            {/* Description */}
            {modalExperience.description && (
              <div className="border-l-2 border-[#38bdf8]/40 pl-4">
                <p className="text-white/70 text-sm leading-relaxed">
                  {modalExperience.description}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </Modal>
    </>
  );
};

export default ExperienceCard;
