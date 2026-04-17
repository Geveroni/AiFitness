"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const [fitnessLevel, setFitnessLevel] = useState<string>("beginner");

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1 className={styles.title}>AI Fitness Trainer</h1>
        <p className={styles.subtitle}>
          Your personal AI coach with real-time form feedback
        </p>
      </div>

      <div className={styles.cards}>
        <Link href="/workout" className={styles.card}>
          <div className={styles.cardIcon}>&#127947;</div>
          <h2>Start Workout</h2>
          <p>Generate a personalized workout with AI coaching</p>
        </Link>

        <Link href="/workout?quick=true" className={styles.card}>
          <div className={styles.cardIcon}>&#9889;</div>
          <h2>Quick Session</h2>
          <p>Jump into a 15-minute guided workout</p>
        </Link>

        <Link href="/profile" className={styles.card}>
          <div className={styles.cardIcon}>&#128100;</div>
          <h2>My Profile</h2>
          <p>Set your goals, equipment, and fitness level</p>
        </Link>
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <h3>AI Avatar Coach</h3>
          <p>Real-time video avatar guides you through every exercise</p>
        </div>
        <div className={styles.feature}>
          <h3>Form Analysis</h3>
          <p>Camera-based pose estimation scores your form instantly</p>
        </div>
        <div className={styles.feature}>
          <h3>Smart Plans</h3>
          <p>Workouts adapt to your level, goals, and available equipment</p>
        </div>
      </div>
    </main>
  );
}
