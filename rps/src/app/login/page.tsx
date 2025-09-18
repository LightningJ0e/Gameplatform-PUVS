"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pageClass, setPageClass] = useState("page-slide-in-from-left");

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await login(username, password);
    if (success) {
      setPageClass("page-slide-out-right");
      setTimeout(() => {
        router.push("/");
      }, 500);
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div
      className={`h-full bg-slate-900 flex items-center justify-center px-4 ${pageClass}`}
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-gray-400">
            Or{" "}
            <button
              onClick={() => {
                setPageClass("page-slide-out-right");
                setTimeout(() => router.push("/register"), 500);
              }}
              className="text-blue-500 hover:text-blue-400"
            >
              create an account
            </button>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Username"
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Password"
              />
            </div>
          </div>

          {error && <p className="text-red-400 mb-4">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
