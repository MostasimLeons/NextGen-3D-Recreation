import './page.css';

/**
 * A link into another world. Internal hrefs are picked up by the router's
 * link interception, so clicking plays the portal transition from the
 * click point. `large` renders the oversized "next world" version.
 */
export default function PortalLink({ href, label, kicker, large = false, ghost = false }) {
  const cls = ['portal-link', large && 'portal-link--large', ghost && 'portal-link--ghost'].filter(Boolean).join(' ');
  return (
    <a className={cls} href={href} data-reveal={large ? '' : undefined}>
      {kicker && <span className="portal-link__kicker">{kicker}</span>}
      <span className="portal-link__label">{label}</span>
      <span className="portal-link__ring" aria-hidden="true" />
    </a>
  );
}
