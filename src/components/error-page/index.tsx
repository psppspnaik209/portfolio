import { CustomError } from '../../constants/errors';

/**
 * Render the ErrorPage component.
 *
 * @param props - The props for the ErrorPage component.
 * @returns The rendered ErrorPage component.
 */
const ErrorPage: React.FC<CustomError> = (props) => {
  return (
    <div className="flex min-h-screen items-center overflow-hidden bg-[var(--paper)] px-5 py-12 md:px-10">
      <div className="surface-strong relative mx-auto w-full max-w-4xl rounded-[2rem] p-10 text-center md:p-16 md:text-left">
        <div className="w-full">
          <div className="mt-6 text-[var(--ink-muted)]">
            <h1 className="mb-8 font-accent text-sm font-semibold uppercase tracking-[0.2em] text-[var(--teal)]">
              {`${props.status}`}
            </h1>
            <p className="font-display text-3xl font-semibold text-[var(--ink)] md:text-5xl">
              {props.title}
            </p>
            <div className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[var(--ink-muted)] md:mx-0">
              {props.subTitle}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
