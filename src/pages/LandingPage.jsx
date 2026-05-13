import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, GitCompare, History, Layers, Zap } from "lucide-react";
import logo from "../assets/logo.png";
import screenshot from "../assets/screenshot.png";
import { LoginDialog } from "../components/auth/LoginDialog";

const features = [
  {
    icon: GitCompare,
    title: "Side-by-side JSON diff",
    description:
      "Paste two JSON payloads and instantly see every addition, deletion, and change highlighted inline.",
  },
  {
    icon: Zap,
    title: "Pinpoint differences",
    description:
      "Drill into nested objects and arrays. Each differing line links to a detailed breakdown so nothing slips through.",
  },
  {
    icon: History,
    title: "Version history",
    description:
      "Save source and target snapshots against a compare. Revisit any prior state without losing context.",
  },
  {
    icon: Layers,
    title: "Collections",
    description:
      "Group related compares into collections. Keep your API contracts organised and easy to find.",
  },
];

const NODES = [
  { x: 80,   y: 110, method: "GET",    route: "/users" },
  { x: 340,  y: 58,  method: "POST",   route: "/auth" },
  { x: 640,  y: 105, method: "GET",    route: "/orders" },
  { x: 960,  y: 55,  method: "PUT",    route: "/config" },
  { x: 1150, y: 145, method: "GET",    route: "/meta" },
  { x: 170,  y: 305, method: "DELETE", route: "/cache" },
  { x: 460,  y: 265, method: "PATCH",  route: "/items" },
  { x: 760,  y: 295, method: "POST",   route: "/events" },
  { x: 1090, y: 315, method: "GET",    route: "/health" },
  { x: 290,  y: 490, method: "GET",    route: "/logs" },
  { x: 580,  y: 465, method: "POST",   route: "/data" },
  { x: 880,  y: 490, method: "GET",    route: "/stats" },
  { x: 1155, y: 510, method: "PATCH",  route: "/schema" },
];

const EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [1, 6], [2, 7], [3, 8], [4, 8],
  [5, 6], [6, 7], [7, 8],
  [5, 9], [6, 10], [7, 11], [8, 12],
  [9, 10], [10, 11], [11, 12],
  [1, 7], [6, 11],
];

const CSS_ANIMATIONS = `
  @keyframes bta-dash { to { stroke-dashoffset: -10; } }
  @keyframes bta-travel {
    from { offset-distance: 0%; opacity: 0; }
    6%   { opacity: 0.85; }
    94%  { opacity: 0.85; }
    to   { offset-distance: 100%; opacity: 0; }
  }
  @keyframes bta-pulse {
    0%, 100% { transform: scale(1); opacity: 0.4; }
    55%      { transform: scale(2.6); opacity: 0; }
  }
`;

function ApiConnectorBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-50"
    >
      <svg
        className="h-full w-full"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1200 620"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>{CSS_ANIMATIONS}</style>
          <pattern height="48" id="bg-dots" patternUnits="userSpaceOnUse" width="48">
            <circle cx="24" cy="24" fill="#94a3b8" r="1" />
          </pattern>
        </defs>

        <rect fill="url(#bg-dots)" height="100%" opacity="0.18" width="100%" />

        {/* Edge lines — CSS dash-flow animation */}
        {EDGES.map(([a, b], i) => (
          <path
            d={`M ${NODES[a].x},${NODES[a].y} L ${NODES[b].x},${NODES[b].y}`}
            key={i}
            stroke="#8D6EFA"
            strokeDasharray="5 5"
            strokeOpacity="0.28"
            strokeWidth="1"
            style={{
              animation: `bta-dash ${1.6 + (i % 7) * 0.35}s linear infinite`,
            }}
          />
        ))}

        {/* Traveling packets — CSS motion path */}
        {EDGES.map(([a, b], i) => (
          <circle
            fill="#a78bfa"
            key={i}
            r="2.5"
            style={{
              offsetPath: `path('M ${NODES[a].x},${NODES[a].y} L ${NODES[b].x},${NODES[b].y}')`,
              animation: `bta-travel ${2.4 + (i % 6) * 0.45}s linear ${((i * 0.41) % 2.5).toFixed(2)}s infinite`,
            }}
          />
        ))}

        {/* Nodes */}
        {NODES.map((n, i) => (
          <g key={i}>
            {/* Pulse ring — CSS scale animation */}
            <circle
              cx={n.x}
              cy={n.y}
              fill="none"
              r="8"
              stroke="#8D6EFA"
              strokeWidth="1"
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                animation: `bta-pulse 2.8s ease-out ${((i * 0.28) % 2.5).toFixed(2)}s infinite`,
              }}
            />
            {/* Core dot */}
            <circle
              cx={n.x}
              cy={n.y}
              fill="#f5f3ff"
              r="5"
              stroke="#8D6EFA"
              strokeOpacity="0.7"
              strokeWidth="1.5"
            />
            {/* Method label */}
            <text
              dominantBaseline="auto"
              fill="#7c3aed"
              fontFamily="ui-monospace, monospace"
              fontSize="8"
              fontWeight="700"
              opacity="0.6"
              textAnchor="middle"
              x={n.x}
              y={n.y - 12}
            >
              {n.method}
            </text>
            {/* Route label */}
            <text
              dominantBaseline="hanging"
              fill="#71717a"
              fontFamily="ui-monospace, monospace"
              fontSize="7.5"
              opacity="0.55"
              textAnchor="middle"
              x={n.x}
              y={n.y + 10}
            >
              {n.route}
            </text>
          </g>
        ))}
      </svg>

      <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-b from-transparent to-white" />
    </div>
  );
}

function CtaButton({ className, label, onOpen, session }) {
  if (session) {
    return (
      <Link className={className} to="/collections">
        {label}
        <ArrowRight aria-hidden="true" size={15} />
      </Link>
    );
  }
  return (
    <button className={className} onClick={onOpen} type="button">
      {label}
      <ArrowRight aria-hidden="true" size={15} />
    </button>
  );
}

export function LandingPage({ session }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const ctaLabel = session ? "Go to app" : "Get started free";

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      {loginOpen ? (
        <LoginDialog onClose={() => setLoginOpen(false)} />
      ) : null}

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-zinc-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <img alt="Who Changed the Response" className="h-20 w-auto object-contain" src={logo} />
          <CtaButton label={session ? "Go to app" : "Sign in"} onOpen={() => setLoginOpen(true)} session={session} className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800" />
        </div>
      </header>

      {/* Hero + screenshot share the animated background */}
      <div className="relative">
        <ApiConnectorBackground />

        {/* Hero */}
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            JSON comparison, simplified
          </div>

          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-zinc-950 sm:text-6xl">
            Stop guessing{" "}
            <span className="text-violet-600">who broke the API</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-500">
            Compare JSON responses side-by-side, track changes across versions,
            and pinpoint exactly what shifted between releases — in seconds.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <CtaButton label={ctaLabel} onOpen={() => setLoginOpen(true)} session={session} className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-zinc-800" />
            {!session && (
              <p className="text-sm text-zinc-400">Free · No credit card required</p>
            )}
          </div>
        </section>

        {/* Demo screenshot */}
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-2xl shadow-zinc-200">
            <div className="flex items-center gap-1.5 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-zinc-300" />
              <span className="h-3 w-3 rounded-full bg-zinc-300" />
              <span className="h-3 w-3 rounded-full bg-zinc-300" />
            </div>
            <img
              alt="Who Changed the Response app screenshot"
              className="w-full object-cover object-top"
              src={screenshot}
            />
          </div>
        </section>
      </div>

      {/* Features */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
              Everything you need to debug faster
            </h2>
            <p className="mt-3 text-base text-zinc-500">
              Built for developers who spend too long reading raw JSON diffs.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ description, icon: Icon, title }) => (
              <div
                className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
                key={title}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
                  <Icon aria-hidden="true" className="text-violet-600" size={20} />
                </div>
                <h3 className="mt-4 font-semibold text-zinc-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner — only shown to unauthenticated visitors */}
      {!session ? (
        <section className="bg-zinc-950 py-20">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-3xl font-bold text-white">
              Ready to see who changed the response?
            </h2>
            <p className="mt-4 text-base text-zinc-400">
              Sign in with Google and start comparing in under a minute.
            </p>
            <div className="mt-8 flex justify-center">
              <CtaButton label="Get started free" onOpen={() => setLoginOpen(true)} session={session} className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-violet-400" />
            </div>
          </div>
        </section>
      ) : null}

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs text-zinc-400">
          &copy; {new Date().getFullYear()} Who Changed the Response
        </div>
      </footer>
    </div>
  );
}
