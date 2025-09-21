import { useState } from 'react';
import { motion } from 'framer-motion';
import { AiOutlineFork, AiOutlineStar } from 'react-icons/ai';
import { MdInsertLink } from 'react-icons/md';
import { getLanguageColor, skeleton } from '../../utils';
import { GithubProject } from '../../interfaces/github-project';
import Modal from '../modal'; // Import the new Modal component

const GithubProjectCard = ({
  header,
  githubProjects,
  loading,
  limit,
  username,
}: {
  header: string;
  githubProjects: GithubProject[];
  loading: boolean;
  limit: number;
  username: string;
}) => {
  const [modalProject, setModalProject] = useState<GithubProject | null>(null);

  if (!loading && githubProjects.length === 0) {
    return null;
  }

  const renderSkeleton = () => {
    const array = [];
    for (let index = 0; index < limit; index++) {
      array.push(
        <motion.div
          className="card shadow-lg compact bg-base-100 glass-card"
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <div className="flex justify-between flex-col p-8 h-full w-full">
            <div>
              <div className="flex items-center">
                <span>
                  <motion.h5
                    className="card-title text-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {skeleton({
                      widthCls: 'w-32',
                      heightCls: 'h-8',
                      className: 'mb-1',
                    })}
                  </motion.h5>
                </span>
              </div>
              <div className="mb-5 mt-1">
                {skeleton({
                  widthCls: 'w-full',
                  heightCls: 'h-4',
                  className: 'mb-2',
                })}
                {skeleton({ widthCls: 'w-full', heightCls: 'h-4' })}
              </div>
            </div>
            <div className="flex justify-between">
              <div className="flex flex-grow">
                <span className="mr-3 flex items-center">
                  {skeleton({ widthCls: 'w-12', heightCls: 'h-4' })}
                </span>
                <span className="flex items-center">
                  {skeleton({ widthCls: 'w-12', heightCls: 'h-4' })}
                </span>
              </div>
              <div>
                <span className="flex items-center">
                  {skeleton({ widthCls: 'w-12', heightCls: 'h-4' })}
                </span>
              </div>
            </div>
          </div>
        </motion.div>,
      );
    }

    return array;
  };

  const renderProjects = () => {
    return githubProjects.map((item, index) => (
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
        <div className="flex justify-between flex-col p-8 h-full w-full">
          <div>
            <div className="flex items-center truncate">
              <motion.div
                className="card-title text-lg tracking-wide flex text-base-content opacity-60"
                whileHover={{ color: '#3b82f6' }}
              >
                <MdInsertLink className="my-auto" />
                <span>{item.name}</span>
              </motion.div>
            </div>
            <motion.p
              className="mb-5 mt-1 text-base-content text-opacity-60 text-sm truncate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ color: '#8b5cf6' }}
            >
              {item.description}
            </motion.p>
          </div>
          <div className="flex justify-between text-sm text-base-content text-opacity-60 truncate">
            <div className="flex flex-grow">
              <motion.span
                className="mr-3 flex items-center"
                whileHover={{ scale: 1.1 }}
              >
                <AiOutlineStar className="mr-0.5" />
                <span>{item.stargazers_count}</span>
              </motion.span>
              <motion.span
                className="flex items-center"
                whileHover={{ scale: 1.1 }}
              >
                <AiOutlineFork className="mr-0.5" />
                <span>{item.forks_count}</span>
              </motion.span>
            </div>
            <motion.div whileHover={{ scale: 1.1 }}>
              <span className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-1 opacity-60"
                  style={{ backgroundColor: getLanguageColor(item.language) }}
                />
                <span>{item.language}</span>
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>
    ));
  };

  return (
    <>
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
                  {loading ? (
                    skeleton({ widthCls: 'w-10', heightCls: 'h-5' })
                  ) : (
                    <motion.a
                      href={`https://github.com/${username}?tab=repositories`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-base-content opacity-50 hover:underline"
                      whileHover={{ color: '#3b82f6' }}
                    >
                      See All
                    </motion.a>
                  )}
                </motion.div>
                <div className="col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loading ? renderSkeleton() : renderProjects()}
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
        title={modalProject?.name || ''}
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
              href={modalProject.html_url}
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
    </>
  );
};

export default GithubProjectCard;
