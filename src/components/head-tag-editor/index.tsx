import { Helmet } from 'react-helmet-async';

type HeadTagEditorProps = {
  googleAnalyticsId?: string;
};

/**
 * Renders the head tag editor component.
 *
 * @param {HeadTagEditorProps} googleAnalyticsId - The Google Analytics ID.
 * @return {React.ReactElement} The head tag editor component.
 */
const HeadTagEditor: React.FC<HeadTagEditorProps> = ({
  googleAnalyticsId,
}) => {
  return (
    <Helmet>
      <meta
        name="theme-color"
        content={'#000000'}
      />
      {googleAnalyticsId && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
          ></script>
          <script>
            {`window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', '${googleAnalyticsId}');
`}
          </script>
        </>
      )}
    </Helmet>
  );
};

export default HeadTagEditor;
