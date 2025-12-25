"use client";

import { useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { Profile } from "@/types/database";

export function useAuth() {
  const { user, profile, isLoading, setUser, setProfile, setIsLoading, reset } =
    useAuthStore();

  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(
    async (userId: string) => {
      if (!supabase) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      }
    },
    [supabase, setProfile]
  );

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        reset();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setUser, setIsLoading, fetchProfile, reset]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    reset();
  }, [supabase, reset]);

  const updateProfile = useCallback(
    async (updates: Partial<Omit<Profile, "id" | "created_at">>) => {
      if (!user || !supabase) return { error: "Not authenticated" };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      }

      return { data, error };
    },
    [user, supabase, setProfile]
  );

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isAnonymous: user?.is_anonymous ?? false,
    signOut,
    updateProfile,
    refreshProfile: useCallback(
      () => user && fetchProfile(user.id),
      [user, fetchProfile]
    ),
  };
}
