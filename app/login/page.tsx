"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUser, getUser } from "@/lib/firestore";
import { useAuthStore } from "@/stores/authStore";
import { useT } from "@/lib/i18n";

type Step = "email" | "name";

export default function LoginPage() {
  const t = useT();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      // Try sign in first, if fails try create account
      let result;
      try {
        result = await signInWithEmailAndPassword(auth, email, password);
      } catch {
        result = await createUserWithEmailAndPassword(auth, email, password);
      }

      const existing = await getUser(result.user.uid);
      if (existing?.displayName) {
        useAuthStore.getState().setProfile(existing);
      } else {
        setStep("name");
      }
    } catch (e: unknown) {
      const msg = (e as Error).message || "";
      if (msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError(t("auth.wrongPassword"));
      } else if (msg.includes("weak-password")) {
        setError(t("auth.weakPassword"));
      } else {
        setError(msg || t("common.error"));
      }
    }
    setLoading(false);
  };

  const handleSetName = async () => {
    setError("");
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      await createUser(user.uid, user.email || "", name);
      await useAuthStore.getState().refreshProfile();
    } catch (e: unknown) {
      setError((e as Error).message || t("common.error"));
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🛡️</div>
          <h1 className="text-3xl font-bold text-slate-800">
            {t("auth.welcome")}
          </h1>
          <p className="text-slate-500 mt-2">{t("auth.subtitle")}</p>
        </div>

        {step === "email" && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              {t("auth.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-lg text-slate-800 text-center"
              dir="ltr"
            />
            <label className="block text-sm font-medium text-slate-700">
              {t("auth.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
              className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-lg text-slate-800 text-center"
              dir="ltr"
            />
            <p className="text-xs text-slate-400 text-center">
              {t("auth.autoCreate")}
            </p>
            <button
              onClick={handleSignIn}
              disabled={loading || !email || password.length < 6}
              className="w-full py-4 rounded-2xl bg-green-500 text-white font-bold text-lg shadow-lg disabled:opacity-50"
            >
              {loading ? "..." : t("auth.signIn")}
            </button>
          </div>
        )}

        {step === "name" && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              {t("auth.yourName")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("auth.namePlaceholder")}
              className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-lg text-slate-800 text-center"
            />
            <button
              onClick={handleSetName}
              disabled={loading || name.length < 1}
              className="w-full py-4 rounded-2xl bg-green-500 text-white font-bold text-lg shadow-lg disabled:opacity-50"
            >
              {loading ? "..." : t("auth.continue")}
            </button>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}
