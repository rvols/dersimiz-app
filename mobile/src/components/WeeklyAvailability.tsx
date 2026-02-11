/**
 * Weekly availability: day-first, tap-only UX.
 * Pick a day (Mon–Sun), then tap time slots to toggle. No drag—avoids scroll/gesture conflicts.
 * Slot format: { day: 0-6 (Sun-Sat), start: "HH:00", end: "HH:00" } (1-hour slots).
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from './ui';
import { colors, typography, spacing } from '../theme';

export interface AvailabilitySlot {
  day: number;
  start: string;
  end: string;
}

/** Display: Mon–Sun. Column index 0..6 → day number (0=Sun, 1=Mon, ...). */
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_KEYS = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat'] as const;
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);

function formatTime(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
}

function toSlot(day: number, hour: number): AvailabilitySlot {
  const start = hour === 23 ? '23:00' : `${hour.toString().padStart(2, '0')}:00`;
  const end = hour === 23 ? '24:00' : `${(hour + 1).toString().padStart(2, '0')}:00`;
  return { day, start, end };
}

/** Persona colors from design system: Tutor = Calm Teal; Student = Spark Orange. */
const PERSONA = {
  tutor: {
    accent: colors.calmTeal,
    selectedBg: 'rgba(13, 148, 136, 0.12)',
    selectedBorder: 'rgba(13, 148, 136, 0.3)',
    badgeBg: 'rgba(255,255,255,0.4)',
  },
  student: {
    accent: colors.sparkOrange,
    selectedBg: 'rgba(249, 115, 22, 0.12)',
    selectedBorder: 'rgba(249, 115, 22, 0.3)',
    badgeBg: 'rgba(255,255,255,0.4)',
  },
} as const;

type Props = {
  slots: AvailabilitySlot[];
  onChange: (slots: AvailabilitySlot[]) => void;
  defaultExpandedDay?: number | null;
  onGestureStateChange?: (active: boolean) => void;
  /** 'tutor' = Calm Teal (professional); 'student' = Spark Orange (high energy). Default: tutor. */
  variant?: 'tutor' | 'student';
};

export function WeeklyAvailability({ slots, onChange, defaultExpandedDay = null, variant = 'tutor' }: Props) {
  const { t } = useTranslation();
  const persona = PERSONA[variant];
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    if (defaultExpandedDay != null && defaultExpandedDay >= 0 && defaultExpandedDay <= 6) {
      const idx = DISPLAY_ORDER.indexOf(defaultExpandedDay);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const selectedDayNumber = DISPLAY_ORDER[selectedDayIndex] ?? 1;

  const hasSlot = useCallback(
    (day: number, hour: number) => {
      const start = hour === 23 ? '23:00' : `${hour.toString().padStart(2, '0')}:00`;
      const end = hour === 23 ? '24:00' : `${(hour + 1).toString().padStart(2, '0')}:00`;
      return slots.some((s) => s.day === day && s.start === start && s.end === end);
    },
    [slots]
  );

  const toggleSlot = useCallback(
    (day: number, hour: number) => {
      const start = hour === 23 ? '23:00' : `${hour.toString().padStart(2, '0')}:00`;
      const end = hour === 23 ? '24:00' : `${(hour + 1).toString().padStart(2, '0')}:00`;
      const exists = slots.some((s) => s.day === day && s.start === start && s.end === end);
      let next: AvailabilitySlot[];
      if (exists) {
        next = slots.filter((s) => !(s.day === day && s.start === start && s.end === end));
      } else {
        next = [...slots, toSlot(day, hour)].sort(
          (a, b) => (a.day !== b.day ? a.day - b.day : a.start.localeCompare(b.start))
        );
      }
      onChange(next);
    },
    [slots, onChange]
  );

  const selectAllDay = useCallback(() => {
    const rest = slots.filter((s) => s.day !== selectedDayNumber);
    const newSlots = HOURS_24.map((h) => toSlot(selectedDayNumber, h));
    const next = [...rest, ...newSlots].sort(
      (a, b) => (a.day !== b.day ? a.day - b.day : a.start.localeCompare(b.start))
    );
    onChange(next);
  }, [slots, onChange, selectedDayNumber]);

  const clearDay = useCallback(() => {
    const next = slots.filter((s) => s.day !== selectedDayNumber);
    onChange(next);
  }, [slots, onChange, selectedDayNumber]);

  /** 8 AM–6 PM (hours 8 through 17 inclusive). */
  const selectDaytime = useCallback(() => {
    const rest = slots.filter((s) => s.day !== selectedDayNumber);
    const daytimeHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
    const newSlots = daytimeHours.map((h) => toSlot(selectedDayNumber, h));
    const next = [...rest, ...newSlots].sort(
      (a, b) => (a.day !== b.day ? a.day - b.day : a.start.localeCompare(b.start))
    );
    onChange(next);
  }, [onChange, selectedDayNumber]);

  const countSelectedForDay = useMemo(() => {
    return HOURS_24.filter((h) => hasSlot(selectedDayNumber, h)).length;
  }, [slots, selectedDayNumber, hasSlot]);

  const countSelectedWeek = useMemo(() => slots.length, [slots]);

  const countByDay = useMemo(() => {
    const map: Record<number, number> = {};
    DISPLAY_ORDER.forEach((dayNum) => {
      map[dayNum] = HOURS_24.filter((h) => hasSlot(dayNum, h)).length;
    });
    return map;
  }, [slots, hasSlot]);

  const slotInfoRef = React.useRef<ScrollView>(null);

  // Auto-preselect 8AM-6PM (Hours 8-17) for all days if slots are empty on mount
  React.useEffect(() => {
    if (slots.length === 0) {
      const daytimeHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
      const initialSlots: AvailabilitySlot[] = [];
      DISPLAY_ORDER.forEach(day => {
        daytimeHours.forEach(h => {
          initialSlots.push(toSlot(day, h));
        });
      });
      // Sort
      initialSlots.sort((a, b) => (a.day !== b.day ? a.day - b.day : a.start.localeCompare(b.start)));
      onChange(initialSlots);
    }
  }, []); // Only on mount

  // Auto-scroll: first selected hour to top; if none selected, scroll to top
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!slotInfoRef.current) return;
      const firstHour = HOURS_24.find(h => hasSlot(selectedDayNumber, h));
      const y = firstHour !== undefined ? firstHour * 48 : 0;
      slotInfoRef.current.scrollTo({ y, animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedDayNumber, slots]);

  return (
    <Card style={styles.card} noPadding>
      <Text style={styles.instruction}>
        {t('availability.tap_hint', { defaultValue: 'Choose a day, then tap time slots to set availability.' })}
      </Text>

      {/* Day selector: Mon – Sun */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayRow}
        style={styles.dayScroll}
      >
        {DISPLAY_ORDER.map((dayNum, index) => {
          const dayKey = DAY_KEYS[dayNum];
          const isSelected = index === selectedDayIndex;
          const count = countByDay[dayNum] ?? 0;
          return (
            <TouchableOpacity
              key={dayNum}
              style={[
                styles.dayPill,
                isSelected && [styles.dayPillSelected, { backgroundColor: persona.accent, borderColor: persona.accent }],
              ]}
              onPress={() => setSelectedDayIndex(index)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dayPillText, isSelected && styles.dayPillTextSelected]} numberOfLines={1}>
                {t(`availability.${dayKey}`)}
              </Text>
              {count > 0 && (
                <View style={[styles.dayBadge, isSelected && { backgroundColor: persona.badgeBg }]}>
                  <Text style={[styles.dayBadgeText, isSelected && styles.dayBadgeTextSelected]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Time slots for selected day */}
      <View style={styles.slotSection}>
        <View style={styles.slotHeader}>
          <Text style={styles.slotHeaderTitle}>
            {t('availability.hours', { defaultValue: 'Hours' })}
          </Text>
          <View style={styles.slotHeaderActions}>
            <TouchableOpacity onPress={clearDay} style={styles.slotHeaderBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.slotHeaderBtnText}>{t('availability.clear_day', { defaultValue: 'Clear' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={selectDaytime} style={styles.slotHeaderBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.slotHeaderBtnTextPrimary, { color: persona.accent }]}>{t('availability.daytime', { defaultValue: 'Daytime' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={selectAllDay} style={styles.slotHeaderBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.slotHeaderBtnTextPrimary, { color: persona.accent }]}>{t('availability.select_all_day', { defaultValue: 'All day' })}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView ref={slotInfoRef} style={styles.slotList} showsVerticalScrollIndicator={true} nestedScrollEnabled>
          {HOURS_24.map((hour) => {
            const selected = hasSlot(selectedDayNumber, hour);
            return (
              <TouchableOpacity
                key={hour}
                style={[
                  styles.slotRow,
                  selected && {
                    backgroundColor: persona.selectedBg,
                    borderBottomColor: persona.selectedBorder,
                  },
                ]}
                onPress={() => toggleSlot(selectedDayNumber, hour)}
                activeOpacity={0.7}
              >
                <Text style={[styles.slotRowLabel, selected && { color: persona.accent, fontWeight: '500' }]}>
                  {formatTime(hour)} – {hour === 23 ? '12:00 AM' : formatTime(hour + 1)}
                </Text>
                <View
                  style={[
                    styles.slotRowIndicator,
                    selected && { borderColor: persona.accent, backgroundColor: persona.accent },
                  ]}
                >
                  {selected && <Text style={styles.slotRowCheck}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {t('availability.hours_selected_day', { count: countSelectedForDay, defaultValue: '{{count}} hours on this day' })}
            {' · '}
            {t('availability.hours_selected_week', { total: countSelectedWeek, defaultValue: '{{total}} hours this week' })}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  instruction: {
    ...typography.body,
    color: colors.slateText,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    textAlign: 'center',
  },
  dayScroll: {
    maxHeight: 56,
  },
  dayRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.mistBlue,
    borderWidth: 1,
    borderColor: colors.outlineGrey,
    minWidth: 44,
  },
  dayPillSelected: {
    /* accent + border set per persona (tutor=Calm Teal, student=Spark Orange) */
  },
  dayPillText: {
    ...typography.label,
    color: colors.carbonText,
  },
  dayPillTextSelected: {
    color: colors.cleanWhite,
  },
  dayBadge: {
    marginLeft: 4,
    backgroundColor: colors.outlineGrey,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  dayBadgeSelected: {
    /* badgeBg set per persona */
  },
  dayBadgeText: {
    ...typography.caption,
    color: colors.carbonText,
    fontWeight: '600',
  },
  dayBadgeTextSelected: {
    color: colors.cleanWhite,
  },
  slotSection: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineGrey,
    backgroundColor: colors.cleanWhite,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.mistBlue,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineGrey,
  },
  slotHeaderTitle: {
    ...typography.sectionTitle,
    color: colors.carbonText,
    flex: 1,
  },
  slotHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  slotHeaderBtn: {},
  slotHeaderBtnText: {
    ...typography.label,
    color: colors.slateText,
  },
  slotHeaderBtnTextPrimary: {
    ...typography.label,
    /* color set per persona */
  },
  slotList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    maxHeight: 320,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineGrey,
    minHeight: 48,
    backgroundColor: colors.cleanWhite,
  },
  slotRowSelected: {
    /* backgroundColor + borderBottomColor set per persona */
  },
  slotRowLabel: {
    ...typography.body,
    color: colors.carbonText,
  },
  slotRowLabelSelected: {
    fontWeight: '500',
    /* color set per persona */
  },
  slotRowIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.outlineGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotRowIndicatorSelected: {
    /* borderColor + backgroundColor set per persona */
  },
  slotRowCheck: {
    color: colors.cleanWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  summary: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outlineGrey,
    backgroundColor: colors.mistBlue,
  },
  summaryText: {
    ...typography.caption,
    color: colors.slateText,
    textAlign: 'center',
  },
});
