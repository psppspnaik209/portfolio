import React, { Fragment, useState } from 'react';
import { SanitizedExperience } from '../../interfaces/sanitized-config';
import { skeleton } from '../../utils';

const Modal = ({ experience, onClose }: { experience: SanitizedExperience, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
    <div className="bg-base-100 p-5 rounded-lg max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
      <h3 className="font-semibold text-lg">{experience.position}</h3>
      <p className="text-sm text-base-content text-opacity-60">{experience.company}</p>
      <p className="text-xs text-base-content text-opacity-60">{experience.from} - {experience.to}</p>
      <p className="py-4">{experience.description}</p>
      <div className="modal-action">
        <button onClick={onClose} className="btn">Close</button>
      </div>
    </div>
  </div>
);

const ListItem = ({
  experience,
  onClick,
}: {
  experience: SanitizedExperience;
  onClick: () => void;
}) => (
  <li className="mb-5 ml-4 cursor-pointer" onClick={onClick}>
    <div
      className="absolute w-2 h-2 bg-base-300 rounded-full border border-base-300 mt-1.5"
      style={{ left: '-4.5px' }}
    ></div>
    <div className="my-0.5 text-xs">{experience.from} - {experience.to}</div>
    <h3 className="font-semibold">{experience.position}</h3>
    <div className="mb-4 font-normal">
      <a href={experience.companyLink} target="_blank" rel="noreferrer">
        {experience.company}
      </a>
    </div>
  </li>
);

const ExperienceCard = ({
  experiences,
  loading,
}: {
  experiences: SanitizedExperience[];
  loading: boolean;
}) => {
  const [modalExperience, setModalExperience] = useState<SanitizedExperience | null>(null);

  const renderSkeleton = () => {
    const array = [];
    for (let index = 0; index < 2; index++) {
      array.push(
        <li className="mb-5 ml-4" key={index}>
          <div
            className="absolute w-2 h-2 bg-base-300 rounded-full border border-base-300 mt-1.5"
            style={{ left: '-4.5px' }}
          ></div>
          <div className="my-0.5 text-xs">{skeleton({ widthCls: 'w-5/12', heightCls: 'h-4' })}</div>
          <h3 className="font-semibold">{skeleton({ widthCls: 'w-6/12', heightCls: 'h-4', className: 'my-1.5' })}</h3>
          <div className="mb-4 font-normal">{skeleton({ widthCls: 'w-6/12', heightCls: 'h-3' })}</div>
        </li>
      );
    }

    return array;
  };

  return (
    <>
      <div className="card shadow-lg compact bg-base-100">
        <div className="card-body">
          <div className="mx-3">
            <h5 className="card-title">
              {loading ? (
                skeleton({ widthCls: 'w-32', heightCls: 'h-8' })
              ) : (
                <span className="text-base-content opacity-70">Experience</span>
              )}
            </h5>
          </div>
          <div className="text-base-content text-opacity-60">
            <ol className="relative border-l border-base-300 border-opacity-30 my-2 mx-4">
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
      </div>
      {modalExperience && <Modal experience={modalExperience} onClose={() => setModalExperience(null)} />}
    </>
  );
};

export default ExperienceCard;
