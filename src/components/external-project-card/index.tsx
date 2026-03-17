import { Fragment, useState } from 'react';
import { motion } from 'framer-motion';
import LazyImage from '../lazy-image';
import { skeleton } from '../../utils';
import { SanitizedExternalProject } from '../../interfaces/sanitized-config';
import Modal from '../modal'; // Import the new Modal component
import { MagicCard } from '../ui/magic-card';
import { Meteors } from '../ui/meteors';

const ExternalProjectCard = ({
  externalProjects,
  header,
  loading,
}: {
  externalProjects: SanitizedExternalProject[];
  header: string;
  loading: boolean;
}) => {
  const [modalProject, setModalProject] =
    useState<SanitizedExternalProject | null>(null);

  const renderSkeleton = () => {
    const array = [];
    for (let index = 0; index < externalProjects.length; index++) {
      array.push(
        <motion.div
          className="card shadow-lg compact bg-base-100 "
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0 }}
        >
          <div className="p-8 h-full w-full">
            <div className="flex items-center flex-col">
              <div className="w-full">
                <div className="flex items-start px-4">
                  <div className="w-full">
                    <motion.h2
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0 }}
                    >
                      {skeleton({
                        widthCls: 'w-32',
                        heightCls: 'h-8',
                        className: 'mb-2 mx-auto',
                      })}
                    </motion.h2>
                    <div className="avatar w-full h-full">
                      <div className="w-24 h-24 mask mask-squircle mx-auto">
                        {skeleton({
                          widthCls: 'w-full',
                          heightCls: 'h-full',
                          shape: '',
                        })}
                      </div>
                    </div>
                    <div className="mt-2">
                      {skeleton({
                        widthCls: 'w-full',
                        heightCls: 'h-4',
                        className: 'mx-auto',
                      })}
                    </div>
                    <div className="mt-2 flex items-center flex-wrap justify-center">
                      {skeleton({
                        widthCls: 'w-full',
                        heightCls: 'h-4',
                        className: 'mx-auto',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>,
      );
    }

    return array;
  };

  const renderExternalProjects = () => {
    return externalProjects.map((item, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        animate={{ scale: 1, zIndex: 1 }}
        transition={{ duration: 0.2, delay: index * 0.1 }}
      >
        <MagicCard
          className="cursor-pointer"
          onClick={() => setModalProject(item)}
        >
          <div className="p-8 h-full w-full">
            <div className="flex items-center flex-col">
              <div className="w-full">
                <div className="px-4">
                  <div className="text-center w-full">
                    <h2 className="font-medium text-center opacity-60 mb-2 link-glow">
                      {' '}
                      {item.title}
                    </h2>
                    {item.imageUrl && (
                      <div className="avatar opacity-90 hover:scale-110 transition-transform">
                        <div className="w-24 h-24 mask mask-squircle">
                          <LazyImage
                            src={item.imageUrl}
                            alt={'thumbnail'}
                            placeholder={skeleton({
                              widthCls: 'w-full',
                              heightCls: 'h-full',
                              shape: '',
                            })}
                          />
                        </div>
                      </div>
                    )}
                    <motion.p
                      className="mt-2 text-base-content text-opacity-60 text-sm text-justify truncate"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0 }}
                    >
                      {item.description}
                    </motion.p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MagicCard>
      </motion.div>
    ));
  };

  return (
    <Fragment>
      <motion.div
        className="col-span-1 lg:col-span-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <MagicCard className="card compact shadow relative overflow-hidden">
              <Meteors number={10} />
              <div className="card-body">
                <motion.div
                  className="mx-3 flex items-center justify-between mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.h5 className="card-title">
                    {loading ? (
                      skeleton({ widthCls: 'w-40', heightCls: 'h-8' })
                    ) : (
                      <span className="text-base-content opacity-70">
                        {header}
                      </span>
                    )}
                  </motion.h5>
                </motion.div>
                <div className="col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loading ? renderSkeleton() : renderExternalProjects()}
                  </div>
                </div>
              </div>
            </MagicCard>
          </div>
        </div>
      </motion.div>
      <Modal
        isOpen={!!modalProject}
        onClose={() => setModalProject(null)}
        title={modalProject?.title || ''}
      >
        {modalProject && (
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Description */}
            <div className="border-l-2 border-[#38bdf8]/40 pl-4">
              <p className="text-white/70 text-sm leading-relaxed">
                {modalProject.description}
              </p>
            </div>

            {/* View Project Button */}
            <motion.a
              href={modalProject.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[#38bdf8] hover:bg-[#38bdf8]/20 hover:border-[#38bdf8]/50 transition-all duration-150"
              whileTap={{ scale: 0.97 }}
            >
              View Project
            </motion.a>
          </motion.div>
        )}
      </Modal>
    </Fragment>
  );
};

export default ExternalProjectCard;
