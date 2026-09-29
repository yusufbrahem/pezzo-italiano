import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

// Third-party trackers (GA4 + Microsoft Clarity).
//
// Their libraries load with strategy "lazyOnload" — after the page's load
// event, when the browser is idle — instead of competing with the site's own
// JS during startup (Lighthouse: ~1.5 s of main-thread time on a mid-range
// phone). Nothing is lost: GA's tiny init snippet below still runs early and
// defines `window.gtag`/`dataLayer`, so page_view and any track.* event fired
// before gtag.js arrives are queued and sent once it loads. Clarity's snippet
// is itself a queueing stub, so it can simply load late as a whole.
export default function Analytics() {
  return (
    <>
      {GA_ID && (
        <>
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA_ID}');`}
          </Script>
          <Script id="ga-lib" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
        </>
      )}
      {CLARITY_ID && (
        <Script id="microsoft-clarity" strategy="lazyOnload">
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window,document,"clarity","script","${CLARITY_ID}");`}
        </Script>
      )}
    </>
  );
}
