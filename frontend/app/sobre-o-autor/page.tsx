"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, Code2, Brain, Users, ExternalLink } from "lucide-react";
import { useI18n } from "../contexts/I18nContext";
import { LanguageSelector } from "../../components/LanguageSelector";
import { UserMenu } from "../../components/UserMenu";

const CSSLogo = () => (
  <div className="flex items-center gap-2 cursor-pointer">
    <Image
      src="/logo_v4.png"
      alt="Ícone Primeiro Olhar"
      width={40}
      height={40}
      className="w-8 h-8 md:w-10 md:h-10 object-contain animate-float"
      priority
    />
    <span className="font-extrabold text-3xl tracking-tight text-slate-800">
      Primeiro<span className="text-blue-500">Olhar</span>
    </span>
  </div>
);

const IconGithub = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const IconLinkedin = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const AuthorAvatar = () => (
  <div className="relative w-32 h-32 mx-auto mb-6">
    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-500/30 border-4 border-white">
      <span className="text-white font-black text-5xl select-none">D</span>
    </div>
    <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-md">
      <Heart className="w-4 h-4 text-white fill-white" />
    </div>
  </div>
);

const TechBadge = ({ label, color }: { label: string; color: string }) => (
  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold border ${color}`}>
    {label}
  </span>
);

export default function SobreOAutorPage() {
  const router = useRouter();
  const { t } = useI18n();

  const techStack = [
    { label: "Python / FastAPI", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Next.js / React", color: "bg-slate-50 text-slate-700 border-slate-200" },
    { label: "React Native / Expo", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    { label: "Google Gemma 4", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "MediaPipe", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { label: "Docker", color: "bg-sky-50 text-sky-700 border-sky-200" },
    { label: "Redis / Celery", color: "bg-rose-50 text-rose-700 border-rose-200" },
    { label: "TypeScript", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Header */}
      <header className="w-full px-6 py-6 lg:px-12 flex justify-between items-center max-w-7xl mx-auto">
        <div onClick={() => router.push("/")} className="cursor-pointer">
          <CSSLogo />
        </div>
        <nav className="hidden md:flex gap-6 font-semibold text-slate-500">
          <button onClick={() => router.push("/")} className="px-3 py-3 hover:text-blue-500 transition-colors">{t("nav.home")}</button>
          <button onClick={() => router.push("/como-funciona")} className="px-3 py-3 hover:text-blue-500 transition-colors">{t("nav.howItWorks")}</button>
          <button onClick={() => router.push("/historico")} className="px-3 py-3 hover:text-blue-500 transition-colors">{t("nav.myHistory")}</button>
          <button onClick={() => router.push("/sobre-o-autor")} className="px-3 py-3 text-blue-500 font-bold transition-colors">{t("nav.about")}</button>
        </nav>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <UserMenu />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pb-24">

        {/* HERO */}
        <section className="text-center py-14">
          <AuthorAvatar />
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-3 leading-tight">
            Diogo Sena
          </h1>
          <p className="text-lg text-blue-500 font-bold mb-4">{t("author.role")}</p>
          <p className="text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
            {t("author.tagline")}
          </p>

          {/* Social links */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <a
              href="https://github.com/diogodmsena"
              target="_blank"
              rel="noopener noreferrer"
              id="author-github-link"
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-full font-bold text-sm hover:bg-slate-700 transition-all shadow-sm hover:shadow-md"
            >
              <IconGithub /> GitHub
            </a>
            <a
              href="https://linkedin.com/in/diogodmsena"
              target="_blank"
              rel="noopener noreferrer"
              id="author-linkedin-link"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
            >
              <IconLinkedin /> LinkedIn
            </a>
          </div>
        </section>

        {/* INTRO */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{t("author.introTitle")}</h2>
          </div>
          <p className="text-slate-600 leading-relaxed font-medium">
            {t("author.introText")}
          </p>
        </section>

        {/* JORNADA */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{t("author.journeyTitle")}</h2>
          </div>
          <div className="space-y-4 text-slate-600 leading-relaxed font-medium">
            <p>{t("author.journeyP1")}</p>
            <p>{t("author.journeyP2")}</p>
            <p>{t("author.journeyP3")}</p>
          </div>
        </section>

        {/* MISSÃO */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 md:p-10 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">{t("author.missionTitle")}</h2>
            </div>
            <div className="space-y-4 text-blue-100 leading-relaxed font-medium">
              <p>{t("author.missionP1")}</p>
              <p>{t("author.missionP2")}</p>
            </div>
          </div>
        </section>

        {/* TECH STACK */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
              <Code2 className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{t("author.techTitle")}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <TechBadge key={tech.label} label={tech.label} color={tech.color} />
            ))}
          </div>
        </section>

        {/* HACKATHON */}
        <section className="bg-amber-50 border border-amber-200 rounded-3xl p-8 md:p-10 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl shrink-0">🏆</div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">{t("author.hackathonTitle")}</h2>
              <p className="text-slate-600 leading-relaxed font-medium mb-3">{t("author.hackathonP1")}</p>
              <p className="text-slate-600 leading-relaxed font-medium">{t("author.hackathonP2")}</p>
            </div>
          </div>
        </section>

        {/* CONCLUSÃO */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10 mb-8">
          <div className="space-y-4 text-slate-600 leading-relaxed font-medium">
            <p>{t("author.closingP1")}</p>
            <p>{t("author.closingP2")}</p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="bg-blue-50 rounded-3xl p-10 border border-blue-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-3">{t("author.ctaTitle")}</h2>
            <p className="text-slate-500 font-medium mb-6">{t("author.ctaDesc")}</p>
            <Link
              href="/"
              id="about-start-screening-cta"
              className="inline-flex items-center gap-3 bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-lg py-4 px-10 rounded-full transition-all shadow-sm hover:shadow-md"
            >
              {t("how.ctaButton")} <ExternalLink className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="w-full pb-10 pt-20 border-t border-slate-200 mt-10 text-center bg-white">
        <p className="text-slate-500 font-bold">{t("footer.text", { year: String(new Date().getFullYear()) })}</p>
        <div className="flex justify-center gap-3 mt-6">
          <div className="w-3 h-3 rounded-full bg-blue-500 opacity-60"></div>
          <div className="w-3 h-3 rounded-full bg-amber-400 opacity-60"></div>
          <div className="w-3 h-3 rounded-full bg-rose-500 opacity-60"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-60"></div>
        </div>
      </footer>
    </div>
  );
}
