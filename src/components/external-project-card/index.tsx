import { Fragment, useState } from 'react';
import { motion } from 'framer-motion';
import LazyImage from '../lazy-image';
import { skeleton } from '../../utils';
import { SanitizedExternalProject } from '../../interfaces/sanitized-config';
import Modal from '../modal'; // Import the new Modal component

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
          className="card shadow-lg compact bg-base-100 glass-card"
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <div className="p-8 h-full w-full">
            <div className="flex items-center flex-col">
              <div className="w-full">
                <div className="flex items-start px-4">
                  <div className="w-full">
                    <motion.h2
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
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
        className="card shadow-lg compact bg-base-100 glass-card cursor-pointer card-hover"
        key={index}
        onClick={() => setModalProject(item)}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{
          scale: 1.05,
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
        }}
      >
        <div className="p-8 h-full w-full">
          <div className="flex items-center flex-col">
            <div className="w-full">
              <div className="px-4">
                <div className="text-center w-full">
                  <motion.h2
                    className="font-medium text-center opacity-60 mb-2"
                    whileHover={{ color: '#3b82f6' }}
                  >
                    {item.title}
                  </motion.h2>
                  {item.imageUrl && (
                    <motion.div
                      className="avatar opacity-90"
                      whileHover={{ scale: 1.1 }}
                    >
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
                    </motion.div>
                  )}
                  <motion.p
                    className="mt-2 text-base-content text-opacity-60 text-sm text-justify truncate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    {item.description}
                  </motion.p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
            <motion.div
              className="card compact bg-base-100 glass-card shadow bg-opacity-40"
              whileHover={{ scale: 1.01 }}
            >
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
            </motion.div>
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.p className="py-4" whileHover={{ color: '#8b5cf6' }}>
              {modalProject.description}
            </motion.p>
            <motion.a
              href={modalProject.link}
              target="_blank"
              rel="noreferrer"
              className="btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
