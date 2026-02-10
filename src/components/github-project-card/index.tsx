import { useState } from 'react';
import { motion } from 'framer-motion';
import { AiOutlineFork, AiOutlineStar } from 'react-icons/ai';
import { MdInsertLink } from 'react-icons/md';
import { getLanguageColor, skeleton } from '../../utils';
import { GithubProject } from '../../interfaces/github-project';
import Modal from '../modal'; // Import the new Modal component
import FFLockerVideo from '../../assets/demo/FFLocker.mp4';
import MicMuteNetVideo from '../../assets/demo/MicMuteNet.mp4';
import SenscribeVideo from '../../assets/demo/Senscribe.MP4';
import FlutterGenAiVideo from '../../assets/demo/flutter_gen_ai.webm';

const getVideoPath = (projectName: string) => {
  if (projectName.includes('FFLocker')) return FFLockerVideo;
  if (projectName.includes('MicMuteNet')) return MicMuteNetVideo;
  if (projectName.includes('Capstone')) return SenscribeVideo;
  if (projectName.includes('flutter_gen_ai')) return FlutterGenAiVideo;
  return null;
};

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
          className="card shadow-lg compact bg-base-100 "
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0 }}
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
        className="card shadow-2xl compact bg-base-100/85 border border-accent/20 rounded-xl cursor-pointer neon-glow liquid-card card-3d"
        key={index}
        onClick={() => setModalProject(item)}
        initial={{ opacity: 0, y: 20 }}
        whileHover={{ scale: 1.05, y: -5 }}
        whileInView={{ opacity: 1, y: 0 }}
        animate={{ scale: 1, zIndex: 1 }}
        transition={{ duration: 0.2, delay: 0 }}
      >
        <div className="flex justify-between flex-col p-8 h-full w-full">
          <div>
            <div className="flex items-center truncate">
              <div className="card-title text-lg tracking-wide flex text-base-content opacity-60 link-glow origin-left">
                <MdInsertLink className="my-auto" />
                <span>{item.name}</span>
              </div>
            </div>
            <motion.p
              className="mb-5 mt-1 text-base-content text-opacity-60 text-sm truncate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0 }}
            >
              {item.description}
            </motion.p>
          </div>
          <div className="flex justify-between text-sm text-base-content text-opacity-60 truncate">
            <div className="flex flex-grow">
              <motion.span className="mr-3 flex items-center hover:scale-110 transition-transform">
                <AiOutlineStar className="mr-0.5" />
                <span>{item.stargazers_count}</span>
              </motion.span>
              <motion.span className="flex items-center hover:scale-110 transition-transform">
                <AiOutlineFork className="mr-0.5" />
                <span>{item.forks_count}</span>
              </motion.span>
            </div>
            <div className="hover:scale-110 transition-transform">
              <span className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-1 opacity-60"
                  style={{ backgroundColor: getLanguageColor(item.language) }}
                />
                <span>{item.language}</span>
              </span>
            </div>
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
            <motion.div className="card compact bg-base-100/85 border border-primary/20 rounded-xl shadow neon-glow liquid-card card-hover">
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
                      className="text-base-content opacity-50 hover:underline link-glow"
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
            transition={{ duration: 0 }}
          >
            <motion.p className="py-4 link-glow-purple">
              {modalProject.description}
            </motion.p>
            {getVideoPath(modalProject.name) && (
              <video
                src={getVideoPath(modalProject.name) as string}
                ref={(ref) => {
                  if (ref) {
                    if (modalProject.name.includes('Capstone')) {
                      ref.muted = false;
                      ref.volume = 0.1;
                    } else {
                      ref.muted = true;
                    }
                  }
                }}
                controls
                autoPlay
                loop
                className="w-full rounded-lg mb-4 shadow-lg border border-primary/20 max-h-[60vh] object-contain cursor-auto"
              />
            )}
            <motion.a
              href={modalProject.html_url}
              target="_blank"
              rel="noreferrer"
              className="btn hover:scale-105 transition-transform"
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
