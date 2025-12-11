'use client';

import { useEffect, useState } from 'react';
import {
  isFeatureEnabled,
  FeatureFlag,
  getFlagConfig,
} from '@/lib/feature-flags';

interface UseFeatureFlagResult {
  enabled: boolean;
  loading: boolean;
  description: string | null;
}

/**
 * Hook para verificar si una feature está habilitada para el usuario actual
 */
export function useFeatureFlag(flag: FeatureFlag): UseFeatureFlagResult {
  const [state, setState] = useState<UseFeatureFlagResult>({
    enabled: false,
    loading: true,
    description: null,
  });

  useEffect(() => {
    async function checkFlag() {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.user) {
          const enabled = isFeatureEnabled(flag, data.user.id, data.user.rol);
          const config = getFlagConfig(flag);

          setState({
            enabled,
            loading: false,
            description: config.description,
          });
        } else {
          // Sin sesión, solo verificar flag global
          const config = getFlagConfig(flag);
          setState({
            enabled: isFeatureEnabled(flag),
            loading: false,
            description: config.description,
          });
        }
      } catch (error) {
        console.error('Error checking feature flag:', error);
        setState({
          enabled: false,
          loading: false,
          description: null,
        });
      }
    }

    checkFlag();
  }, [flag]);

  return state;
}

/**
 * Hook para verificar múltiples flags a la vez
 */
export function useFeatureFlags(
  flags: FeatureFlag[]
): Record<FeatureFlag, boolean> & { loading: boolean } {
  const [state, setState] = useState<
    Record<FeatureFlag, boolean> & { loading: boolean }
  >(() => {
    const initial: any = { loading: true };
    flags.forEach((f) => (initial[f] = false));
    return initial;
  });

  useEffect(() => {
    async function checkFlags() {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        const results: any = { loading: false };

        for (const flag of flags) {
          if (data.user) {
            results[flag] = isFeatureEnabled(flag, data.user.id, data.user.rol);
          } else {
            results[flag] = isFeatureEnabled(flag);
          }
        }

        setState(results);
      } catch (error) {
        console.error('Error checking feature flags:', error);
        const results: any = { loading: false };
        flags.forEach((f) => (results[f] = false));
        setState(results);
      }
    }

    checkFlags();
  }, [flags.join(',')]);

  return state;
}
