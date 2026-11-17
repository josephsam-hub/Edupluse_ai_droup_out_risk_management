import { useState, useEffect, useRef } from 'react';
import {
  BrainCircuit,
  Brain,
  Activity,
  BarChart3,
  Lightbulb,
  Bell,
  Heart,
  Users,
  Shield,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  BookOpen,
  Zap,
  Mail,
  Menu,
  X,
} from 'lucide-react';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const C = {
  navy:    '#142B4A',
  navyDark:'#0D1E35',
  royal:   '#356AE6',
  royalHov:'#2558D4',
  teal:    '#14B8A6',
  bg:      '#F5F7FB',
  white:   '#FFFFFF',
  muted:   '#64748B',
  border:  '#E2E8F0',
  purple:  '#8B5CF6',
  orange:  '#F59E0B',
  red:     '#EF4444',
  green:   '#10B981',
};

// ─── Keyframe injection ───────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes fadeInUp   { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeInLeft { from { opacity:0; transform:translateX(-32px); } to { opacity:1; transform:translateX(0); } }
  @keyframes fadeInRight{ from { opacity:0; transform:translateX(32px); } to { opacity:1; transform:translateX(0); } }
  @keyframes float      { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-10px); } }
  @keyframes pulse      { 0%,100% { opacity:1; } 50% { opacity:.6; } }
  @keyframes countUp    { from { opacity:0; transform:scale(.8); } to { opacity:1; transform:scale(1); } }
  @keyframes shimmer    { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
  @keyframes spin       { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }

  * { box-sizing:border-box; margin:0; padding:0; }
  html { scroll-behavior:smooth; }
  body { font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

  .nav-link {
    position:relative;
    color:#CBD5E1;
    text-decoration:none;
    font-size:14px;
    font-weight:500;
    padding:4px 0;
    transition:color .2s;
  }
  .nav-link::after {
    content:'';
    position:absolute;
    bottom:-2px; left:0;
    width:0; height:2px;
    background:${C.teal};
    transition:width .25s ease;
  }
  .nav-link:hover { color:${C.white}; }
  .nav-link:hover::after { width:100%; }

  .feature-card {
    background:${C.white};
    border:1px solid ${C.border};
    border-radius:16px;
    padding:28px;
    transition:transform .25s ease, box-shadow .25s ease, border-color .25s ease;
    cursor:default;
  }
  .feature-card:hover {
    transform:translateY(-6px);
    box-shadow:0 20px 40px rgba(20,43,74,.12);
    border-color:transparent;
  }

  .step-card {
    background:${C.white};
    border:1px solid ${C.border};
    border-radius:16px;
    padding:24px;
    transition:transform .2s ease, box-shadow .2s ease;
  }
  .step-card:hover { transform:translateY(-4px); box-shadow:0 16px 32px rgba(20,43,74,.1); }

  .stat-card {
    background:rgba(255,255,255,.08);
    border:1px solid rgba(255,255,255,.15);
    border-radius:16px;
    padding:20px 24px;
    backdrop-filter:blur(8px);
    transition:background .2s, transform .2s;
    animation: float 4s ease-in-out infinite;
  }
  .stat-card:nth-child(2) { animation-delay:.5s; }
  .stat-card:nth-child(3) { animation-delay:1s; }
  .stat-card:nth-child(4) { animation-delay:1.5s; }
  .stat-card:hover {
    background:rgba(255,255,255,.14);
    transform:translateY(-4px) scale(1.02);
  }

  .btn-primary {
    display:inline-flex; align-items:center; gap:8px;
    background:${C.royal};
    color:${C.white};
    border:none;
    border-radius:10px;
    padding:13px 26px;
    font-size:15px;
    font-weight:600;
    cursor:pointer;
    transition:background .2s, transform .15s, box-shadow .2s;
    text-decoration:none;
    box-shadow:0 4px 16px rgba(53,106,230,.35);
  }
  .btn-primary:hover { background:${C.royalHov}; transform:translateY(-2px); box-shadow:0 8px 24px rgba(53,106,230,.45); }

  .btn-secondary {
    display:inline-flex; align-items:center; gap:8px;
    background:transparent;
    color:${C.white};
    border:2px solid rgba(255,255,255,.45);
    border-radius:10px;
    padding:11px 26px;
    font-size:15px;
    font-weight:600;
    cursor:pointer;
    transition:border-color .2s, background .2s, transform .15s;
    text-decoration:none;
  }
  .btn-secondary:hover { border-color:${C.white}; background:rgba(255,255,255,.08); transform:translateY(-2px); }

  .btn-outline-nav {
    display:inline-flex; align-items:center;
    background:transparent;
    color:${C.white};
    border:1.5px solid rgba(255,255,255,.4);
    border-radius:8px;
    padding:7px 18px;
    font-size:13px;
    font-weight:600;
    cursor:pointer;
    transition:border-color .2s, background .2s;
    text-decoration:none;
  }
  .btn-outline-nav:hover { border-color:${C.white}; background:rgba(255,255,255,.08); }

  .btn-filled-nav {
    display:inline-flex; align-items:center;
    background:${C.royal};
    color:${C.white};
    border:none;
    border-radius:8px;
    padding:8px 20px;
    font-size:13px;
    font-weight:600;
    cursor:pointer;
    transition:background .2s, transform .15s;
    text-decoration:none;
  }
  .btn-filled-nav:hover { background:${C.royalHov}; transform:translateY(-1px); }

  .about-stat-card {
    background:${C.white};
    border:1px solid ${C.border};
    border-radius:16px;
    padding:28px 32px;
    text-align:center;
    transition:transform .2s, box-shadow .2s;
  }
  .about-stat-card:hover { transform:translateY(-4px); box-shadow:0 16px 32px rgba(20,43,74,.1); }

  .contact-link {
    color:${C.royal};
    text-decoration:none;
    font-weight:500;
    transition:color .2s;
  }
  .contact-link:hover { color:${C.teal}; text-decoration:underline; }

  @media (max-width:768px) {
    .hero-grid { grid-template-columns:1fr !important; }
    .features-grid { grid-template-columns:1fr 1fr !important; }
    .steps-grid { grid-template-columns:1fr 1fr !important; }
    .about-stats-row { grid-template-columns:1fr !important; }
    .hero-heading { font-size:32px !important; }
    .section-heading { font-size:28px !important; }
    .stat-panel { margin-top:40px; }
    .desktop-nav { display:none !important; }
    .mobile-menu-btn { display:flex !important; }
  }
  @media (max-width:500px) {
    .features-grid { grid-template-columns:1fr !important; }
    .steps-grid   { grid-template-columns:1fr !important; }
  }
`;

// ─── Utility ──────────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ─── Components ───────────────────────────────────────────────────────────────

function Badge({ children }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      background:`rgba(53,106,230,.12)`,
      color: C.royal,
      border:`1px solid rgba(53,106,230,.25)`,
      borderRadius:999,
      padding:'5px 14px',
      fontSize:12,
      fontWeight:700,
      letterSpacing:'.5px',
      textTransform:'uppercase',
      marginBottom:16,
    }}>
      <Zap size={12} />
      {children}
    </span>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ onNavigateToLogin }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { label:'Home',         href:'#home' },
    { label:'About',        href:'#about' },
    { label:'Features',     href:'#features' },
    { label:'How It Works', href:'#how-it-works' },
    { label:'Contact',      href:'#contact' },
  ];

  return (
    <header style={{
      position:'fixed', top:0, left:0, right:0,
      zIndex:1000,
      background: scrolled ? 'rgba(13,30,53,.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,.08)' : '1px solid transparent',
      transition:'all .3s ease',
    }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', height:68, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        {/* Logo */}
        <a href="#home" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div style={{
            background:`linear-gradient(135deg, ${C.royal}, ${C.teal})`,
            borderRadius:10, padding:7, display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <BrainCircuit size={20} color={C.white} />
          </div>
          <span style={{ color:C.white, fontWeight:800, fontSize:18, letterSpacing:'-.3px' }}>
            EduPulse <span style={{ color:C.teal }}>AI</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="desktop-nav" style={{ display:'flex', alignItems:'center', gap:28 }}>
          {links.map(l => (
            <a key={l.label} href={l.href} className="nav-link">{l.label}</a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="desktop-nav" style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button className="btn-outline-nav" onClick={onNavigateToLogin}>Login</button>
          <button className="btn-filled-nav"  onClick={onNavigateToLogin}>Get Started</button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(o => !o)}
          style={{
            display:'none', alignItems:'center', justifyContent:'center',
            background:'rgba(255,255,255,.08)', border:'none', borderRadius:8,
            padding:8, cursor:'pointer', color:C.white,
          }}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          background:'rgba(13,30,53,.97)', backdropFilter:'blur(16px)',
          borderTop:'1px solid rgba(255,255,255,.08)',
          padding:'16px 24px 24px',
        }}>
          {links.map(l => (
            <a
              key={l.label} href={l.href} className="nav-link"
              onClick={() => setMobileOpen(false)}
              style={{ display:'block', padding:'11px 0', borderBottom:'1px solid rgba(255,255,255,.07)', fontSize:15 }}
            >
              {l.label}
            </a>
          ))}
          <div style={{ display:'flex', gap:12, marginTop:20 }}>
            <button className="btn-outline-nav" style={{ flex:1, justifyContent:'center' }} onClick={onNavigateToLogin}>Login</button>
            <button className="btn-filled-nav"  style={{ flex:1, justifyContent:'center' }} onClick={onNavigateToLogin}>Get Started</button>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
// cleaner approach — define stats as plain objects
const heroStats = [
  { color:C.teal,              value:'94.2%',  label:'Model Accuracy',            Icon: TrendingUp },
  { color:C.royal,             value:'1,247',  label:'Students Monitored',        Icon: Users      },
  { color:'#A78BFA',           value:'89',     label:'At-Risk Students Identified',Icon: Shield    },
  { color:C.orange,            value:'23',     label:'Interventions This Month',  Icon: Bell       },
];

function HeroStatCard({ stat, delay }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), delay); return () => clearTimeout(t); }, [delay]);
  const { color, value, label, Icon } = stat;
  return (
    <div className="stat-card" style={{ opacity: mounted ? 1 : 0, transition:'opacity .4s ease', animationDelay:`${delay}ms` }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
        <div style={{ background:`${color}22`, borderRadius:8, padding:7 }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ color:'rgba(255,255,255,.65)', fontSize:12, fontWeight:500 }}>{label}</span>
      </div>
      <div style={{ color:C.white, fontSize:28, fontWeight:800, letterSpacing:'-.5px', animation:`countUp .6s ease ${delay}ms both` }}>
        {value}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6 }}>
        <span style={{ width:6, height:6, background:color, borderRadius:999, animation:'pulse 2s infinite' }} />
        <span style={{ color:color, fontSize:11, fontWeight:600 }}>Live</span>
      </div>
    </div>
  );
}

function Hero({ onNavigateToLogin }) {
  const [ref, inView] = useInView(0.1);
  return (
    <section id="home" ref={ref} style={{
      background:`linear-gradient(135deg, ${C.navyDark} 0%, ${C.navy} 55%, #1a3a63 100%)`,
      minHeight:'100vh',
      display:'flex', alignItems:'center',
      paddingTop:68,
      position:'relative', overflow:'hidden',
    }}>
      {/* Decorative orbs */}
      <div style={{ position:'absolute', top:'10%', left:'5%', width:300, height:300, background:`radial-gradient(circle, rgba(53,106,230,.18) 0%, transparent 70%)`, borderRadius:'50%', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'15%', right:'8%', width:250, height:250, background:`radial-gradient(circle, rgba(20,184,166,.15) 0%, transparent 70%)`, borderRadius:'50%', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:600, height:600, background:`radial-gradient(circle, rgba(53,106,230,.06) 0%, transparent 65%)`, borderRadius:'50%', pointerEvents:'none' }} />

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'80px 24px', width:'100%' }}>
        <div className="hero-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>

          {/* Left copy */}
          <div style={{ animation: inView ? 'fadeInLeft .8s ease both' : 'none' }}>
            <Badge>AI-Powered Education Analytics</Badge>
            <h1 className="hero-heading" style={{
              color:C.white,
              fontSize:46,
              fontWeight:900,
              lineHeight:1.15,
              letterSpacing:'-1px',
              marginBottom:20,
            }}>
              Predict Early.{' '}
              <span style={{ color:C.teal }}>Support Better.</span>
              <br />
              Shape Brighter Futures.
            </h1>
            <p style={{ color:'rgba(255,255,255,.72)', fontSize:17, lineHeight:1.75, marginBottom:36, maxWidth:520 }}>
              EduPulse AI uses Machine Learning and student engagement analytics to identify dropout risks,
              understand student behaviour and help educators provide timely, meaningful support.
            </p>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
              <button className="btn-primary" onClick={onNavigateToLogin}>
                Get Started <ArrowRight size={16} />
              </button>
              <a href="#features" className="btn-secondary">
                Explore Features <ChevronRight size={16} />
              </a>
            </div>

            {/* Trust badges */}
            <div style={{ display:'flex', gap:20, marginTop:40, flexWrap:'wrap' }}>
              {['ML-Powered Predictions','Real-Time Monitoring','Privacy Compliant'].map(t => (
                <div key={t} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <CheckCircle size={15} color={C.teal} />
                  <span style={{ color:'rgba(255,255,255,.65)', fontSize:13, fontWeight:500 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right stats panel */}
          <div className="stat-panel" style={{ animation: inView ? 'fadeInRight .9s .15s ease both' : 'none', opacity: inView ? 1 : 0 }}>
            {/* Panel frame */}
            <div style={{
              background:'rgba(255,255,255,.04)',
              border:'1px solid rgba(255,255,255,.12)',
              borderRadius:24,
              padding:28,
              backdropFilter:'blur(12px)',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
                <div>
                  <div style={{ color:C.white, fontWeight:700, fontSize:16 }}>Dashboard Overview</div>
                  <div style={{ color:'rgba(255,255,255,.45)', fontSize:12, marginTop:2 }}>Live Analytics · Updated now</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  {['#EF4444','#F59E0B','#10B981'].map(c => (
                    <div key={c} style={{ width:10, height:10, borderRadius:'50%', background:c }} />
                  ))}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {heroStats.map((s, i) => (
                  <HeroStatCard key={s.label} stat={s} delay={300 + i * 150} />
                ))}
              </div>

              {/* Mini chart bar */}
              <div style={{ marginTop:22, background:'rgba(255,255,255,.04)', borderRadius:12, padding:'14px 16px' }}>
                <div style={{ color:'rgba(255,255,255,.55)', fontSize:11, fontWeight:600, marginBottom:10, textTransform:'uppercase', letterSpacing:'.5px' }}>Risk Distribution</div>
                <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:48 }}>
                  {[65,45,30,55,70,40,80,60,35,75,50,85].map((h, i) => (
                    <div key={i} style={{
                      flex:1,
                      height:`${h}%`,
                      background: h > 65
                        ? `linear-gradient(to top, ${C.teal}, rgba(20,184,166,.4))`
                        : `linear-gradient(to top, ${C.royal}, rgba(53,106,230,.4))`,
                      borderRadius:'3px 3px 0 0',
                      transition:'height .3s ease',
                    }} />
                  ))}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                  <span style={{ color:'rgba(255,255,255,.35)', fontSize:10 }}>Jan</span>
                  <span style={{ color:'rgba(255,255,255,.35)', fontSize:10 }}>Dec</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── FEATURES ─────────────────────────────────────────────────────────────────
const features = [
  { Icon:Brain,    color:C.royal,  bg:`rgba(53,106,230,.1)`,  title:'AI-Powered Dropout Prediction',     desc:'Advanced ML models analyse behavioural and academic patterns to predict dropout risk with over 94% accuracy.' },
  { Icon:Activity, color:C.teal,   bg:`rgba(20,184,166,.1)`,  title:'Student Engagement Monitoring',     desc:'Track participation, login frequency, assignment submissions and forum activity in real time.' },
  { Icon:BarChart3,color:'#8B5CF6',bg:'rgba(139,92,246,.1)',  title:'Academic Performance Analytics',    desc:'Visualise GPA trends, grade trajectories and performance benchmarks across cohorts and semesters.' },
  { Icon:Lightbulb,color:C.orange, bg:'rgba(245,158,11,.1)',  title:'Explainable AI Insights',           desc:'Understand exactly why a student is flagged at risk with SHAP-based feature attribution and readable reports.' },
  { Icon:Bell,     color:C.red,    bg:'rgba(239,68,68,.1)',   title:'Early Warning Notifications',       desc:'Automated alerts notify educators the moment a student crosses a risk threshold, enabling timely outreach.' },
  { Icon:Heart,    color:'#10B981',bg:'rgba(16,185,129,.1)', title:'Personalized Student Support',       desc:'Generate tailored intervention plans per student based on individual risk factors and learning history.' },
];

function Features() {
  const [ref, inView] = useInView();
  return (
    <section id="features" ref={ref} style={{ background:C.bg, padding:'96px 24px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:60, animation: inView ? 'fadeInUp .7s ease both' : 'none', opacity: inView ? 1 : 0 }}>
          <Badge>Platform Features</Badge>
          <h2 className="section-heading" style={{ color:C.navy, fontSize:36, fontWeight:800, letterSpacing:'-.5px', marginBottom:14 }}>
            Everything You Need to Protect Student Success
          </h2>
          <p style={{ color:C.muted, fontSize:17, maxWidth:580, margin:'0 auto', lineHeight:1.7 }}>
            A complete suite of intelligent tools built specifically for educators, advisors and institutional administrators.
          </p>
        </div>

        <div className="features-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:24 }}>
          {features.map(({ Icon, color, bg, title, desc }, i) => (
            <div
              key={title}
              className="feature-card"
              style={{ animation: inView ? `fadeInUp .6s ${.1 * i}s ease both` : 'none', opacity: inView ? 1 : 0 }}
            >
              <div style={{ width:52, height:52, background:bg, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                <Icon size={24} color={color} />
              </div>
              <h3 style={{ color:C.navy, fontSize:17, fontWeight:700, marginBottom:10, lineHeight:1.3 }}>{title}</h3>
              <p style={{ color:C.muted, fontSize:14, lineHeight:1.7 }}>{desc}</p>
              <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:16, color, fontSize:13, fontWeight:600, cursor:'default' }}>
                Learn more <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
const steps = [
  { num:1, Icon:BookOpen,   color:C.royal,  title:'Collect Data',          desc:'Gather student academic records, LMS interaction logs, attendance, and engagement metrics from integrated institutional systems.' },
  { num:2, Icon:BarChart3,  color:C.teal,   title:'Analyse with ML',       desc:'Preprocess and engineer features through automated pipelines, then feed cleaned data into trained classification and regression models.' },
  { num:3, Icon:Brain,      color:'#8B5CF6',title:'Predict Risk',          desc:'Generate per-student dropout risk scores, confidence intervals, and contributing factor breakdowns using ensemble ML methods.' },
  { num:4, Icon:Shield,     color:'#10B981',title:'Enable Intervention',   desc:'Equip teachers and advisors with actionable dashboards, automated alerts, and personalised support recommendation tools.' },
];

function HowItWorks() {
  const [ref, inView] = useInView();
  return (
    <section id="how-it-works" ref={ref} style={{ background:C.white, padding:'96px 24px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:60, animation: inView ? 'fadeInUp .7s ease both' : 'none', opacity: inView ? 1 : 0 }}>
          <Badge>Process</Badge>
          <h2 className="section-heading" style={{ color:C.navy, fontSize:36, fontWeight:800, letterSpacing:'-.5px', marginBottom:14 }}>
            How EduPulse AI Works
          </h2>
          <p style={{ color:C.muted, fontSize:17, maxWidth:540, margin:'0 auto', lineHeight:1.7 }}>
            A four-stage intelligent pipeline that transforms raw student data into life-changing interventions.
          </p>
        </div>

        <div className="steps-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:20, position:'relative' }}>
          {steps.map(({ num, Icon, color, title, desc }, i) => (
            <div key={title} style={{ position:'relative' }}>
              <div
                className="step-card"
                style={{ height:'100%', animation: inView ? `fadeInUp .6s ${.12*i}s ease both` : 'none', opacity: inView ? 1 : 0 }}
              >
                {/* Number circle */}
                <div style={{
                  width:48, height:48,
                  background:`linear-gradient(135deg, ${color}, ${color}99)`,
                  borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:C.white, fontWeight:800, fontSize:18,
                  marginBottom:16,
                  boxShadow:`0 6px 16px ${color}44`,
                }}>
                  {num}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <Icon size={18} color={color} />
                  <h3 style={{ color:C.navy, fontSize:16, fontWeight:700 }}>{title}</h3>
                </div>
                <p style={{ color:C.muted, fontSize:13.5, lineHeight:1.7 }}>{desc}</p>
              </div>

              {/* Arrow connector */}
              {i < steps.length - 1 && (
                <div style={{
                  position:'absolute',
                  right:-14, top:'30%',
                  zIndex:5,
                  display:'flex', alignItems:'center',
                }}>
                  <div style={{
                    width:28, height:28,
                    background:C.white,
                    border:`2px solid ${C.border}`,
                    borderRadius:'50%',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:'0 2px 8px rgba(0,0,0,.08)',
                  }}>
                    <ChevronRight size={14} color={C.muted} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────
function About() {
  const [ref, inView] = useInView();
  return (
    <section id="about" ref={ref} style={{ background:C.bg, padding:'96px 24px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>

          {/* Text side */}
          <div style={{ animation: inView ? 'fadeInLeft .7s ease both' : 'none', opacity: inView ? 1 : 0 }}>
            <Badge>Why It Matters</Badge>
            <h2 style={{ color:C.navy, fontSize:34, fontWeight:800, letterSpacing:'-.4px', marginBottom:18, lineHeight:1.25 }}>
              Why Early Intervention Matters
            </h2>
            <p style={{ color:C.muted, fontSize:16, lineHeight:1.8, marginBottom:16 }}>
              Student dropout is one of the most critical challenges facing modern education institutions. By the time a student
              disengages visibly, it is often too late for effective intervention. The window for meaningful support is narrow.
            </p>
            <p style={{ color:C.muted, fontSize:16, lineHeight:1.8, marginBottom:24 }}>
              EduPulse AI changes this by predicting risk weeks in advance — before motivation collapses, before grades plummet,
              and before students slip through the cracks. Our ML models surface hidden behavioural signals that human advisors
              simply cannot process at scale.
            </p>
            {[
              'Identifies at-risk students up to 8 weeks before dropout',
              'Reduces advisor caseload with AI-prioritised alerts',
              'Provides explainable, bias-audited predictions',
              'Integrates with existing LMS and SIS infrastructure',
            ].map(point => (
              <div key={point} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:12 }}>
                <CheckCircle size={18} color={C.teal} style={{ flexShrink:0, marginTop:2 }} />
                <span style={{ color:C.navy, fontSize:14.5, fontWeight:500, lineHeight:1.5 }}>{point}</span>
              </div>
            ))}
          </div>

          {/* Stats side */}
          <div style={{ animation: inView ? 'fadeInRight .7s .15s ease both' : 'none', opacity: inView ? 1 : 0 }}>
            <div className="about-stats-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
              <div className="about-stat-card">
                <div style={{ fontSize:40, fontWeight:900, color:C.red, letterSpacing:'-2px', marginBottom:8 }}>30%</div>
                <div style={{ color:C.navy, fontWeight:700, fontSize:14, marginBottom:6 }}>Dropout Without Intervention</div>
                <div style={{ color:C.muted, fontSize:13, lineHeight:1.6 }}>of students leave higher education prematurely when no early support system is in place.</div>
              </div>
              <div className="about-stat-card">
                <div style={{ fontSize:40, fontWeight:900, color:C.teal, letterSpacing:'-2px', marginBottom:8 }}>75%</div>
                <div style={{ color:C.navy, fontWeight:700, fontSize:14, marginBottom:6 }}>Improvement with Early ID</div>
                <div style={{ color:C.muted, fontSize:13, lineHeight:1.6 }}>improvement in retention outcomes when at-risk students are identified and supported within the first 6 weeks.</div>
              </div>
            </div>
            {/* Highlight box */}
            <div style={{
              background:`linear-gradient(135deg, ${C.navy}, #1a3a63)`,
              borderRadius:16, padding:28,
              border:`1px solid rgba(53,106,230,.3)`,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ background:`rgba(20,184,166,.2)`, borderRadius:10, padding:9 }}>
                  <TrendingUp size={22} color={C.teal} />
                </div>
                <span style={{ color:C.white, fontWeight:700, fontSize:16 }}>The EduPulse Advantage</span>
              </div>
              <p style={{ color:'rgba(255,255,255,.72)', fontSize:14, lineHeight:1.75 }}>
                By combining LMS engagement data, historical academic performance, and demographic context,
                EduPulse AI delivers predictions that are both accurate and actionable — giving educators the
                confidence to act decisively and compassionately.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── CONTACT ──────────────────────────────────────────────────────────────────
function Contact() {
  const [ref, inView] = useInView();
  return (
    <section id="contact" ref={ref} style={{ background:C.white, padding:'96px 24px' }}>
      <div style={{ maxWidth:700, margin:'0 auto', textAlign:'center' }}>
        <div style={{ animation: inView ? 'fadeInUp .7s ease both' : 'none', opacity: inView ? 1 : 0 }}>
          <Badge>Contact</Badge>
          <h2 className="section-heading" style={{ color:C.navy, fontSize:34, fontWeight:800, letterSpacing:'-.4px', marginBottom:16 }}>
            Get in Touch
          </h2>
          <p style={{ color:C.muted, fontSize:16, lineHeight:1.75, marginBottom:40 }}>
            Have questions about EduPulse AI? We'd love to hear from you. Reach out and our team will respond promptly.
          </p>

          <div style={{
            background:C.bg,
            border:`1px solid ${C.border}`,
            borderRadius:20,
            padding:40,
            display:'flex', flexDirection:'column', alignItems:'center', gap:20,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ background:`rgba(53,106,230,.1)`, borderRadius:12, padding:12 }}>
                <Mail size={24} color={C.royal} />
              </div>
              <div style={{ textAlign:'left' }}>
                <div style={{ color:C.navy, fontWeight:700, fontSize:14, marginBottom:3 }}>Email Support</div>
                <a href="mailto:support@edupulse.ai" className="contact-link" style={{ fontSize:16 }}>
                  support@edupulse.ai
                </a>
              </div>
            </div>

            <div style={{ width:'100%', height:1, background:C.border }} />

            <div style={{
              background:`rgba(245,158,11,.08)`,
              border:`1px solid rgba(245,158,11,.25)`,
              borderRadius:12,
              padding:'14px 20px',
              display:'flex', alignItems:'flex-start', gap:10,
            }}>
              <BookOpen size={18} color={C.orange} style={{ flexShrink:0, marginTop:2 }} />
              <p style={{ color:'#92400E', fontSize:13.5, lineHeight:1.6, textAlign:'left' }}>
                <strong>University Project Disclaimer:</strong> EduPulse AI is a Machine Learning semester project
                developed for academic purposes. Data used is anonymised and synthetic. This platform is not intended
                for production deployment without institutional oversight and ethics review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({ onNavigateToLogin }) {
  return (
    <footer style={{
      background:C.navyDark,
      borderTop:`1px solid rgba(255,255,255,.07)`,
      padding:'48px 24px 28px',
    }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:40, marginBottom:40 }}>

          {/* Brand */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ background:`linear-gradient(135deg, ${C.royal}, ${C.teal})`, borderRadius:10, padding:7 }}>
                <BrainCircuit size={18} color={C.white} />
              </div>
              <span style={{ color:C.white, fontWeight:800, fontSize:17 }}>EduPulse <span style={{ color:C.teal }}>AI</span></span>
            </div>
            <p style={{ color:'rgba(255,255,255,.45)', fontSize:13.5, lineHeight:1.75, maxWidth:300 }}>
              AI-powered student engagement and dropout risk prediction — helping educators act early and support every learner.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <div style={{ color:C.white, fontWeight:700, fontSize:14, marginBottom:16, textTransform:'uppercase', letterSpacing:'.5px' }}>Quick Links</div>
            {[
              { label:'Features',     href:'#features'    },
              { label:'How It Works', href:'#how-it-works'},
              { label:'About',        href:'#about'       },
              { label:'Contact',      href:'#contact'     },
            ].map(l => (
              <a key={l.label} href={l.href} style={{ display:'block', color:'rgba(255,255,255,.5)', fontSize:13.5, textDecoration:'none', marginBottom:10, transition:'color .2s' }}
                onMouseEnter={e => e.target.style.color = C.teal}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,.5)'}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Account */}
          <div>
            <div style={{ color:C.white, fontWeight:700, fontSize:14, marginBottom:16, textTransform:'uppercase', letterSpacing:'.5px' }}>Account</div>
            {['Login','Get Started','Dashboard'].map(l => (
              <button key={l} onClick={onNavigateToLogin}
                style={{ display:'block', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.5)', fontSize:13.5, marginBottom:10, padding:0, transition:'color .2s', textAlign:'left' }}
                onMouseEnter={e => e.target.style.color = C.teal}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,.5)'}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,.07)', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <span style={{ color:'rgba(255,255,255,.35)', fontSize:12.5 }}>
            © 2024 EduPulse AI. ML Semester Project.
          </span>
          <div style={{ display:'flex', gap:20 }}>
            {['Privacy Policy','Terms of Service'].map(l => (
              <span key={l} style={{ color:'rgba(255,255,255,.35)', fontSize:12.5, cursor:'pointer', transition:'color .2s' }}
                onMouseEnter={e => e.target.style.color = C.teal}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,.35)'}
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── PAGE ROOT ────────────────────────────────────────────────────────────────
export default function LandingPage({ onNavigateToLogin = () => {} }) {
  // Inject global styles once
  useEffect(() => {
    const existing = document.getElementById('edupulse-global-styles');
    if (existing) return;
    const style = document.createElement('style');
    style.id = 'edupulse-global-styles';
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById('edupulse-global-styles');
      if (el) el.remove();
    };
  }, []);

  return (
    <div style={{ fontFamily:"'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Navbar onNavigateToLogin={onNavigateToLogin} />
      <Hero  onNavigateToLogin={onNavigateToLogin} />
      <Features />
      <HowItWorks />
      <About />
      <Contact />
      <Footer onNavigateToLogin={onNavigateToLogin} />
    </div>
  );
}
