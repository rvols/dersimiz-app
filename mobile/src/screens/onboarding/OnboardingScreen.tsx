import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card } from '../../components/ui';
import { SafeTopView } from '../../components/SafeTopView';
import { LocationPicker } from '../../components/LocationPicker';
import { WeeklyAvailability, type AvailabilitySlot } from '../../components/WeeklyAvailability';
import { useToast } from '../../contexts/ToastContext';
import { colors, typography, spacing } from '../../theme';
import { api, getApiErrorMessage } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { pickAndUploadAvatar } from '../../services/avatar';
import type { OnboardingData, LessonType, Grade } from '../../types/api';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const lang = (i18n.language?.startsWith('tr') ? 'tr' : 'en') as 'tr' | 'en';

  // Helper to get locale string; normalize language (e.g. 'tr-TR' -> 'tr') so db-fetched fields translate
  const localeKey = (obj: Record<string, string> | undefined) =>
    obj?.[lang] ?? obj?.en ?? obj?.tr ?? '';

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [data, setOnboardingData] = useState<OnboardingData | null>(null);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [locationBreadcrumb, setLocationBreadcrumb] = useState<string[]>([]);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [schoolTypeId, setSchoolTypeId] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [gradeId, setGradeId] = useState<string>('');
  const [bio, setBio] = useState('');
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  // Per-lesson pricing: key=lesson_type_id, value=price_cents string
  const [prices, setPrices] = useState<Record<string, string>>({});

  // ... (previous state declarations)

  const isTutor = user?.role === 'tutor';
  const totalSteps = isTutor ? 8 : 7;

  const [selectedSchoolTypeIds, setSelectedSchoolTypeIds] = useState<string[]>([]);
  const [gradesBySchoolType, setGradesBySchoolType] = useState<Record<string, string[]>>({});
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Load initial data if needed (e.g. from user)
  useEffect(() => {
    const fetchOnboardingData = async () => {
      try {
        const { data: res } = await api.get<{ data: OnboardingData }>('/onboarding/data');
        setOnboardingData(res.data);
      } catch (err) {
        toast.showError(t('common.error_loading_data'));
      }
    };
    fetchOnboardingData();
  }, []);

  const toggleTutorSchoolType = (id: string) => {
    setSelectedSchoolTypeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleTutorGrade = (stId: string, gId: string) => {
    setGradesBySchoolType(prev => {
      const current = prev[stId] ?? [];
      const newGrades = current.includes(gId) ? current.filter(x => x !== gId) : [...current, gId];
      return { ...prev, [stId]: newGrades };
    });
  };

  const saveStep = async (dataToSave: Record<string, unknown>, finish = false) => {
    const newSaved = { ...saved, ...dataToSave };
    setSaved(newSaved);
    if (finish) {
      try {
        setLoading(true);
        await api.post('/onboarding/complete', { ...newSaved, onboarding_completed: true });
        if (user) setUser({ ...user, onboarding_completed: true });
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } catch (e) {
        toast.showError(getApiErrorMessage(e));
      } finally {
        setLoading(false);
      }
      return;
    } else {
      // background save
      api.post('/onboarding/step', { step, data: dataToSave }).catch(() => { });
    }
  };

  const handleNext = async () => {
    if (step === 0) {
      if (!fullName.trim() || !birthYear.trim() || !gender) { toast.showError(t('onboarding.fill_all_fields')); return; }
      saveStep({ full_name: fullName, birth_year: birthYear, gender });
      setStep(s => s + 1);
    } else if (step === 1) {
      if (!locationId) { toast.showError(t('onboarding.select_location_error')); return; }
      saveStep({ location_id: locationId });
      setStep(s => s + 1);
    } else if (step === 2) {
      if (isTutor) {
        if (selectedSchoolTypeIds.length === 0) { toast.showError(t('onboarding.select_school_type')); return; }
        const missingGrade = selectedSchoolTypeIds.find(stId => !(gradesBySchoolType[stId]?.length));
        if (missingGrade) {
          toast.showError(t('onboarding.select_at_least_one_grade', { defaultValue: 'Select at least one grade for each school type.' }));
          return;
        }
        saveStep({ school_type_ids: selectedSchoolTypeIds, grades_by_school_type: gradesBySchoolType });
      } else {
        if (!schoolTypeId || !gradeId) { toast.showError(t('onboarding.fill_all_fields')); return; }
        saveStep({ school_type_id: schoolTypeId, grade_id: gradeId, school_name: schoolName });
      }
      setStep(s => s + 1);
    } else if (step === 3) {
      if (!bio.trim()) { toast.showError(t('onboarding.bio_required')); return; }
      saveStep({ bio });
      setStep(s => s + 1);
    } else if (step === 4 && isTutor) {
      if (selectedLessonIds.length === 0) {
        toast.showError(t('onboarding.lesson_price_required'));
        return;
      }

      // key: lesson_type_id, value: price in cents
      const finalPrices: Record<string, number> = {};

      for (const ltId of selectedLessonIds) {
        const pStr = prices[ltId];
        if (!pStr || !pStr.trim()) {
          toast.showError(t('onboarding.enter_price_for_all'));
          return;
        }
        const cent = parseInt(pStr, 10) * 100; // Assuming input is integer TRY
        if (isNaN(cent) || cent <= 0) {
          toast.showError(t('onboarding.invalid_price'));
          return;
        }
        finalPrices[ltId] = cent;
      }

      setLoading(true);
      try {
        // Post each lesson price
        for (const ltId of selectedLessonIds) {
          await api.post('/tutor/lessons', {
            lesson_type_id: ltId,
            price_per_hour_cents: finalPrices[ltId],
            currency: 'TRY',
          });
        }
        // Save step data (we save the map for restore)
        await api.post('/onboarding/step', {
          step,
          data: {
            lesson_type_ids: selectedLessonIds,
            prices: prices
          }
        });
        setStep((s) => Math.min(s + 1, totalSteps - 1));
      } catch (err) {
        toast.showError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    } else if (step === 4 && !isTutor) {
      saveStep({ lesson_interests: selectedLessonIds });
    } else if (step === 5 && isTutor) {
      setLoading(true);
      try {
        await api.put('/tutor/availability', { slots: availabilitySlots });
        await api.post('/onboarding/step', { step, data: { availability_slots: availabilitySlots } });
        setStep((s) => s + 1);
      } catch (err) {
        toast.showError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    } else if (step === 5 && !isTutor) {
      saveStep({ photo_uploaded: true });
      setStep((s) => s + 1);
    } else if (step === 6 && isTutor) {
      saveStep({ photo_uploaded: true });
      setStep((s) => s + 1);
    } else if (step === totalSteps - 1) {
      saveStep({}, true);
    } else {
      setStep((s) => s + 1);
    }
  };

  if (!data) {
    return (
      <SafeTopView>
        <View style={styles.centered}>
          <Text style={styles.loading}>{t('common.loading')}</Text>
        </View>
      </SafeTopView>
    );
  }

  const lessonTypes = data.lesson_types || [];

  // When location picker is open, render it full-screen outside ScrollView so its FlatList is not nested (fixes VirtualizedList warning).
  if (step === 1 && locationPickerVisible) {
    return (
      <SafeTopView>
        <View style={styles.container}>
          <View style={styles.progressWrap}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
            </View>
            <Text style={styles.stepLabel}>
              {step + 1} / {totalSteps}
            </Text>
          </View>
          <View style={styles.pickerFull}>
            <LocationPicker
              locale={lang}
              onSelect={({ location_id, breadcrumb }) => {
                setLocationId(location_id);
                setLocationBreadcrumb(breadcrumb);
                setLocationPickerVisible(false);
              }}
              onCancel={() => setLocationPickerVisible(false)}
            />
          </View>
        </View>
      </SafeTopView>
    );
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] }));
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeTopView>
      <View style={styles.container}>
        <View style={styles.onboardingHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.headerBtn} accessibilityLabel={t('onboarding.back')}>
            <Ionicons name="chevron-back" size={26} color={colors.carbonText} />
          </TouchableOpacity>
          <Text style={styles.stepLabel}>{step + 1} / {totalSteps}</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.headerBtn} accessibilityLabel={t('profile.logout')}>
            <Ionicons name="log-out-outline" size={22} color={colors.carbonText} />
          </TouchableOpacity>
        </View>
        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
          </View>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

          {step === 0 && (
            <>
              <Text style={styles.title}>{t('onboarding.personal_info')}</Text>
              <Input label={t('onboarding.name')} value={fullName} onChangeText={setFullName} />
              <Input
                label={t('onboarding.birth_year')}
                value={birthYear}
                onChangeText={setBirthYear}
                keyboardType="number-pad"
                placeholder="1990"
              />
              <View style={styles.genderRow}>
                {['male', 'female', 'other'].map((g) => (
                  <Button
                    key={g}
                    title={t(`onboarding.${g}`)}
                    variant={gender === g ? 'primary' : 'outline'}
                    onPress={() => setGender(g)}
                    size="small"
                    style={styles.genderBtn}
                  />
                ))}
              </View>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.title}>{t('onboarding.location')}</Text>
              <Text style={styles.locationSubtitle}>{t('onboarding.location_subtitle', { defaultValue: 'Tap below to choose your country, city, and district.' })}</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setLocationPickerVisible(true)}
                style={styles.locationTouchWrap}
              >
                <Card style={styles.locationCard}>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={22} color={locationId ? colors.electricAzure : colors.slateText} />
                    <Text style={[styles.locationLabel, !locationId && styles.locationLabelPlaceholder]} numberOfLines={2}>
                      {locationBreadcrumb.length > 0 ? locationBreadcrumb.join(' › ') : t('onboarding.select_location')}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.slateText} />
                  </View>
                </Card>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.title}>{t('onboarding.education')}</Text>
              <Text style={styles.label}>{t('onboarding.school_type')}</Text>
              <View style={styles.chipRow}>
                {(data.school_types ?? []).slice(0, 6).map((st: { id: string; name: Record<string, string> }) => {
                  const selected = isTutor ? selectedSchoolTypeIds.includes(st.id) : schoolTypeId === st.id;
                  return (
                    <TouchableOpacity
                      key={st.id}
                      onPress={() => {
                        if (isTutor) toggleTutorSchoolType(st.id);
                        else {
                          setSchoolTypeId(st.id);
                          setGradeId('');
                        }
                      }}
                      style={[styles.lessonChip, selected && styles.lessonChipActive]}
                    >
                      <Text style={selected ? styles.lessonChipTextActive : styles.lessonChipText}>{localeKey(st.name)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {isTutor ? (
                selectedSchoolTypeIds.map((stId) => {
                  const st = (data?.school_types ?? []).find((s: { id: string; name: Record<string, string> }) => s.id === stId);
                  const schoolTypeName = st ? localeKey(st.name) : stId;
                  const gradesList: Grade[] = data?.grades ?? (data as { grade_options?: Grade[] })?.grade_options ?? [];
                  const gradesForType = gradesList.filter((g: Grade) => g.school_type_id === stId);
                  const selectedForType = gradesBySchoolType[stId] ?? [];
                  return (
                    <View key={stId} style={styles.schoolTypeSection}>
                      <Text style={styles.schoolTypeSectionTitle}>{schoolTypeName}</Text>
                      <Text style={styles.label}>{t('onboarding.select_at_least_one_grade', { defaultValue: 'Select at least one grade' })}</Text>
                      <View style={styles.chipRow}>
                        {gradesForType.length === 0 ? (
                          <Text style={styles.hint}>{t('onboarding.no_grades_for_type', { defaultValue: 'No grades available.' })}</Text>
                        ) : (
                          gradesForType.map((g: Grade) => {
                            const selected = selectedForType.includes(g.id);
                            return (
                              <TouchableOpacity
                                key={g.id}
                                onPress={() => toggleTutorGrade(stId, g.id)}
                                style={[styles.lessonChip, selected && styles.lessonChipActive]}
                              >
                                <Text style={selected ? styles.lessonChipTextActive : styles.lessonChipText}>{localeKey(g.name)}</Text>
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </View>
                    </View>
                  );
                })
              ) : schoolTypeId ? (
                <>
                  <Text style={styles.label}>{t('onboarding.grade')}</Text>
                  <View style={styles.chipRow}>
                    {(() => {
                      const gradesList: Grade[] = data?.grades ?? (data as { grade_options?: Grade[] })?.grade_options ?? [];
                      const filtered = gradesList.filter((g: Grade) => g.school_type_id === schoolTypeId);
                      return filtered.length === 0 ? (
                        <Text style={styles.hint}>{t('onboarding.no_grades_for_type', { defaultValue: 'No grades available for selected school type(s).' })}</Text>
                      ) : (
                        filtered.map((g: Grade) => {
                          const selected = gradeId === g.id;
                          return (
                            <TouchableOpacity
                              key={g.id}
                              onPress={() => setGradeId(g.id)}
                              style={[styles.lessonChip, selected && styles.lessonChipActive]}
                            >
                              <Text style={selected ? styles.lessonChipTextActive : styles.lessonChipText}>{localeKey(g.name)}</Text>
                            </TouchableOpacity>
                          );
                        })
                      );
                    })()}
                  </View>
                  <Input
                    label={t('onboarding.school_name')}
                    value={schoolName}
                    onChangeText={setSchoolName}
                    placeholder={t('onboarding.school_name_placeholder')}
                  />
                </>
              ) : null}
            </>
          )}

          {step === 5 && isTutor && (
            <>
              <Text style={styles.title}>{t('onboarding.availability')}</Text>
              <Text style={styles.photoSubtitle}>{t('onboarding.set_slots')}</Text>
              <WeeklyAvailability
                slots={availabilitySlots}
                onChange={setAvailabilitySlots}
                defaultExpandedDay={1}
              />
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.title}>{t('onboarding.bio')}</Text>
              <Input
                placeholder={t('onboarding.bio_placeholder')}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
              />
            </>
          )}

          {step === 4 && isTutor && (
            <>
              <Text style={styles.title}>{t('onboarding.lessons_pricing')}</Text>
              <Text style={styles.label}>{t('onboarding.lesson_types_you_teach', { defaultValue: 'Lesson types you teach' })}</Text>
              <View style={styles.chipRow}>
                {lessonTypes.slice(0, 8).map((lt) => {
                  const selected = selectedLessonIds.includes(lt.id);
                  return (
                    <TouchableOpacity
                      key={lt.id}
                      onPress={() =>
                        setSelectedLessonIds((prev) =>
                          selected ? prev.filter((id) => id !== lt.id) : [...prev, lt.id]
                        )
                      }
                      style={[styles.lessonChip, selected && styles.lessonChipActive]}
                    >
                      <Text style={selected ? styles.lessonChipTextActive : styles.lessonChipText}>
                        {localeKey(lt.name)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedLessonIds.length > 0 && (
                <View style={styles.priceList}>
                  <Text style={styles.label}>{t('onboarding.price_per_hour_for_lessons', { defaultValue: 'Hourly Rate (TRY)' })}</Text>
                  {selectedLessonIds.map(ltId => {
                    const lt = lessonTypes.find(t => t.id === ltId);
                    return (
                      <Input
                        key={ltId}
                        label={lt ? localeKey(lt.name) : ''}
                        value={prices[ltId] || ''}
                        onChangeText={(val) => setPrices(prev => ({ ...prev, [ltId]: val }))}
                        keyboardType="number-pad"
                        placeholder="200"
                        containerStyle={{ marginBottom: spacing.sm }}
                      />
                    )
                  })}
                  <Text style={styles.hint}>{t('onboarding.price_hint', { defaultValue: 'Enter price for each lesson type.' })}</Text>
                </View>
              )}
            </>
          )}

          {step === 4 && !isTutor && (
            <>
              <Text style={styles.title}>{t('onboarding.lesson_interests')}</Text>
              {lessonTypes.slice(0, 8).map((lt) => {
                const selected = selectedLessonIds.includes(lt.id);
                return (
                  <TouchableOpacity
                    key={lt.id}
                    onPress={() =>
                      setSelectedLessonIds((prev) =>
                        selected ? prev.filter((id) => id !== lt.id) : [...prev, lt.id]
                      )
                    }
                    style={[styles.lessonChip, selected && styles.lessonChipActive]}
                  >
                    <Text style={selected ? styles.lessonChipTextActive : styles.lessonChipText}>
                      {localeKey(lt.name)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {((step === 5 && !isTutor) || (step === 6 && isTutor)) && (
            <>
              <Text style={styles.title}>{t('onboarding.photo')}</Text>
              <Text style={styles.photoSubtitle}>{t('onboarding.photo_subtitle')}</Text>
              <Button
                title={user?.avatar_url ? t('common.save') : t('onboarding.photo')}
                variant="secondary"
                onPress={async () => {
                  setPhotoLoading(true);
                  try {
                    await pickAndUploadAvatar();
                  } catch (err) {
                    toast.showError(getApiErrorMessage(err));
                  } finally {
                    setPhotoLoading(false);
                  }
                }}
                loading={photoLoading}
                fullWidth
                style={styles.photoBtn}
              />
            </>
          )}

          {step === totalSteps - 1 && (
            <View style={styles.overviewWrap}>
              <Text style={styles.title}>{t('onboarding.review')}</Text>
              <Text style={styles.overviewSubtitle}>{t('onboarding.review_subtitle', { defaultValue: 'Check your information before finishing.' })}</Text>

              <Card style={styles.overviewCard}>
                <View style={styles.overviewProfileRow}>
                  {user?.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={styles.overviewAvatar} />
                  ) : (
                    <View style={styles.overviewAvatarPlaceholder}>
                      <Ionicons name="person" size={28} color={colors.electricAzure} />
                    </View>
                  )}
                  <View style={styles.overviewProfileText}>
                    <Text style={styles.overviewName}>{fullName || '-'}</Text>
                    <Text style={styles.overviewMeta}>{t(`onboarding.${gender || 'other'}`)} · {birthYear || '-'}</Text>
                  </View>
                </View>

                <View style={styles.overviewDivider} />
                <View style={styles.overviewRow}>
                  <Ionicons name="location-outline" size={20} color={colors.slateText} style={styles.overviewIcon} />
                  <Text style={styles.overviewLabel}>{t('onboarding.location')}</Text>
                  <Text style={styles.overviewValue} numberOfLines={1}>{locationBreadcrumb.length ? locationBreadcrumb.join(' › ') : '-'}</Text>
                </View>
                <View style={styles.overviewRow}>
                  <Ionicons name="document-text-outline" size={20} color={colors.slateText} style={styles.overviewIcon} />
                  <Text style={styles.overviewLabel}>{t('onboarding.bio')}</Text>
                  <Text style={styles.overviewValue} numberOfLines={2}>{bio || '-'}</Text>
                </View>
                <View style={styles.overviewRow}>
                  <Ionicons name="school-outline" size={20} color={colors.slateText} style={styles.overviewIcon} />
                  <Text style={styles.overviewLabel}>{t('onboarding.education')}</Text>
                  {isTutor ? (
                    <View style={styles.overviewValueBlock}>
                      {selectedSchoolTypeIds.map(stId => {
                        const st = (data?.school_types ?? []).find(s => s.id === stId);
                        const grades = (gradesBySchoolType[stId] ?? []).map(gid => {
                          const g = (data?.grades ?? []).find(x => x.id === gid);
                          return g ? localeKey(g.name) : '';
                        }).filter(Boolean).join(', ');
                        return (
                          <Text key={stId} style={styles.overviewValue}>{st ? localeKey(st.name) : stId}: {grades}</Text>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.overviewValueBlock}>
                      <Text style={styles.overviewValue}>
                        {localeKey((data?.school_types ?? []).find(s => s.id === schoolTypeId)?.name) || '-'} · {schoolName || '-'}
                      </Text>
                      <Text style={styles.overviewValueSmall}>
                        {localeKey((data?.grades ?? []).find(x => x.id === gradeId)?.name) || '-'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.overviewRow}>
                  <Ionicons name="book-outline" size={20} color={colors.slateText} style={styles.overviewIcon} />
                  <Text style={styles.overviewLabel}>{isTutor ? t('onboarding.lessons_pricing') : t('onboarding.lesson_interests')}</Text>
                  <View style={styles.overviewValueBlock}>
                    {selectedLessonIds.length === 0 ? (
                      <Text style={styles.overviewValue}>-</Text>
                    ) : (
                      selectedLessonIds.map(ltId => {
                        const lt = lessonTypes.find(t => t.id === ltId);
                        const price = prices[ltId];
                        return (
                          <Text key={ltId} style={styles.overviewValue}>{lt ? localeKey(lt.name) : ''}{isTutor && price ? ` · ${parseInt(price, 10)} TRY` : ''}</Text>
                        );
                      })
                    )}
                  </View>
                </View>
                {isTutor && (
                  <View style={styles.overviewRow}>
                    <Ionicons name="time-outline" size={20} color={colors.slateText} style={styles.overviewIcon} />
                    <Text style={styles.overviewLabel}>{t('onboarding.availability')}</Text>
                    <Text style={styles.overviewValue}>{availabilitySlots.length} {t('onboarding.slots_selected', { defaultValue: 'slots' })}</Text>
                  </View>
                )}
              </Card>

              <Button
                title={t('onboarding.done', { defaultValue: 'Finish' })}
                onPress={handleNext}
                loading={loading}
                fullWidth
                style={styles.overviewDoneBtn}
              />
            </View>
          )}

          {step !== totalSteps - 1 && (
            <Button
              title={t('onboarding.next')}
              onPress={handleNext}
              loading={loading}
              fullWidth
              style={styles.nextBtn}
            />
          )}
        </ScrollView>
      </View>
    </SafeTopView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mistBlue },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.mistBlue },
  loading: { ...typography.bodyLarge, color: colors.slateText },
  onboardingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerBtn: { padding: spacing.sm, margin: -spacing.sm },
  progressWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  progressBar: {
    height: 6,
    backgroundColor: colors.outlineGrey,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.electricAzure,
    borderRadius: 3,
  },
  stepLabel: { ...typography.caption, color: colors.slateText, letterSpacing: 0.5 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing.xxl },
  title: { ...typography.h2, color: colors.carbonText, marginBottom: spacing.lg },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.lg },
  genderBtn: { minWidth: 90 },
  options: { marginTop: spacing.sm },
  pickerFull: { flex: 1, minHeight: 0 },
  locationSubtitle: { ...typography.body, color: colors.slateText, marginBottom: spacing.md },
  locationTouchWrap: { marginBottom: spacing.lg },
  locationCard: { marginBottom: 0 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  locationLabel: { ...typography.body, color: colors.carbonText, flex: 1 },
  locationLabelPlaceholder: { color: colors.slateText },
  label: { ...typography.label, color: colors.carbonText, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  lessonChip: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineGrey,
    backgroundColor: colors.cleanWhite,
    marginBottom: spacing.xs,
  },
  lessonChipActive: {
    borderColor: colors.electricAzure,
    backgroundColor: colors.mistBlue,
    shadowColor: colors.electricAzure,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lessonChipText: { ...typography.body, color: colors.carbonText },
  lessonChipTextActive: { ...typography.label, color: colors.electricAzure },
  hint: { ...typography.body, color: colors.slateText, marginBottom: spacing.sm },
  schoolTypeSection: { marginTop: spacing.lg, marginBottom: spacing.sm },
  schoolTypeSectionTitle: { ...typography.h3, color: colors.carbonText, marginBottom: spacing.sm },
  nextBtn: { marginTop: spacing.xl },
  photoSubtitle: { ...typography.body, color: colors.slateText, marginBottom: spacing.lg },
  photoBtn: { marginBottom: spacing.md },
  overviewWrap: { marginBottom: spacing.lg },
  overviewSubtitle: { ...typography.body, color: colors.slateText, marginBottom: spacing.lg },
  overviewCard: { padding: spacing.lg },
  overviewProfileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  overviewAvatar: { width: 64, height: 64, borderRadius: 32, marginRight: spacing.md },
  overviewAvatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.mistBlue, marginRight: spacing.md, justifyContent: 'center', alignItems: 'center' },
  overviewProfileText: { flex: 1 },
  overviewName: { ...typography.h3, color: colors.carbonText },
  overviewMeta: { ...typography.caption, color: colors.slateText, marginTop: spacing.xxs },
  overviewDivider: { height: 1, backgroundColor: colors.outlineGrey, marginVertical: spacing.sm },
  overviewRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  overviewIcon: { marginRight: spacing.sm, marginTop: 2 },
  overviewLabel: { ...typography.label, color: colors.carbonText, marginRight: spacing.sm, minWidth: 80 },
  overviewValue: { ...typography.body, color: colors.carbonText, flex: 1 },
  overviewValueBlock: { flex: 1 },
  overviewValueSmall: { ...typography.caption, color: colors.slateText, marginTop: spacing.xxs },
  overviewDoneBtn: { marginTop: spacing.xl },
});
