"use client";

import { useRef, useCallback } from "react";

/**
 * Voice coaching via Web Speech API.
 * Queues messages and speaks them one at a time.
 * Has cooldown to avoid spamming corrections.
 */
export function useVoiceCoach() {
  const lastSpokenRef = useRef<Map<string, number>>(new Map());
  const speakingRef = useRef(false);
  const queueRef = useRef<string[]>([]);

  const processQueue = useCallback(() => {
    if (speakingRef.current || queueRef.current.length === 0) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const text = queueRef.current.shift()!;
    speakingRef.current = true;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      speakingRef.current = false;
      processQueue();
    };

    utterance.onerror = () => {
      speakingRef.current = false;
      processQueue();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  /**
   * Speak a message. Uses a cooldown key to avoid repeating
   * the same type of feedback too frequently.
   */
  const speak = useCallback(
    (text: string, cooldownKey?: string, cooldownMs = 5000) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      // Check cooldown
      if (cooldownKey) {
        const lastTime = lastSpokenRef.current.get(cooldownKey) || 0;
        if (Date.now() - lastTime < cooldownMs) return;
        lastSpokenRef.current.set(cooldownKey, Date.now());
      }

      queueRef.current.push(text);
      processQueue();
    },
    [processQueue]
  );

  /** Announce rep count */
  const announceRep = useCallback(
    (rep: number) => {
      speak(`${rep}`, `rep_${rep}`, 2000);
    },
    [speak]
  );

  /** Announce form correction */
  const announceCorrection = useCallback(
    (correction: string) => {
      speak(correction, correction, 6000);
    },
    [speak]
  );

  /** Announce exercise start */
  const announceExercise = useCallback(
    (name: string, sets: number, reps: number) => {
      speak(`${name}. ${sets} sets of ${reps} reps. Let's go!`);
    },
    [speak]
  );

  /** Announce workout complete */
  const announceComplete = useCallback(() => {
    speak("Great workout! You're done. Nice job!");
  }, [speak]);

  /** Stop all speech */
  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    queueRef.current = [];
    speakingRef.current = false;
  }, []);

  return { speak, announceRep, announceCorrection, announceExercise, announceComplete, stop };
}
