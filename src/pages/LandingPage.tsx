import { TestForgeIcon } from "../components/ui/TestForgeLogo";
import { FloatingShapes3D } from "../components/ui/FloatingShapes3D";
import { FeatureIcon3D } from "../components/ui/Icons3D";

interface LandingPageProps {
  onGetStarted: () => void;
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center card-3d rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid color-mix(in srgb, " + color + " 15%, transparent)" }}>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{label}</p>
    </div>
  );
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Nav */}
      <nav className="relative flex items-center justify-between px-6 py-4 lg:px-12" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2.5">
          <TestForgeIcon size="sm" />
          <span className="text-lg font-bold gradient-text-rainbow">TestForge</span>
        </div>
        <button onClick={onGetStarted} className="btn-primary px-5 py-2 text-sm font-semibold" style={{ background: "var(--gradient-rainbow)" }}>
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <FloatingShapes3D />

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28 lg:px-12 text-center">
          <div className="card-3d inline-flex mb-6">
            <span className="badge badge-rose" style={{ padding: "0.25rem 1rem", fontSize: "0.75rem" }}>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                AI-Powered QA Automation
              </span>
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-tight text-3d" style={{ color: "var(--text-primary)" }}>
            Forge
            <br />
            <span className="gradient-text-rainbow text-3d-rainbow">Production-Ready</span>
            <br />
            Test Cases
          </h1>

          <p className="mt-8 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            TestForge leverages LLMs and RAG to parse specifications, generate comprehensive test matrices, and export automation scripts — all from a single workspace.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onGetStarted} className="btn-primary px-10 py-4 text-base font-semibold card-3d" style={{ background: "var(--gradient-rainbow)" }}>
              Get Started Free
            </button>
            <button onClick={onGetStarted} className="btn-secondary px-10 py-4 text-base font-semibold card-3d" style={{ borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)" }}>
              Watch Demo
            </button>
          </div>

          <div className="mt-20 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <StatCard value="50K+" label="Test Cases" color="var(--accent-cyan)" />
            <StatCard value="99.9%" label="Uptime SLA" color="var(--accent-emerald)" />
            <StatCard value="6" label="AI Providers" color="var(--accent-violet)" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-6xl mx-auto px-6 pb-28 lg:px-12">
        <div className="text-center mb-16">
          <span className="badge badge-violet mb-4">Core Capabilities</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-3d" style={{ color: "var(--text-primary)" }}>
            Everything your QA team needs
          </h2>
          <p className="mt-3 text-lg" style={{ color: "var(--text-secondary)" }}>
            From requirement parsing to script generation — one seamless pipeline.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "RAG Knowledge Base",
              desc: "Upload PDFs, DOCX, images, or connect SharePoint. Documents are vectorized and matched to every generation request.",
              color: "var(--accent-cyan)",
              iconType: "knowledge" as const,
            },
            {
              title: "Multi-Provider AI",
              desc: "Choose from OpenAI, Gemini, Claude, Groq, OpenRouter, or OpenCode. Switch providers without changing your workflow.",
              color: "var(--accent-rose)",
              iconType: "ai" as const,
            },
            {
              title: "Automation Scripts",
              desc: "Export test cases as Playwright, Cypress, Selenium, or Puppeteer scripts in JavaScript, TypeScript, Python, Java, or C#.",
              color: "var(--accent-emerald)",
              iconType: "code" as const,
            },
            {
              title: "Export & Reporting",
              desc: "Download test matrices as Excel or PDF. Share structured QA documentation with your team instantly.",
              color: "var(--accent-violet)",
              iconType: "export" as const,
            },
            {
              title: "Secure Credential Storage",
              desc: "API keys are encrypted with AES-256-GCM and stored securely. Your credentials never leave your control.",
              color: "var(--accent-amber)",
              iconType: "shield" as const,
            },
            {
              title: "Generation History",
              desc: "Every test matrix is saved. Search, review, and reload previous generations without losing context.",
              color: "var(--accent-cyan)",
              iconType: "history" as const,
            },
          ].map((feature) => (
            <div key={feature.title} className="card-3d rounded-xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
              <div className="card-3d-icon flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "color-mix(in srgb, " + feature.color + " 12%, transparent)", color: feature.color }}>
                <FeatureIcon3D size={24} type={feature.iconType} />
              </div>
              <h3 className="mt-5 text-lg font-bold" style={{ color: "var(--text-primary)" }}>{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-5xl mx-auto px-6 pb-28 lg:px-12">
        <div className="relative overflow-hidden rounded-xl p-12 lg:p-16 text-center gradient-border" style={{ background: "var(--bg-card)" }}>
          <FloatingShapes3D />
          <span className="badge badge-cyan mb-4 relative">Ready to get started?</span>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-3d relative" style={{ color: "var(--text-primary)" }}>
            Start generating test cases in minutes
          </h2>
          <p className="mt-4 text-lg max-w-xl mx-auto relative" style={{ color: "var(--text-secondary)" }}>
            No credit card required. Connect your preferred AI provider and start generating production-ready QA matrices immediately.
          </p>
          <button onClick={onGetStarted} className="btn-primary mt-8 px-10 py-4 text-base font-semibold card-3d relative" style={{ background: "var(--gradient-rainbow)" }}>
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 py-8 lg:px-12" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TestForgeIcon size="sm" />
            <span className="text-sm font-semibold gradient-text-rainbow">TestForge</span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            &copy; {new Date().getFullYear()} TestForge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
