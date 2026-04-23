import { jsx as e, jsxs as f, Fragment as j } from "react/jsx-runtime";
import U, { createContext as L, useState as b, useEffect as w, useCallback as S, useContext as W, useRef as T } from "react";
import { ChevronLeft as _, ChevronRight as q, Settings as G, Sun as V, Moon as Y, Monitor as Q, User as Z } from "lucide-react";
import { LayoutGroup as R, motion as y, AnimatePresence as B } from "framer-motion";
import E from "@cloudscape-design/components/container";
import M from "@cloudscape-design/components/header";
import A from "@cloudscape-design/components/box";
import { createPortal as J } from "react-dom";
import K from "@cloudscape-design/components/toggle";
import { applyTheme as X } from "@cloudscape-design/components/theming";
const O = L(void 0);
function ee() {
  return typeof window < "u" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function P(t) {
  return t === "system" ? ee() : t;
}
const Ne = ({
  children: t,
  storageKey: i = "rad-theme-preference",
  defaultPreference: r = "system"
}) => {
  const [s, a] = b(() => {
    try {
      const c = localStorage.getItem(i);
      return c && ["light", "dark", "system"].includes(c) ? c : r;
    } catch {
      return r;
    }
  }), [n, o] = b(() => {
    try {
      const c = localStorage.getItem(i), d = c && ["light", "dark", "system"].includes(c) ? c : r;
      return P(d);
    } catch {
      return P(r);
    }
  });
  w(() => {
    document.documentElement.setAttribute("data-theme", n), document.body.classList.remove("awsui-light-mode", "awsui-dark-mode"), document.body.classList.add(`awsui-${n}-mode`);
  }, [n]), w(() => {
    if (s !== "system") return;
    const c = window.matchMedia("(prefers-color-scheme: dark)"), d = (m) => {
      o(m.matches ? "dark" : "light");
    };
    return c.addEventListener("change", d), () => c.removeEventListener("change", d);
  }, [s]);
  const l = S((c) => {
    a(c);
    try {
      localStorage.setItem(i, c);
    } catch {
    }
    o(P(c));
  }, [i]), h = S(() => {
    l(n === "light" ? "dark" : "light");
  }, [n, l]);
  return /* @__PURE__ */ e(O.Provider, { value: { mode: n, preference: s, setPreference: l, toggleTheme: h }, children: t });
}, te = () => {
  const t = W(O);
  if (t === void 0)
    throw new Error("useTheme must be used within a ThemeProvider");
  return t;
};
function Se({ items: t, activeKey: i, onNavigate: r, children: s, chatBar: a }) {
  const [n, o] = b(!1), { mode: l, preference: h, setPreference: c } = te(), [d, m] = b(!1);
  return /* @__PURE__ */ f("div", { className: "layout", "data-theme": l, children: [
    /* @__PURE__ */ e("aside", { className: `sidebar ${n ? "open" : "closed"}`, children: /* @__PURE__ */ f("div", { className: "sidebar-content", children: [
      /* @__PURE__ */ f("div", { className: "sidebar-top", children: [
        /* @__PURE__ */ e(
          "button",
          {
            className: "sidebar-logo-btn",
            onClick: () => o(!n),
            "aria-label": n ? "Collapse sidebar" : "Expand sidebar",
            children: n ? /* @__PURE__ */ e(_, { size: 18 }) : /* @__PURE__ */ e(q, { size: 18 })
          }
        ),
        /* @__PURE__ */ e("div", { className: "sidebar-divider" })
      ] }),
      /* @__PURE__ */ e("div", { className: "sidebar-middle", children: t.map((g) => /* @__PURE__ */ f(
        "button",
        {
          className: `sidebar-icon-btn ${i === g.key ? "selected" : ""}`,
          onClick: () => !g.disabled && r(g.key),
          style: { opacity: g.disabled ? 0.4 : 1, cursor: g.disabled ? "default" : "pointer" },
          title: g.label,
          children: [
            g.icon,
            n && /* @__PURE__ */ e("span", { className: "sidebar-label", children: g.label }),
            g.badge && /* @__PURE__ */ e("span", { style: { marginLeft: "auto", fontSize: 10, color: "#33bbef" }, children: g.badge })
          ]
        },
        g.key
      )) }),
      /* @__PURE__ */ f("div", { className: "sidebar-bottom", children: [
        /* @__PURE__ */ f("div", { className: "sidebar-settings-wrapper", children: [
          /* @__PURE__ */ f(
            "button",
            {
              className: `sidebar-icon-btn ${d ? "selected" : ""}`,
              onClick: () => m(!d),
              "aria-label": "Settings",
              children: [
                /* @__PURE__ */ e(G, { size: 16 }),
                n && /* @__PURE__ */ e("span", { className: "sidebar-label", children: "Settings" })
              ]
            }
          ),
          d && /* @__PURE__ */ f("div", { className: "settings-popover", children: [
            /* @__PURE__ */ e("div", { className: "settings-popover-header", children: "Appearance" }),
            /* @__PURE__ */ e("div", { className: "settings-theme-options", children: ["light", "dark", "system"].map((g) => /* @__PURE__ */ f(
              "button",
              {
                className: `settings-theme-btn ${h === g ? "active" : ""}`,
                onClick: () => {
                  c(g), m(!1);
                },
                children: [
                  g === "light" ? /* @__PURE__ */ e(V, { size: 14 }) : g === "dark" ? /* @__PURE__ */ e(Y, { size: 14 }) : /* @__PURE__ */ e(Q, { size: 14 }),
                  " ",
                  g.charAt(0).toUpperCase() + g.slice(1)
                ]
              },
              g
            )) })
          ] })
        ] }),
        /* @__PURE__ */ e("div", { className: "sidebar-user-section", children: /* @__PURE__ */ e("button", { className: "sidebar-user-btn", "aria-label": "User menu", children: /* @__PURE__ */ e("div", { className: "sidebar-user-avatar", children: /* @__PURE__ */ e(Z, { size: 18 }) }) }) })
      ] })
    ] }) }),
    /* @__PURE__ */ f("div", { className: "main-wrapper", children: [
      /* @__PURE__ */ e("div", { className: "content-area", children: /* @__PURE__ */ e("main", { className: "main-content", children: s }) }),
      a && /* @__PURE__ */ e("div", { className: "chat-bar", children: /* @__PURE__ */ e("div", { className: "chat-bar-inner", children: a }) })
    ] })
  ] });
}
const F = [0.4, 0, 0.2, 1], I = 0.4;
function we({
  cards: t,
  defaultFocused: i,
  focused: r,
  onFocusChange: s,
  columns: a
}) {
  const [n, o] = b(
    i || null
  ), l = r !== void 0 ? r : n, h = (u) => {
    s ? s(u) : o(u);
  }, c = (u) => {
    const x = l === u ? null : u;
    if (h(x), x) {
      const p = t.find((v) => v.id === x);
      p != null && p.onFocus && setTimeout(p.onFocus, 400);
    }
  }, d = l !== null, m = t.find((u) => u.id === l), g = t.filter((u) => u.id !== l), k = a ?? t.length;
  return d ? /* @__PURE__ */ e(R, { children: /* @__PURE__ */ f("div", { style: { display: "flex", gap: 12, alignItems: "flex-start" }, children: [
    /* @__PURE__ */ e(
      y.div,
      {
        layoutId: m.id,
        onClick: () => c(m.id),
        style: { flex: "0 0 68%", cursor: "pointer" },
        transition: { duration: I, ease: F },
        children: /* @__PURE__ */ e(
          E,
          {
            header: /* @__PURE__ */ f(M, { variant: "h2", children: [
              m.icon,
              " ",
              m.title
            ] }),
            children: /* @__PURE__ */ e(
              y.div,
              {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { duration: 0.25, delay: 0.15 },
                onClick: (u) => u.stopPropagation(),
                children: m.content
              }
            )
          }
        )
      },
      m.id
    ),
    /* @__PURE__ */ e("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 12 }, children: g.map((u) => /* @__PURE__ */ e(
      y.div,
      {
        layoutId: u.id,
        onClick: () => c(u.id),
        style: { cursor: "pointer" },
        transition: { duration: I, ease: F },
        children: /* @__PURE__ */ e($, { card: u })
      },
      u.id
    )) })
  ] }) }) : /* @__PURE__ */ e(R, { children: /* @__PURE__ */ e(
    "div",
    {
      style: {
        display: "grid",
        gridTemplateColumns: `repeat(${k}, 1fr)`,
        gap: 12
      },
      children: t.map((u) => /* @__PURE__ */ e(
        y.div,
        {
          layoutId: u.id,
          onClick: () => c(u.id),
          style: { cursor: "pointer", minWidth: 0 },
          transition: { duration: I, ease: F },
          children: /* @__PURE__ */ e($, { card: u })
        },
        u.id
      ))
    }
  ) });
}
function $({ card: t }) {
  return /* @__PURE__ */ e(E, { header: /* @__PURE__ */ f(M, { variant: "h3", children: [
    t.icon,
    " ",
    t.title
  ] }), children: /* @__PURE__ */ f(
    "div",
    {
      style: {
        height: 90,
        overflow: "hidden",
        position: "relative",
        pointerEvents: "none"
      },
      children: [
        t.thumbnail ? /* @__PURE__ */ e("div", { style: { padding: "4px 0" }, children: t.thumbnail }) : /* @__PURE__ */ e(
          "div",
          {
            style: {
              transform: "scale(0.32)",
              transformOrigin: "top left",
              width: "310%",
              opacity: 0.4,
              filter: "saturate(0.35)"
            },
            children: t.content
          }
        ),
        /* @__PURE__ */ e(
          "div",
          {
            style: {
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "20px 8px 6px",
              background: "linear-gradient(transparent, var(--color-background-container-content, #191D23) 70%)"
            },
            children: /* @__PURE__ */ e(A, { color: "text-body-secondary", fontSize: "body-s", children: t.summary })
          }
        )
      ]
    }
  ) });
}
function De({ children: t, delay: i = 0, duration: r = 0.3, disabled: s = !1 }) {
  return s ? /* @__PURE__ */ e("div", { children: t }) : /* @__PURE__ */ e(
    y.div,
    {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: r, delay: i, ease: "easeOut" },
      children: t
    }
  );
}
function Ce({ children: t, stagger: i = 0.06, disabled: r = !1 }) {
  return r ? /* @__PURE__ */ e("div", { children: t }) : /* @__PURE__ */ e(
    y.div,
    {
      initial: "hidden",
      animate: "visible",
      variants: {
        hidden: {},
        visible: { transition: { staggerChildren: i } }
      },
      children: U.Children.map(
        t,
        (s) => s ? /* @__PURE__ */ e(
          y.div,
          {
            variants: {
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } }
            },
            children: s
          }
        ) : null
      )
    }
  );
}
function Te({ children: t, duration: i = 0.2, disabled: r = !1 }) {
  return r ? /* @__PURE__ */ e("div", { children: t }) : /* @__PURE__ */ e(
    y.div,
    {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: i, ease: "easeOut" },
      children: t
    }
  );
}
function Be({ children: t, id: i, disabled: r = !1 }) {
  return r ? /* @__PURE__ */ e("div", { children: t }) : /* @__PURE__ */ e(B, { mode: "wait", children: /* @__PURE__ */ e(
    y.div,
    {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -8 },
      transition: { duration: 0.25, ease: "easeOut" },
      children: t
    },
    i
  ) });
}
function Pe({ children: t, className: i, disabled: r = !1 }) {
  return r ? /* @__PURE__ */ e("div", { className: i, children: t }) : /* @__PURE__ */ e(y.div, { layout: !0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }, className: i, children: t });
}
function Fe({
  value: t,
  onChange: i,
  onSend: r,
  placeholder: s = "Chat",
  fuse: a = !0,
  accentColor: n,
  disabled: o = !1,
  actions: l
}) {
  const h = (d) => {
    d.key === "Enter" && t.trim() && !o && r();
  }, c = a && !o;
  return /* @__PURE__ */ f("div", { className: "toolbar-wrapper", children: [
    /* @__PURE__ */ f(
      "div",
      {
        className: `toolbar toolbar-chat${c ? " toolbar-fuse" : ""}`,
        style: n && c ? { "--rad-toolbar-accent": n } : void 0,
        children: [
          /* @__PURE__ */ e(
            "input",
            {
              className: "toolbar-input",
              type: "text",
              value: t,
              onChange: (d) => i(d.target.value),
              onKeyDown: h,
              placeholder: s,
              disabled: o,
              "aria-label": "Chat input"
            }
          ),
          /* @__PURE__ */ e("span", { className: "toolbar-shortcut", children: "⌘K" })
        ]
      }
    ),
    l && /* @__PURE__ */ e("div", { className: "toolbar toolbar-actions", children: l })
  ] });
}
function Ie({
  title: t,
  steps: i,
  activeHref: r,
  completedHrefs: s = [],
  onNavigate: a,
  collapsed: n = !1,
  onToggle: o
}) {
  return /* @__PURE__ */ f(
    "div",
    {
      style: {
        width: n ? 56 : 240,
        background: "#0f1b2a",
        borderRight: "1px solid #2a2e33",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        overflow: "hidden",
        flexShrink: 0,
        height: "100vh"
      },
      children: [
        o && /* @__PURE__ */ e("div", { style: { display: "flex", justifyContent: "flex-end", padding: "12px 12px 0" }, children: /* @__PURE__ */ e(
          "button",
          {
            onClick: o,
            "aria-label": n ? "Expand navigation" : "Collapse navigation",
            style: {
              background: "#1a2332",
              border: "1px solid #2a2e33",
              borderRadius: 8,
              color: "#8b949e",
              cursor: "pointer",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14
            },
            children: n ? "›" : "‹"
          }
        ) }),
        !n && /* @__PURE__ */ f(j, { children: [
          t && /* @__PURE__ */ f("div", { style: { padding: "20px 20px 24px" }, children: [
            /* @__PURE__ */ e(
              "div",
              {
                style: {
                  color: "#33bbef",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginBottom: 8
                },
                children: "Progress"
              }
            ),
            /* @__PURE__ */ e("div", { style: { color: "#e6edf3", fontSize: 18, fontWeight: 600 }, children: t })
          ] }),
          /* @__PURE__ */ e("div", { style: { padding: "0 20px" }, children: /* @__PURE__ */ e("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: i.map((l, h) => {
            const c = l.href === r, d = s.includes(l.href), m = l.disabled && !c;
            return /* @__PURE__ */ f(
              "div",
              {
                onClick: () => {
                  m || a(l.href);
                },
                className: c ? "step-animate" : void 0,
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  cursor: m ? "default" : "pointer",
                  opacity: m ? 0.4 : 1,
                  transition: "opacity 0.15s"
                },
                children: [
                  /* @__PURE__ */ e(
                    "div",
                    {
                      style: {
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        background: c ? "#33bbef" : d ? "#238636" : "#2a2e33",
                        color: c ? "#0f1b2a" : d ? "#fff" : "#8b949e",
                        transition: "all 0.2s",
                        flexShrink: 0
                      },
                      children: d && !c ? "✓" : h + 1
                    }
                  ),
                  /* @__PURE__ */ f("div", { children: [
                    /* @__PURE__ */ e(
                      "span",
                      {
                        style: {
                          fontSize: 15,
                          fontWeight: c ? 600 : 400,
                          color: c ? "#e6edf3" : m ? "#484f58" : "#8b949e",
                          transition: "color 0.15s"
                        },
                        children: l.label
                      }
                    ),
                    l.description && /* @__PURE__ */ e("div", { style: { fontSize: 12, color: "#484f58", marginTop: 2 }, children: l.description })
                  ] })
                ]
              },
              l.href
            );
          }) }) })
        ] }),
        n && /* @__PURE__ */ e(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              marginTop: 20
            },
            children: i.map((l, h) => {
              const c = l.href === r, d = s.includes(l.href);
              return /* @__PURE__ */ e(
                "div",
                {
                  onClick: () => !l.disabled && a(l.href),
                  style: {
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: l.disabled ? "default" : "pointer",
                    background: c ? "#33bbef" : d ? "#238636" : "#2a2e33",
                    color: c ? "#0f1b2a" : d ? "#fff" : "#8b949e",
                    opacity: l.disabled && !c ? 0.4 : 1
                  },
                  children: d && !c ? "✓" : h + 1
                },
                l.href
              );
            })
          }
        ),
        /* @__PURE__ */ e("div", { style: { flex: 1 } })
      ]
    }
  );
}
function Ae({
  progress: t,
  logEntries: i = [],
  onComplete: r
}) {
  const s = Math.max(0, Math.min(100, t)), a = s >= 100, n = T(null), o = T(!1);
  return w(() => {
    n.current && (n.current.scrollTop = n.current.scrollHeight);
  }, [i]), w(() => {
    a && r && !o.current && (o.current = !0, r());
  }, [a, r]), /* @__PURE__ */ f(
    "div",
    {
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#0f1b2a",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40
      },
      children: [
        /* @__PURE__ */ e(
          "div",
          {
            style: {
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: a ? "4px solid #3fb950" : "4px solid #2a2e33",
              borderTopColor: a ? "#3fb950" : "#33bbef",
              animation: a ? "none" : "spin 0.8s linear infinite",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              transition: "border-color 0.3s ease"
            },
            children: a ? "✓" : ""
          }
        ),
        /* @__PURE__ */ e(
          "div",
          {
            style: {
              width: 400,
              maxWidth: "80%",
              height: 6,
              background: "#2a2e33",
              borderRadius: 3,
              marginBottom: 24,
              overflow: "hidden"
            },
            children: /* @__PURE__ */ e(
              "div",
              {
                "data-testid": "progress-bar-fill",
                style: {
                  height: "100%",
                  borderRadius: 3,
                  background: a ? "#3fb950" : "linear-gradient(90deg, #33bbef, #58a6ff)",
                  width: `${s}%`,
                  transition: "width 0.4s ease, background 0.3s ease"
                }
              }
            )
          }
        ),
        /* @__PURE__ */ e(
          "div",
          {
            ref: n,
            style: {
              width: 500,
              maxWidth: "90%",
              maxHeight: 300,
              overflowY: "auto",
              background: "#161b22",
              border: "1px solid #2a2e33",
              borderRadius: 8,
              padding: 12,
              fontFamily: "monospace",
              fontSize: 13
            },
            children: i.map((l, h) => /* @__PURE__ */ e(
              "div",
              {
                style: {
                  color: "#8b949e",
                  padding: "2px 0",
                  animation: "fadeSlide 0.2s ease"
                },
                children: l
              },
              h
            ))
          }
        )
      ]
    }
  );
}
function ie(t, i, r, s) {
  const a = (s - 1) * 2;
  return a > 0 ? (t + i) / a * r : 0;
}
function re(t, i, r, s) {
  const a = (s - 1) / 2, n = Math.sqrt(Math.pow(t - a, 2) + Math.pow(i - a, 2)), o = Math.sqrt(2 * Math.pow(a, 2));
  return o > 0 ? n / o * r : 0;
}
function ne(t, i, r, s) {
  const a = (s - 1) / 2, n = i - a, o = t - a, l = Math.sqrt(n * n + o * o), h = (Math.atan2(o, n) + Math.PI) / (2 * Math.PI), c = Math.sqrt(2 * Math.pow(a, 2));
  return ((c > 0 ? l / c : 0) * 0.7 + h * 0.3) * r;
}
function ae(t, i, r, s) {
  const a = (s - 1) / 2, n = Math.max(Math.abs(t - a), Math.abs(i - a)), o = Math.ceil(a);
  return o > 0 ? n / o * r : 0;
}
const oe = { default: ie, fade: re, orbit: ne, ripple: ae }, se = { default: 1.8, fade: 1.4, orbit: 2, ripple: 2.4 };
function Ee({ variant: t = "default", gridCount: i = 3, size: r = 8, gap: s = 4 }) {
  const a = i * i, n = se[t], o = oe[t];
  return /* @__PURE__ */ e("div", { className: "ai-thinking-visualization", children: /* @__PURE__ */ e(
    "div",
    {
      className: "ai-thinking-grid",
      style: { gridTemplateColumns: `repeat(${i}, ${r}px)`, gap: `${s}px` },
      children: Array.from({ length: a }, (l, h) => {
        const c = Math.floor(h / i), d = h % i, m = o(c, d, n, i);
        return /* @__PURE__ */ e(
          "div",
          {
            className: `ai-thinking-dot ai-thinking-${t}`,
            style: {
              width: r,
              height: r,
              borderRadius: 3,
              animationDelay: `${m}s`,
              "--sweep-duration": `${n}s`
            }
          },
          `${c}-${d}`
        );
      })
    }
  ) });
}
function le({
  text: t,
  show: i,
  typeSpeed: r = 60,
  dotDelay: s = 600,
  typeStartDelay: a = 500,
  showCheck: n = !1,
  onComplete: o,
  onClick: l
}) {
  const [h, c] = b(!1), [d, m] = b(""), [g, k] = b(!1), u = T(o);
  return u.current = o, w(() => {
    if (!i) {
      c(!1), m(""), k(!1);
      return;
    }
    let x;
    const p = setTimeout(() => c(!0), s), v = t.split(/(\s+)/);
    let N = 0;
    const D = setTimeout(() => {
      const C = () => {
        var z;
        N++, m(v.slice(0, N).join("")), N < v.length ? x = setTimeout(C, r) : (k(!0), (z = u.current) == null || z.call(u));
      };
      C();
    }, s + a);
    return () => {
      clearTimeout(p), clearTimeout(D), clearTimeout(x);
    };
  }, [i, t, r, s, a]), i ? /* @__PURE__ */ f(
    "div",
    {
      className: "ember-typing-message",
      onClick: l,
      style: { cursor: l ? "pointer" : void 0 },
      children: [
        d && /* @__PURE__ */ f("p", { children: [
          d,
          !g && /* @__PURE__ */ e("span", { className: "ember-typing-cursor" })
        ] }),
        h && /* @__PURE__ */ e(B, { mode: "wait", children: n ? /* @__PURE__ */ e(
          y.span,
          {
            className: "ember-dot ember-dot-check",
            initial: { opacity: 0, scale: 0.5 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 0.3 },
            children: "✓"
          },
          "check"
        ) : /* @__PURE__ */ e(
          y.span,
          {
            className: "ember-dot",
            initial: { opacity: 0, scale: 0.5 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 0.25 }
          },
          "dot"
        ) })
      ]
    }
  ) : null;
}
const ce = [
  "analyzing requirements",
  "selecting relevant data",
  "calibrating parameters",
  "building plan",
  "evaluating results",
  "optimizing structure"
];
function Me({
  steps: t = ce,
  prefix: i = "Processing",
  stepDuration: r = 1e3,
  initiallyComplete: s = !1,
  centered: a = !1,
  onComplete: n
}) {
  const [o, l] = b(s ? t.length - 1 : 0), [h, c] = b(s), d = T(n);
  d.current = n;
  const m = t.length, g = S(() => {
    var p;
    o < m - 1 ? l((v) => v + 1) : (c(!0), (p = d.current) == null || p.call(d));
  }, [o, m]);
  w(() => {
    if (h) return;
    const p = setTimeout(g, r);
    return () => clearTimeout(p);
  }, [g, r, h]);
  const k = 5, u = 4, x = (p, v) => {
    const N = (k - 1) / 2, D = Math.sqrt((p - N) ** 2 + (v - N) ** 2), C = Math.sqrt(N ** 2 + N ** 2);
    return D / C * (u * 0.35);
  };
  return h ? null : /* @__PURE__ */ e(
    y.div,
    {
      className: `thinking-reasoning${a ? " thinking-centered" : ""}`,
      ...a ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } } : {},
      children: /* @__PURE__ */ e("div", { className: "thinking-layout", children: /* @__PURE__ */ f("div", { className: "thinking-step-line", children: [
        /* @__PURE__ */ e("div", { className: "pixel-dot-grid", style: { "--sweep-duration": `${u}s` }, children: Array.from({ length: k }, (p, v) => /* @__PURE__ */ e("div", { className: "pixel-dot-row", children: Array.from({ length: k }, (N, D) => /* @__PURE__ */ e(
          "span",
          {
            className: "pixel-dot variant-radial",
            style: { animationDelay: `${x(v, D)}s` }
          },
          D
        )) }, v)) }),
        /* @__PURE__ */ e(B, { mode: "wait", children: /* @__PURE__ */ e(
          y.span,
          {
            className: "thinking-step-text",
            initial: { opacity: 0, y: 4 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -4 },
            transition: { duration: 0.2 },
            children: t[o].charAt(0).toUpperCase() + t[o].slice(1).toLowerCase()
          },
          o
        ) })
      ] }) })
    }
  );
}
function ze({
  text: t,
  show: i,
  onClick: r,
  onMouseEnter: s,
  onMouseLeave: a,
  typeSpeed: n = 24,
  dotDelay: o = 600,
  typeStartDelay: l = 500
}) {
  return i ? /* @__PURE__ */ e(
    y.div,
    {
      className: "welcome-message",
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
      onMouseEnter: s,
      onMouseLeave: a,
      style: { cursor: r ? "pointer" : void 0 },
      children: /* @__PURE__ */ e(
        le,
        {
          text: t,
          show: i,
          typeSpeed: n,
          dotDelay: o,
          typeStartDelay: l,
          onClick: r
        }
      )
    }
  ) : null;
}
function Re({
  onDismiss: t,
  backgroundImage: i,
  logoSrc: r,
  logoAlt: s = "Logo",
  pillText: a
}) {
  const [n, o] = b(!1), [l, h] = b(!1);
  w(() => {
    const m = new Image();
    m.src = i, m.onload = () => h(!0);
  }, [i]);
  const c = S(() => {
    o(!0);
  }, []), d = /* @__PURE__ */ e(B, { onExitComplete: t, children: !n && l && /* @__PURE__ */ f(
    y.div,
    {
      className: "screensaver-overlay",
      onClick: c,
      initial: { y: 0 },
      exit: { y: "-100%" },
      transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
      children: [
        /* @__PURE__ */ e("div", { className: "screensaver-bg", children: /* @__PURE__ */ e(
          "div",
          {
            className: "screensaver-slide screensaver-ken-burns",
            style: { backgroundImage: `url(${i})` }
          }
        ) }),
        /* @__PURE__ */ e("div", { className: "screensaver-center", children: /* @__PURE__ */ e(
          y.div,
          {
            className: "screensaver-logo",
            initial: { opacity: 0, scale: 0.88 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] },
            children: /* @__PURE__ */ e("img", { src: r, alt: s, className: "screensaver-connect-logo" })
          }
        ) }),
        a && /* @__PURE__ */ e("div", { className: "screensaver-bottom", children: /* @__PURE__ */ f(
          y.div,
          {
            className: "screensaver-pill",
            initial: { opacity: 0, y: 40 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 1.4, ease: [0.16, 1, 0.3, 1] },
            children: [
              /* @__PURE__ */ e("span", { className: "screensaver-pill-dot" }),
              a
            ]
          }
        ) })
      ]
    }
  ) });
  return typeof document > "u" ? null : J(d, document.body);
}
function $e({
  title: t,
  icon: i,
  description: r,
  selected: s = !1,
  disabled: a = !1,
  onClick: n,
  children: o
}) {
  return /* @__PURE__ */ e(
    "div",
    {
      onClick: () => !a && (n == null ? void 0 : n()),
      style: {
        cursor: a ? "default" : "pointer",
        opacity: a ? 0.5 : 1,
        transition: "opacity 0.2s ease"
      },
      children: /* @__PURE__ */ e(
        E,
        {
          header: /* @__PURE__ */ f(M, { variant: "h3", children: [
            i && /* @__PURE__ */ e("span", { style: { marginRight: 6 }, children: i }),
            t
          ] }),
          footer: s ? /* @__PURE__ */ e(A, { color: "text-status-success", fontSize: "body-s", children: "✓ Selected" }) : void 0,
          children: o || r && /* @__PURE__ */ e(A, { color: "text-body-secondary", fontSize: "body-s", children: r })
        }
      )
    }
  );
}
function Le({
  label: t,
  labelIcon: i = "🎯",
  options: r,
  selected: s,
  onChange: a
}) {
  const n = (o) => {
    const l = s.includes(o) ? s.filter((h) => h !== o) : [...s, o];
    a(l);
  };
  return /* @__PURE__ */ f(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        padding: "10px 16px",
        background: "var(--rad-surface-secondary, #1a2332)",
        borderRadius: 10,
        border: "1px solid var(--rad-border-color, #2a2e33)"
      },
      children: [
        t && /* @__PURE__ */ f(
          "span",
          {
            style: {
              color: "#33bbef",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginRight: 4
            },
            children: [
              i,
              " ",
              t
            ]
          }
        ),
        r.map((o) => /* @__PURE__ */ e(
          K,
          {
            checked: s.includes(o.id),
            onChange: () => n(o.id),
            children: o.label
          },
          o.id
        ))
      ]
    }
  );
}
function de(t) {
  return t >= 0.7 ? { color: "#3fb950", bg: "#0d2818", border: "#238636" } : t >= 0.4 ? { color: "#d29922", bg: "#2a1f00", border: "#9e6a03" } : { color: "#f85149", bg: "#2d0a0a", border: "#da3633" };
}
function We({
  label: t,
  score: i,
  selected: r = !1,
  onClick: s,
  frictionCount: a
}) {
  const { color: n, bg: o, border: l } = de(i);
  return /* @__PURE__ */ f(
    "button",
    {
      type: "button",
      onClick: s,
      style: {
        textAlign: "center",
        padding: r ? "16px 14px" : "14px 12px",
        borderRadius: 10,
        background: o,
        border: `${r ? "3px" : "2px"} solid ${l}`,
        boxShadow: r ? `inset 0 0 20px ${l}66, 0 0 12px ${l}33` : "none",
        cursor: "pointer",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",
        position: "relative",
        color: "inherit",
        font: "inherit",
        transform: r ? "scale(1.08)" : "scale(1)",
        minWidth: 120
      },
      children: [
        r && /* @__PURE__ */ e("span", { style: { position: "absolute", top: 6, right: 8, color: "#ffffff", fontSize: 12, fontWeight: 700 }, children: "✓" }),
        /* @__PURE__ */ e("div", { style: { color: n, fontWeight: 600, fontSize: 13 }, children: t }),
        /* @__PURE__ */ f("div", { style: { color: n, fontSize: 26, fontWeight: 700, lineHeight: 1.2 }, children: [
          (i * 100).toFixed(0),
          "%"
        ] }),
        a !== void 0 && a > 0 && /* @__PURE__ */ f("div", { style: { color: "#8b949e", fontSize: 11, marginTop: 4 }, children: [
          a,
          " friction"
        ] })
      ]
    }
  );
}
const H = L(void 0), Oe = ({
  children: t,
  showHeader: i = !0,
  chatPlaceholder: r = "Ask anything...",
  supportPrompts: s = []
}) => {
  const [a, n] = b(i), [o, l] = b(r), [h, c] = b(s), [d, m] = b(null), g = S((p) => n(p), []), k = S((p) => l(p), []), u = S((p) => c(p), []), x = S(
    (p) => {
      m(() => p);
    },
    []
  );
  return /* @__PURE__ */ e(
    H.Provider,
    {
      value: {
        showHeader: a,
        chatPlaceholder: o,
        supportPrompts: h,
        onSupportPromptClick: d,
        setShowHeader: g,
        setChatPlaceholder: k,
        setSupportPrompts: u,
        setOnSupportPromptClick: x
      },
      children: t
    }
  );
}, He = () => {
  const t = W(H);
  if (t === void 0)
    throw new Error("useLayoutConfig must be used within a LayoutConfigProvider");
  return t;
}, fe = {
  tokens: {
    colorBackgroundLayoutMain: {
      light: "#ffffff",
      dark: "#191D23"
    },
    colorBackgroundItemSelected: {
      light: "#ffffff",
      dark: "#2a2f38"
    },
    colorBorderItemSelected: {
      light: "#191D23",
      dark: "#ffffff"
    },
    colorTextAccent: {
      light: "#191D23",
      dark: "#ffffff"
    },
    colorBackgroundSegmentActive: {
      light: "#191D23",
      dark: "#ffffff"
    },
    colorBackgroundControlChecked: {
      light: "#191D23",
      dark: "#ffffff"
    },
    colorBorderItemFocused: {
      light: "#191D23",
      dark: "#ffffff"
    },
    colorBorderInputFocused: {
      light: "#191D23",
      dark: "#ffffff"
    },
    colorBackgroundButtonPrimaryDefault: {
      light: "#191D23",
      dark: "#ffffff"
    },
    colorTextLinkDefault: {
      light: "#191D23",
      dark: "#ffffff"
    },
    colorBackgroundButtonPrimaryHover: {
      light: "#222d3c",
      dark: "#e0e0e0"
    },
    colorBackgroundButtonPrimaryActive: {
      light: "black",
      dark: "#fafafa"
    },
    colorBorderButtonNormalDefault: {
      light: "#191D23",
      dark: "#ffffff"
    },
    colorBackgroundButtonNormalDefault: {
      light: "#ffffff",
      dark: "#191D23"
    },
    colorBackgroundButtonNormalHover: {
      light: "#F3EFE5",
      dark: "#2a2f38"
    },
    colorBackgroundButtonNormalActive: {
      light: "#EBE9E5",
      dark: "#333840"
    },
    colorTextButtonNormalHover: {
      light: "#191D23",
      dark: "#ffffff"
    },
    colorTextButtonNormalActive: {
      light: "#191D23",
      dark: "#ffffff"
    },
    colorBorderButtonNormalHover: {
      light: "#191D23",
      dark: "#ffffff"
    },
    colorBorderButtonNormalActive: {
      light: "#F26322",
      dark: "#F26322"
    },
    colorTextButtonPrimaryDefault: {
      light: "#ffffff",
      dark: "#191D23"
    },
    colorTextButtonPrimaryActive: {
      light: "#ffffff",
      dark: "#191D23"
    },
    colorTextButtonPrimaryHover: {
      light: "#ffffff",
      dark: "#191D23"
    },
    colorTextButtonNormalDefault: {
      light: "#191D23",
      dark: "#ffffff"
    },
    colorBackgroundNotificationGreen: {
      light: "#4C8963",
      dark: "#4C8963"
    },
    colorBorderStatusSuccess: {
      light: "#4C8963",
      dark: "#4C8963"
    },
    colorBackgroundStatusSuccess: {
      light: "#4C8963",
      dark: "#4C8963"
    },
    colorBackgroundNotificationSeverityNeutral: {
      light: "#F3EFE5",
      dark: "#2a2f38"
    },
    colorTextNotificationSeverityNeutral: {
      light: "black",
      dark: "white"
    },
    colorBackgroundContainerContent: {
      light: "#FAF9F7",
      dark: "#191D23"
    },
    colorBackgroundContainerHeader: {
      light: "#FAF9F7",
      dark: "#191D23"
    },
    colorBorderDividerDefault: {
      light: "#EBE9E5",
      dark: "#262A30"
    },
    colorBackgroundToggleButtonNormalPressed: {
      light: "#F3EFE5",
      dark: "#2a2f38"
    },
    colorTextToggleButtonNormalPressed: {
      light: "#191D23",
      dark: "#ffffff"
    },
    colorBorderToggleButtonNormalPressed: {
      light: "#F26322",
      dark: "#F26322"
    },
    colorBackgroundChatBubbleIncoming: {
      light: "#FFFFFF",
      dark: "#000000"
    }
  }
};
function je(t) {
  const i = (t == null ? void 0 : t.theme) ?? fe;
  X({ theme: i });
}
export {
  Ee as AIThinking,
  Be as AnimatedPresence,
  le as EmberTypingMessage,
  De as FadeIn,
  we as FocusGrid,
  Pe as LayoutAnimate,
  Oe as LayoutConfigProvider,
  Te as PopIn,
  Se as RadLayout,
  Ae as ScanInterstitial,
  We as ScoreCell,
  Re as Screensaver,
  $e as SelectionCard,
  Ce as StaggerChildren,
  Ie as StepNav,
  Ne as ThemeProvider,
  Me as ThinkingReasoning,
  Le as TogglePillBar,
  Fe as ToolBar,
  ze as WelcomeMessage,
  je as applyRadTheme,
  fe as radTheme,
  He as useLayoutConfig,
  te as useTheme
};
