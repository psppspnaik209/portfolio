import React from 'react';
import { motion } from 'framer-motion';
import { SanitizedCertification } from '../../interfaces/sanitized-config';
import { skeleton } from '../../utils';

const ListItem = ({
  year,
  name,
  body,
  link,
}: {
  year?: React.ReactNode;
  name?: React.ReactNode;
  body?: React.ReactNode;
  link?: string;
}) => (
  <motion.li
    className="mb-5 ml-4 list-item-hover"
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.2 }}
  >
    <div
      className="absolute w-2 h-2 bg-base-300 rounded-full border border-base-300 mt-1.5"
      style={{ left: '-4.5px' }}
    ></div>
    <div className="my-0.5 text-xs">{year}</div>
    <motion.div className="font-medium">
      <a href={link} target="_blank" rel="noreferrer" className="link-glow">
        {name}
      </a>
    </motion.div>
    <h3 className="mb-4 font-normal link-glow-purple">{body}</h3>
  </motion.li>
);

const CertificationCard = ({
  certifications,
  loading,
}: {
  certifications: SanitizedCertification[];
  loading: boolean;
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
          <motion.div className="font-medium">
            {skeleton({
              widthCls: 'w-6/12',
              heightCls: 'h-4',
              className: 'my-1.5',
            })}
          </motion.div>
          <motion.h3 className="mb-4 font-normal">
            {skeleton({ widthCls: 'w-6/12', heightCls: 'h-3' })}
          </motion.h3>
        </motion.li>,
      );
    }

    return array;
  };

  return (
    <motion.div
      className="card shadow-2xl compact bg-base-100/85 border border-primary/20  rounded-xl  neon-glow glitch liquid-card"
      data-text="Certifications"
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
              <span className="text-base-content opacity-70">
                Certification
              </span>
            )}
          </motion.h5>
        </motion.div>
        <div className="text-base-content text-opacity-60">
          <ol className="relative border-l border-primary/20 my-2 mx-4">
            {loading ? (
              renderSkeleton()
            ) : (
              <>
                {certifications.map((certification, index) => (
                  <ListItem
                    key={index}
                    year={certification.year}
                    name={certification.name}
                    body={certification.body}
                    link={certification.link}
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

export default CertificationCard;
