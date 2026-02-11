/**
 * Hierarchical location picker driven by GET /api/v1/locations.
 * No country-specific logic: step label and list come from API response (type + locations).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing } from '../theme';
import { fetchLocations } from '../services/locations';
import type { LocationItem } from '../types/api';

const localeName = (item: LocationItem, lang: 'en' | 'tr') => item.name?.[lang] ?? item.name?.en ?? item.name?.tr ?? '';

export interface LocationPickerResult {
  location_id: string;
  breadcrumb: string[];
}

type StepLabelKey = 'select_country' | 'select_state' | 'select_city' | 'select_district' | 'select_location';

const typeToLabelKey: Record<string, StepLabelKey> = {
  country: 'select_country',
  state: 'select_state',
  city: 'select_city',
  district: 'select_district',
};

export function LocationPicker({
  locale = 'en',
  onSelect,
  onCancel,
  initialBreadcrumb,
}: {
  locale?: 'tr' | 'en';
  onSelect: (result: LocationPickerResult) => void;
  onCancel?: () => void;
  initialBreadcrumb?: string[];
}) {
  const { t } = useTranslation();
  const [path, setPath] = useState<{ id: string; name: string; type: string }[]>(() =>
    (initialBreadcrumb ?? []).length > 0 ? [] : []
  );
  const [options, setOptions] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lang = locale === 'tr' ? 'tr' : 'en';

  const loadLevel = useCallback(
    async (parentId: string | null) => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchLocations(parentId ?? undefined);
        setOptions(list);
      } catch {
        setError(t('common.retry'));
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    loadLevel(path.length > 0 ? path[path.length - 1].id : null);
  }, []);

  const handleSelect = async (item: LocationItem) => {
    const name = localeName(item, lang);
    setLoading(true);
    try {
      const children = await fetchLocations(item.id);
      if (children.length === 0) {
        onSelect({
          location_id: item.id,
          breadcrumb: [...path.map((p) => p.name), name],
        });
        return;
      }
      setPath((prev) => [...prev, { id: item.id, name, type: item.type }]);
      setOptions(children);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (path.length === 0) {
      onCancel?.();
      return;
    }
    if (path.length === 1) {
      setPath([]);
      loadLevel(null);
      return;
    }
    const newPath = path.slice(0, -1);
    setPath(newPath);
    loadLevel(newPath[newPath.length - 1].id);
  };

  const stepLabelKey = options.length > 0 ? (typeToLabelKey[options[0].type] ?? 'select_location') : 'select_location';
  const stepLabel = t(`onboarding.${stepLabelKey}`);

  if (loading && options.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.electricAzure} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (error && options.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => loadLevel(path.length > 0 ? path[path.length - 1].id : null)} style={styles.retryBtn}>
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {(path.length > 0 || onCancel) && (
        <TouchableOpacity onPress={handleBack} style={styles.backRow}>
          <Text style={styles.backText}>{path.length > 0 ? `← ${t('onboarding.back')}` : t('common.cancel')}</Text>
        </TouchableOpacity>
      )}
      {path.length > 0 && (
        <Text style={styles.breadcrumb} numberOfLines={1}>
          {path.map((p) => p.name).join(' › ')}
        </Text>
      )}
      <Text style={styles.stepLabel}>{stepLabel}</Text>
      <FlatList
        data={options}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.option} onPress={() => handleSelect(item)}>
            <Text style={styles.optionText}>{localeName(item, lang)}</Text>
          </TouchableOpacity>
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          path.length > 0 ? (
            <Text style={styles.emptyText}>{t('onboarding.no_locations')}</Text>
          ) : (
            <Text style={styles.emptyText}>{t('onboarding.no_locations')}</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  loadingText: { ...typography.body, color: colors.slateText, marginTop: spacing.sm },
  errorText: { ...typography.body, color: colors.alertCoral, marginBottom: spacing.sm },
  retryBtn: { padding: spacing.sm },
  retryText: { ...typography.body, color: colors.electricAzure },
  backRow: { paddingVertical: spacing.sm, paddingHorizontal: 0 },
  backText: { ...typography.body, color: colors.electricAzure },
  breadcrumb: { ...typography.caption, color: colors.slateText, marginBottom: spacing.xs },
  stepLabel: { ...typography.label, color: colors.carbonText, marginBottom: spacing.sm },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.xl },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineGrey,
  },
  optionText: { ...typography.body, color: colors.carbonText },
  emptyText: { ...typography.body, color: colors.slateText, padding: spacing.lg },
});
