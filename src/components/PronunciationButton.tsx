"use client";

import { useCallback, useEffect, useState } from "react";

/** macOS 自带的恶搞音色同样申报 en-US，不排除就会念出卡通声音 */
const GIMMICK =
  /\b(bad news|bahh|bells|boing|brick|bubbles|cellos|deranged|fred|good news|hysterical|jester|junior|kathy|misty|oma|oreo|ralph|superstar|trinoids|whisper|wobble|zarvox|pipe organ|albert|moira|tessa|rishi)\b/i;
/** 神经网络 / 在线音色，以及各系统的招牌英文音色 */
const NATURAL = /(natural|neural|premium|enhanced|google\s)/i;
const SIGNATURE = /(samantha|aria|jenny|zira|conrad|susan|alex|karen|daniel|serena|nora)/i;

function voiceScore(v: SpeechSynthesisVoice): number {
  if (GIMMICK.test(v.name)) return -1;
  const lang = v.lang.replace("_", "-").toLowerCase();
  let s = 0;
  if (lang === "en-us") s += 30;
  else if (lang === "en-gb") s += 22;
  else if (lang.startsWith("en")) s += 16;
  else return -1;
  if (NATURAL.test(v.name)) s += 24;
  if (SIGNATURE.test(v.name)) s += 14;
  return s;
}

let cachedVoice: SpeechSynthesisVoice | null | undefined;

/** 音色表是异步加载的，首次 getVoices() 会返回空数组，必须等 voiceschanged */
function loadEnglishVoice(): Promise<SpeechSynthesisVoice | null> {
  if (cachedVoice !== undefined) return Promise.resolve(cachedVoice);
  const synth = window.speechSynthesis;
  if (!synth) return Promise.resolve(null);
  const ranked = (voices: SpeechSynthesisVoice[]) =>
    voices
      .map((v) => ({ v, n: voiceScore(v) }))
      .filter((x) => x.n >= 0)
      .sort((a, b) => b.n - a.n)[0]?.v ?? null;

  const settle = () => {
    const voices = synth.getVoices();
    const best = ranked(voices);
    if (voices.length) cachedVoice = best;
    return best;
  };
  if (synth.getVoices().length) return Promise.resolve(settle());
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve(settle());
    };
    synth.addEventListener("voiceschanged", finish, { once: true });
    setTimeout(finish, 2000);
  });
}

/** 只有拉丁文标题值得发音，中文标题不渲染按钮 */
export function isSpeakableEnglish(text: string | undefined | null): boolean {
  if (!text) return false;
  return !/[\u3400-\u9fff]/.test(text) && /[a-z]/i.test(text);
}

export default function PronunciationButton({
  text,
  locale = "zh",
  className = "",
}: {
  text: string;
  locale?: "zh" | "en";
  className?: string;
}) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    void loadEnglishVoice();
    return () => window.speechSynthesis?.cancel();
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const play = useCallback(async () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const voice = await loadEnglishVoice();
    const u = new SpeechSynthesisUtterance(
      text.replace(/[_\-/.]+/g, " ").replace(/\s+/g, " ").trim()
    );
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else {
      u.lang = "en-US";
    }
    u.rate = 0.92;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  }, [text]);

  if (!isSpeakableEnglish(text)) return null;

  const label =
    locale === "en"
      ? `Hear the pronunciation of ${text}`
      : `听 ${text} 的英文发音`;

  return (
    <button
      type="button"
      className={
        "pronunciation-button" +
        (speaking ? " is-speaking" : "") +
        (className ? " " + className : "")
      }
      aria-label={label}
      title={label}
      onClick={() => (speaking ? stop() : play())}
    >
      <i className="ti ti-volume" aria-hidden="true" />
    </button>
  );
}
