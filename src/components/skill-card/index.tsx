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
        <div key={index}>
          {skeleton({ widthCls: 'w-16', heightCls: 'h-4', className: 'm-1' })}
        </div>,
      );
    }

    return array;
  };

  return (
    <div className="card glass-card hover:border-white/10 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group card-hover">
      <div className="card-body">
        <div className="mx-3">
          <h5 className="card-title">
            {loading ? (
              skeleton({ widthCls: 'w-32', heightCls: 'h-8' })
            ) : (
              <span className="text-base-content opacity-70">Tech Stack</span>
            )}
          </h5>
        </div>
        <div className="p-3 flow-root">
          <div className="-m-1 flex flex-wrap justify-center">
            {loading
              ? renderSkeleton()
              : skills.map((skill, index) => (
                  <span
                    key={index}
                    className="m-1 text-xs inline-flex items-center font-bold leading-sm px-3 py-1 badge badge-accent bg-accent/80 rounded-full skill-badge-hover border border-accent/50 shadow-lg shadow-accent/30 cursor-default select-none"
                  >
                    {skill}
                  </span>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillCard;
