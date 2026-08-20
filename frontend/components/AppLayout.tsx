"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/",         icon: "⊞", label: "Dashboard" },
  { href: "/upload",   icon: "⬆", label: "Upload Videos" },
  { href: "/suspects", icon: "👤", label: "Reference Images" },
  { href: "/search",   icon: "🔍", label: "Search" },
  { href: "/results",  icon: "🎯", label: "Results" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="layout">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-logo">
          <div className="icon">👁</div>
          <span>Vision<span className="accent">CCTV</span></span>
        </div>
        <span style={{ marginLeft: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          AI-Powered Forensic Analysis
        </span>
        <div className="topbar-badge">Hackathon Edition</div>
      </header>

      {/* Sidebar */}
      <nav className="sidebar">
        <div className="nav-section-label">Navigation</div>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={`nav-item ${pathname === item.href ? "active" : ""}`}>
              <span style={{ fontSize: "1rem" }}>{item.icon}</span>
              {item.label}
            </div>
          </Link>
        ))}

        <div className="nav-section-label" style={{ marginTop: "auto" }}>System</div>
        <a href="http://localhost:8000/docs" target="_blank" rel="noopener">
          <div className="nav-item">
            <span>📡</span>
            API Docs
          </div>
        </a>
      </nav>

      {/* Main */}
      <main className="main-content fade-in">
        {children}
      </main>
    </div>
  );
}
