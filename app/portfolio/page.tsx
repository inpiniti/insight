"use client";

import { useState } from "react";
import { Nav } from "@/components/Nav";
import { PortfolioPage } from "@/components/PortfolioPage";
import { TweaksPanel, useTweaks, TweakSection, TweakRadio } from "@/components/TweaksPanel";

interface Tweaks {
  cardStyle: "default" | "minimal" | "editorial";
  density: "comfy" | "compact";
  theme: "light" | "dark";
  accent: string;
}

export default function PortfolioPageWrapper() {
  const [tweaks, setTweak] = useTweaks<Tweaks>({
    cardStyle: "default",
    density: "comfy",
    theme: "light",
    accent: "#2f6dff",
  });
  const [lang, setLang] = useState<"ko" | "en">("ko");

  return (
    <div data-theme={tweaks.theme} data-cardstyle={tweaks.cardStyle} data-density={tweaks.density} style={{ "--accent": tweaks.accent } as any}>
      <Nav
        lang={lang}
        theme={tweaks.theme}
        currentPage="portfolio"
        onLangChange={setLang}
        onThemeChange={(theme) => setTweak("theme", theme)}
      />

      <PortfolioPage lang={lang} />

      <TweaksPanel title="Tweaks">
        <TweakSection label={lang === "ko" ? "테마" : "Theme"}>
          <TweakRadio
            value={tweaks.theme}
            onChange={(v) => setTweak("theme", v as any)}
            options={[
              { value: "light", label: lang === "ko" ? "라이트" : "Light" },
              { value: "dark", label: lang === "ko" ? "다크" : "Dark" },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}
