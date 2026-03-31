import Image from "next/image";
import Link from "next/link";
import { Activity, Shield, Zap, HeartPulse, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-layout-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">CareLabs</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Features</Link>
              <Link href="#ai" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">AI Diagnostics</Link>
              <Link href="/login" className="text-sm font-medium text-slate-900 hover:text-primary transition-colors">Sign In</Link>
              <Link 
                href="/register" 
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-primary/20"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-48">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ai/10 text-ai text-sm font-bold mb-8 animate-fade-in">
                  <Zap className="w-4 h-4" />
                  NEXT GENERATION HEALTHCARE
                </div>
                <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-8">
                  Intelligent Care for a <span className="text-primary">Healthier Future</span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-lg">
                  CareLabs combines advanced AI diagnostics with a seamless patient-doctor experience. Unified, secure, and built for modern medicine.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/register" 
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all shadow-xl shadow-primary/25 group"
                  >
                    Start Your Journey
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link 
                    href="/register/doctor" 
                    className="flex items-center justify-center gap-2 bg-white border-2 border-layout-border hover:border-primary text-foreground px-8 py-4 rounded-2xl text-lg font-bold transition-all"
                  >
                    Join as a Provider
                  </Link>
                </div>
                
                <div className="mt-12 flex items-center gap-8 border-t border-layout-border pt-12">
                  <div>
                    <p className="text-3xl font-bold text-foreground">99.9%</p>
                    <p className="text-sm text-slate-500 font-medium">Uptime Guarantee</p>
                  </div>
                  <div className="w-px h-10 bg-layout-border"></div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">HIPAA</p>
                    <p className="text-sm text-slate-500 font-medium">Fully Compliant</p>
                  </div>
                  <div className="w-px h-10 bg-layout-border"></div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">24/7</p>
                    <p className="text-sm text-slate-500 font-medium">AI Assistance</p>
                  </div>
                </div>
              </div>

              <div className="mt-20 lg:mt-0 relative">
                <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white">
                  <Image 
                    src="/images/login.png" 
                    alt="CareLabs Platform" 
                    width={800} 
                    height={800} 
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
                </div>
                {/* Decorative blobs */}
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-ai/10 rounded-full blur-3xl animate-pulse delay-700"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-base font-bold tracking-widest text-primary uppercase mb-4">Core Capabilities</h2>
              <p className="text-4xl font-bold text-foreground mb-6">Built for Accuracy and Ease of Use</p>
              <p className="text-lg text-slate-600">Everything you need to manage health effectively in one unified ecosystem.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "AI Symptom Checker",
                  desc: "Advanced neural networks help identify potential health issues with high precision.",
                  icon: HeartPulse,
                  color: "bg-ai/10 text-ai"
                },
                {
                  title: "Secure Health Records",
                  desc: "End-to-end encrypted storage for all your medical history and prescriptions.",
                  icon: Shield,
                  color: "bg-secondary/10 text-secondary"
                },
                {
                  title: "Smart Appointments",
                  desc: "Instant booking with real-time availability and automated follow-up reminders.",
                  icon: Zap,
                  color: "bg-primary/10 text-primary"
                }
              ].map((feature, i) => (
                <div key={i} className="p-10 rounded-[2rem] bg-slate-50 border border-layout-border hover:border-primary/20 transition-all hover:shadow-xl group">
                  <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Call to Action */}
        <section id="ai" className="py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-900 rounded-[3rem] overflow-hidden relative">
               {/* Background pattern */}
               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')" }}></div>
               
               <div className="relative z-10 px-8 py-20 lg:p-24 lg:flex items-center gap-16">
                  <div className="lg:w-1/2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ai/20 text-ai text-sm font-bold mb-8">
                      PRO FEATURES
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">Empower Your Practice with <span className="text-ai">CareAI</span></h2>
                    <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                      Our advanced AI isn't just for patients. Doctors get real-time diagnostic suggestions, automated patient history summaries, and predictive health analytics.
                    </p>
                    <ul className="space-y-4 mb-12">
                      {['98.4% diagnostic suggestion accuracy', 'Automated consultation note summaries', 'Real-time lab result analysis'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-200">
                          <CheckCircle2 className="w-5 h-5 text-ai" />
                          <span className="font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Link 
                      href="/register/doctor" 
                      className="inline-flex items-center gap-2 bg-ai hover:bg-ai/90 text-white px-8 py-4 rounded-2xl font-bold transition-all"
                    >
                      Explore Provider Tools
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                  <div className="hidden lg:block lg:w-1/2">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-ai blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <Image 
                          src="/images/login.png" 
                          alt="AI Diagnostics" 
                          width={600} 
                          height={600} 
                          className="relative z-10 rounded-3xl shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500 opacity-90"
                        />
                      </div>
                  </div>
               </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-layout-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Activity className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold tracking-tight text-foreground">CareLabs</span>
          </div>
          <p className="text-slate-500 text-sm mb-8">© 2026 CareLabs Technologies Inc. All rights reserved.</p>
          <div className="flex justify-center gap-8 text-sm font-medium text-slate-600">
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-primary transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
