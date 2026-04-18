import { Card } from "@heroui/react";
import { APP_NAME } from "../config/app";

const LOGO_SRC = "/images/waway_logo_transparent.png";

export function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="auth-container">
      <Card className="auth-card" variant="tertiary">
        <Card.Content className="auth-card-grid">
          <section className="auth-side-panel">
            <img src={LOGO_SRC} alt={APP_NAME} className="auth-side-logo" />
          </section>

          <section className="auth-form-panel">
            <div className="auth-header">
              <Card.Title className="card-title">{title}</Card.Title>
              <Card.Description className="card-description">
                {subtitle}
              </Card.Description>
            </div>
            {children}
          </section>
        </Card.Content>
      </Card>
    </main>
  );
}
