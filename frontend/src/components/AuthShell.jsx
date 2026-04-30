import { HeartPulse } from "lucide-react";
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
            <span>HeartLink</span>
          </div>
          <h1>HeartLink Chat</h1>
          <p>{subtitle}</p>
        </div>

        <div className="auth-visual" aria-hidden="true">
          <div className="visual-rings">
            <span />
            <span />
            <span />
          </div>
          <div className="visual-pulse">
            <HeartPulse size={64} />
          </div>
          <div className="visual-heartline" />
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
