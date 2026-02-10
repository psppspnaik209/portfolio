import React from 'react';
import { motion } from 'framer-motion';
import { SanitizedEducation } from '../../interfaces/sanitized-config';
import { skeleton } from '../../utils';

const ListItem = ({
  time,
  degree,
  institution,
  link,
}: {
  time: React.ReactNode;
  degree?: React.ReactNode;
  institution?: React.ReactNode;
  link?: string;
}) => (
  <motion.li
    className="mb-5 ml-4 hover:scale-[1.01] transition-transform"
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.2 }}
  >
    <div
      className="absolute w-2 h-2 bg-base-300 rounded-full border border-base-300 mt-1.5"
      style={{ left: '-4.5px' }}
    ></div>
    <div className="my-0.5 text-xs">{time}</div>
    <h3 className="font-semibold hover:text-blue-400 transition-colors">
      {degree}
    </h3>
    <div className="mb-4 font-normal">
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="hover:text-blue-400 transition-colors"
        >
          {institution}
        </a>
      ) : (
        institution
      )}
    </div>
  </motion.li>
);

const EducationCard = ({
  loading,
  educations,
}: {
  loading: boolean;
  educations: SanitizedEducation[];
}) => {
  const renderSkeleton = () => {
    const array = [];
    for (let index = 0; index < 2; index++) {
      array.push(
        <motion.li
          key={index}
          className="mb-5 ml-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0 }}
        >
          <div
            className="absolute w-2 h-2 bg-accent rounded-full border border-accent mt-1.5 shadow-lg shadow-accent/50"
            style={{ left: '-4.5px' }}
          ></div>
          <div className="my-0.5 text-xs">
            {skeleton({
              widthCls: 'w-5/12',
              heightCls: 'h-4',
            })}
          </div>
          <motion.h3 className="font-semibold">
            {skeleton({
              widthCls: 'w-6/12',
              heightCls: 'h-4',
              className: 'my-1.5',
            })}
          </motion.h3>
          <div className="mb-4 font-normal">
            {skeleton({ widthCls: 'w-6/12', heightCls: 'h-3' })}
          </div>
        </motion.li>,
      );
    }

    return array;
  };

  return (
    <motion.div
      className="card shadow-2xl compact bg-base-100/85 border border-primary/20  rounded-xl  neon-glow glitch liquid-card"
      data-text="Education"
    >
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
              <span className="text-base-content opacity-70">Education</span>
            )}
          </motion.h5>
        </motion.div>
        <div className="text-base-content text-opacity-60">
          <ol className="relative border-l border-primary/20 my-2 mx-4">
            {loading ? (
              renderSkeleton()
            ) : (
              <>
                {educations.map((item, index) => (
                  <ListItem
                    key={index}
                    time={`${item.from} - ${item.to}`}
                    degree={item.degree}
                    institution={item.institution}
                    link={item.link}
                  />
                ))}
              </>
            )}
          </ol>
        </div>
      </div>
    </motion.div>
  );
};

export default EducationCard;
