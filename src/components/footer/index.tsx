import { skeleton } from '../../utils';

const Footer = ({
  content,
  loading,
}: {
  content: string | null;
  loading: boolean;
}) => {
  if (!content) return null;

  return (
    <div className="card-body bg-base-100/60 border border-primary/20 backdrop-blur-lg rounded-xl neon-glow liquid-card">
      {loading ? (
        skeleton({ widthCls: 'w-52', heightCls: 'h-6' })
      ) : (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      )}
    </div>
  );
};

export default Footer;
