"use client";

import { useState } from "react";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    fitnessLevel: "beginner",
    goal: "general_fitness",
    equipment: ["bodyweight"],
    preferredDuration: 20,
  });

  const goals = [
    { value: "general_fitness", label: "General Fitness" },
    { value: "muscle_building", label: "Build Muscle" },
    { value: "weight_loss", label: "Weight Loss" },
    { value: "flexibility", label: "Flexibility" },
    { value: "endurance", label: "Endurance" },
  ];

  const equipmentOptions = [
    "bodyweight",
    "dumbbells",
    "barbell",
    "resistance_bands",
    "pull_up_bar",
    "bench",
    "kettlebell",
  ];

  function toggleEquipment(item: string) {
    setProfile((p) => ({
      ...p,
      equipment: p.equipment.includes(item)
        ? p.equipment.filter((e) => e !== item)
        : [...p.equipment, item],
    }));
  }

  return (
    <main className={styles.main}>
      <h1>My Profile</h1>
      <p className={styles.subtitle}>
        Configure your preferences for personalized workouts
      </p>

      <section className={styles.section}>
        <h2>Fitness Level</h2>
        <div className={styles.options}>
          {["beginner", "intermediate", "advanced"].map((level) => (
            <button
              key={level}
              className={`${styles.option} ${profile.fitnessLevel === level ? styles.selected : ""}`}
              onClick={() => setProfile((p) => ({ ...p, fitnessLevel: level }))}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Goal</h2>
        <div className={styles.options}>
          {goals.map((g) => (
            <button
              key={g.value}
              className={`${styles.option} ${profile.goal === g.value ? styles.selected : ""}`}
              onClick={() => setProfile((p) => ({ ...p, goal: g.value }))}
            >
              {g.label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Available Equipment</h2>
        <div className={styles.options}>
          {equipmentOptions.map((eq) => (
            <button
              key={eq}
              className={`${styles.option} ${profile.equipment.includes(eq) ? styles.selected : ""}`}
              onClick={() => toggleEquipment(eq)}
            >
              {eq.replace("_", " ")}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Preferred Duration</h2>
        <div className={styles.options}>
          {[15, 20, 30, 45, 60].map((min) => (
            <button
              key={min}
              className={`${styles.option} ${profile.preferredDuration === min ? styles.selected : ""}`}
              onClick={() =>
                setProfile((p) => ({ ...p, preferredDuration: min }))
              }
            >
              {min} min
            </button>
          ))}
        </div>
      </section>

      <button className={styles.saveBtn}>Save Profile</button>
      <p className={styles.hint}>
        Profile data will be saved to Supabase once auth is integrated
      </p>
    </main>
  );
}
