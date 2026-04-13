import { Link } from 'react-router-dom'

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__header">
          <div className="auth__brand">
            <div className="brand__mark" aria-hidden="true">
              RR
            </div>
            <div>
              <div className="auth__title">{title}</div>
              <div className="auth__subtitle">{subtitle}</div>
            </div>
          </div>
        </div>

        {children}

        <div className="auth__footer">
          <span className="muted">
            Solo correo <code>@educa.madrid.org</code>
          </span>
          <Link className="link" to="/">
            Ir a la app
          </Link>
        </div>
      </div>
    </div>
  )
}

