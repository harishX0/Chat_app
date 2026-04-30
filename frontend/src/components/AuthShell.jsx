import { HeartPulse, ShieldCheck, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthShell({
  title,
  subtitle,
  supportingText,
  footerLink,
  footerLabel,
  footerText,
  children,
}) {
  return (
    <div className="auth-shell">
      <section className="auth-panel auth-panel-brand">
        <div>
          <div className="brand-badge">
            <HeartPulse size={16} />
            <span>Real-time chat for focused teams</span>
          </div>
          <h1>HeartLink Chat</h1>
          <p>{subtitle}</p>
        </div>

        <div className="auth-visual" aria-hidden="true">
          <div className="visual-header">
            <span />
            <span />
            <span />
          </div>
          <div className="visual-thread">
            <div className="visual-message incoming">
              <span>Maya</span>
              <strong>Can you review the latest update?</strong>
            </div>
            <div className="visual-message outgoing">
              <span>You</span>
              <strong>Done. Sending notes now.</strong>
            </div>
            <div className="visual-heartline" />
          </div>
        </div>

        <div className="brand-grid">
          <article>
            <HeartPulse size={18} />
            <span>Live presence</span>
            <strong>Know who is online before you type.</strong>
          </article>
          <article>
            <Zap size={18} />
            <span>Fast delivery</span>
            <strong>Socket-powered messages with typing and seen states.</strong>
          </article>
          <article>
            <ShieldCheck size={18} />
            <span>Clean flow</span>
            <strong>Designed to feel familiar on phone and desktop.</strong>
          </article>
        </div>
      </section>

      <section className="auth-panel auth-panel-form">
        <div className="auth-heading">
          <span className="eyebrow">Welcome</span>
          <h2>{title}</h2>
          <p>{supportingText}</p>
        </div>

        {children}

        <p className="auth-footer">
          {footerLabel} <Link to={footerLink}>{footerText}</Link>
        </p>
      </section>
    </div>
  );
}
