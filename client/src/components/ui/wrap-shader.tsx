import * as React from "react";
import { Warp } from "@paper-design/shaders-react";

type WarpShaderHeroProps = {
  title?: string;
  description?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  children?: React.ReactNode;
  align?: "center" | "split";
};

export default function WarpShaderHero({
  title = "Elegant Shader Backgrounds",
  description = "Beautiful, performant shader effects that enhance your content without overwhelming it. Perfect for hero sections, landing pages, and modern web experiences.",
  primaryLabel = "Get Started",
  secondaryLabel = "View Examples",
  children,
  align = "center",
}: WarpShaderHeroProps) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <Warp
          style={{ height: "100%", width: "100%" }}
          proportion={0.45}
          softness={1}
          distortion={0.25}
          swirl={0.8}
          swirlIterations={10}
          shape="checks"
          shapeScale={0.1}
          scale={1}
          rotation={0}
          speed={1}
          colors={[
            "hsl(200, 100%, 20%)",
            "hsl(160, 100%, 75%)",
            "hsl(180, 90%, 30%)",
            "hsl(170, 100%, 80%)",
          ]}
        />
      </div>

      <div className="absolute inset-0 bg-slate-950/35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.5),transparent_50%)]" />

      <div
        className={`relative z-10 min-h-screen px-6 py-10 md:px-8 ${
          align === "split"
            ? "flex items-center"
            : "flex items-center justify-center"
        }`}
      >
        <div
          className={`mx-auto grid w-full max-w-7xl gap-10 ${
            align === "split"
              ? "items-center lg:grid-cols-[1.05fr_0.95fr]"
              : "max-w-4xl text-center"
          }`}
        >
          <div
            className={`space-y-8 ${
              align === "split" ? "text-left" : "text-center"
            }`}
          >
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.26em] text-white/90 backdrop-blur-md">
              AI-Powered Leave Planner
            </div>

            <div className="space-y-5">
              <h1 className="text-balance text-5xl font-sans font-light text-white md:text-7xl">
                {title}
              </h1>

              <p
                className={`text-xl font-sans font-light leading-relaxed text-white/90 md:text-2xl ${
                  align === "split" ? "max-w-2xl" : "mx-auto max-w-3xl"
                }`}
              >
                {description}
              </p>
            </div>

            <div
              className={`flex flex-col gap-4 pt-2 ${
                align === "split"
                  ? "sm:flex-row sm:items-center"
                  : "items-center justify-center sm:flex-row"
              }`}
            >
              <button className="rounded-full border border-white/30 bg-white/20 px-8 py-4 font-medium text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/30">
                {primaryLabel}
              </button>
              <button className="rounded-full bg-white px-8 py-4 font-medium text-gray-800 transition-transform duration-300 hover:scale-105">
                {secondaryLabel}
              </button>
            </div>
          </div>

          {children ? (
            <div className="relative flex justify-center lg:justify-end">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
