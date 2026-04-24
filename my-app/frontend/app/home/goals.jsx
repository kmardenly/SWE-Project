import { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CatWindow from '@/components/cat-widget';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);
const DARK = '#5c3d3d';

const MAX_SLIDER_DAYS = 120;
const MAX_EXTRA_DAYS = 2000;
const CAT_MOODS = ['happy', 'default', 'sad', 'playful'];

function addDaysToToday(days) {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(0, Math.floor(days)));
  return d.toISOString().slice(0, 10);
}

/** Display as MM.DD.YY (e.g. 08.15.26). Keeps ISO YYYY-MM-DD internally. */
function formatDateDot(isoDate) {
  if (!isoDate || isoDate === 'no deadline') {
    return isoDate === 'no deadline' ? 'no deadline' : '--';
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate).trim());
  if (!m) return String(isoDate);
  const [, y, mo, day] = m;
  return `${mo}.${day}.${y.slice(2)}`;
}

function normalizeSubGoal(item) {
  if (typeof item === 'string') return { text: item, completed: false };
  return {
    text: item?.text ?? '',
    completed: Boolean(item?.completed),
  };
}

function getEffectiveDeadlineDays(sliderVal, extraBeyond120) {
  if (sliderVal <= 0) return 0;
  if (sliderVal < MAX_SLIDER_DAYS) return sliderVal;
  return Math.min(MAX_SLIDER_DAYS + Math.max(0, extraBeyond120), MAX_SLIDER_DAYS + MAX_EXTRA_DAYS);
}

const INITIAL_GOALS = [
  {
    id: 'g1',
    title: 'Finish kitten tote',
    deadline: '2026-05-10',
    subGoals: [
      { text: 'Cut fabric', completed: false },
      { text: 'Sew sides', completed: false },
      { text: 'Attach straps', completed: false },
    ],
    completed: false,
    completedAt: null,
    archived: false,
    archivedAt: null,
  },
  {
    id: 'g2',
    title: 'Paint shelf',
    deadline: '2026-05-22',
    subGoals: [
      { text: 'Sand edges', completed: false },
      { text: 'Prime coat', completed: false },
    ],
    completed: false,
    completedAt: null,
    archived: false,
    archivedAt: null,
  },
];

function GoalCard({ goal, onDelete, onArchive, onToggleComplete, onToggleSubGoal }) {
  const done = Boolean(goal.completed);
  const subGoals = (goal.subGoals ?? []).map(normalizeSubGoal);
  const canArchive = done && !goal.archived;
  return (
    <View style={[styles.goalCard, done && styles.goalCardDone]}>
      <View style={styles.goalCardHeader}>
        <Pressable
          onPress={() => onToggleComplete(goal.id)}
          style={styles.completeRow}
          hitSlop={4}>
          <View style={[styles.checkbox, done && styles.checkboxChecked]}>
            {done ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
          </View>
          <Text style={[styles.goalTitle, done && styles.goalTitleDone]} numberOfLines={2}>
            {goal.title}
          </Text>
        </Pressable>
        <Pressable onPress={() => onDelete(goal.id)} hitSlop={8} style={styles.deleteButton}>
          <Ionicons name="close" size={16} color="#7d6666" />
        </Pressable>
      </View>
      <Text style={[styles.goalDeadline, done && styles.goalMetaDone]}>
        deadline {formatDateDot(goal.deadline)}
        {done && goal.completedAt ? ` · done ${formatDateDot(goal.completedAt)}` : ''}
      </Text>

      {subGoals.length ? (
        <View style={styles.subGoalsWrap}>
          {subGoals.map((subGoal, index) => (
            <Pressable
              key={`${goal.id}-sub-${index}`}
              onPress={() => onToggleSubGoal(goal.id, index)}
              style={styles.subGoalRow}
              hitSlop={4}>
              <View style={[styles.subCheckbox, subGoal.completed && styles.subCheckboxChecked]}>
                {subGoal.completed ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
              </View>
              <Text
                style={[styles.subGoalText, subGoal.completed && styles.subGoalDone]}
                numberOfLines={3}>
                {`sub-goal ${index + 1}: ${subGoal.text}`}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {canArchive ? (
        <Pressable onPress={() => onArchive(goal.id)} style={styles.archiveActionWrap} hitSlop={6}>
          <Text style={styles.archiveHint}>archive</Text>
          <Ionicons name="arrow-down" size={14} color="#7e6767" />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [goalName, setGoalName] = useState('');
  const [catMoodIndex, setCatMoodIndex] = useState(0);
  const [catName, setCatName] = useState('your craft cat');
  const [isEditingCatName, setIsEditingCatName] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [isEditingArchived, setIsEditingArchived] = useState(false);
  /** Slider 0 = none; 1–119 = days; 120 = 120+ (use extraBeyond120) */
  const [deadlineSlider, setDeadlineSlider] = useState(0);
  const [extraBeyond120, setExtraBeyond120] = useState(0);
  const [subGoalInput, setSubGoalInput] = useState('');

  const effectiveDays = getEffectiveDeadlineDays(deadlineSlider, extraBeyond120);

  const handleAddGoal = () => {
    const trimmedName = goalName.trim();
    if (!trimmedName) return;

    const subGoals = subGoalInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((text) => ({ text, completed: false }));

    const deadlineLabel =
      effectiveDays <= 0 ? 'no deadline' : addDaysToToday(effectiveDays);

    setGoals((prev) => [
      ...prev,
      {
        id: `g-${Date.now()}`,
        title: trimmedName,
        deadline: deadlineLabel,
        subGoals,
        completed: false,
        completedAt: null,
        archived: false,
        archivedAt: null,
      },
    ]);

    setGoalName('');
    setDeadlineSlider(0);
    setExtraBeyond120(0);
    setSubGoalInput('');
    setIsAddOpen(false);
  };

  const handleDeleteGoal = (goalId) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
  };

  const handleArchiveGoal = (goalId) => {
    const today = new Date().toISOString().slice(0, 10);
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        return {
          ...goal,
          completed: true,
          completedAt: goal.completedAt || today,
          archived: true,
          archivedAt: today,
        };
      })
    );
  };

  const handleUnarchiveGoal = (goalId) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        return {
          ...goal,
          archived: false,
          archivedAt: null,
        };
      })
    );
  };

  const handleToggleComplete = (goalId) => {
    const today = new Date().toISOString().slice(0, 10);
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        const nextCompleted = !goal.completed;
        return {
          ...goal,
          completed: nextCompleted,
          completedAt: nextCompleted ? today : null,
        };
      })
    );
  };

  const handleToggleSubGoal = (goalId, subIndex) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        const subs = (goal.subGoals ?? []).map(normalizeSubGoal);
        if (!subs[subIndex]) return goal;
        const next = subs.map((s, i) =>
          i === subIndex ? { ...s, completed: !s.completed } : s
        );
        const allDone = next.length > 0 && next.every((sub) => sub.completed);
        return {
          ...goal,
          subGoals: next,
          completed: allDone,
          completedAt: allDone ? goal.completedAt || new Date().toISOString().slice(0, 10) : null,
        };
      })
    );
  };

  const setTotalDaysFromInput = (text) => {
    if (text === '' || text.trim() === '') {
      setDeadlineSlider(0);
      setExtraBeyond120(0);
      return;
    }
    const n = parseInt(String(text).replace(/[^0-9]/g, ''), 10);
    if (Number.isNaN(n) || n < 0) return;
    const capped = Math.min(n, MAX_SLIDER_DAYS + MAX_EXTRA_DAYS);
    if (capped <= 0) {
      setDeadlineSlider(0);
      setExtraBeyond120(0);
      return;
    }
    if (capped < MAX_SLIDER_DAYS) {
      setDeadlineSlider(capped);
      setExtraBeyond120(0);
      return;
    }
    setDeadlineSlider(MAX_SLIDER_DAYS);
    setExtraBeyond120(capped - MAX_SLIDER_DAYS);
  };

  const completedCount = goals.filter((g) => g.completed).length;
  const activeGoals = goals.filter((g) => !g.archived);
  const archivedGoals = goals.filter((g) => g.archived);
  const catMood = CAT_MOODS[catMoodIndex] || 'happy';
  const lastCompletedDate = goals
    .filter((g) => g.completed && g.completedAt)
    .reduce((latest, g) => (!latest || g.completedAt > latest ? g.completedAt : latest), null);

  const handleFocusAddInputs = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  return (
    <View style={styles.root}>
      <Image
        source={require('@/assets/images/explore_background.png')}
        resizeMode="cover"
        style={styles.backgroundLayer}
      />
      <KeyboardAvoidingView
        style={[styles.foreground, { paddingTop: insets.top + 8 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>My Goals</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.profileCard}>
            <View style={styles.catWindowColumn}>
              <CatWindow mood={catMood} />
            </View>
            <View style={styles.profileTextBlock}>
              {isEditingCatName ? (
                <TextInput
                  style={styles.catNameInput}
                  value={catName}
                  onChangeText={setCatName}
                  autoFocus
                  placeholder="your craft cat"
                  placeholderTextColor="#9c8a8a"
                  onBlur={() => {
                    if (!catName.trim()) setCatName('your craft cat');
                    setIsEditingCatName(false);
                  }}
                  onSubmitEditing={() => {
                    if (!catName.trim()) setCatName('your craft cat');
                    setIsEditingCatName(false);
                  }}
                  returnKeyType="done"
                />
              ) : (
                <Pressable onPress={() => setIsEditingCatName(true)} hitSlop={6}>
                  <Text style={styles.profileText}>{`name: ${catName}`}</Text>
                </Pressable>
              )}
              <Text style={styles.profileText}>level: 1</Text>
              <Text style={styles.profileText}>goals achieved: {completedCount}</Text>
              <Text style={styles.profileText}>
                last goal completed: {lastCompletedDate ? formatDateDot(lastCompletedDate) : '--'}
              </Text>
              <Pressable
                style={styles.changeMoodButton}
                onPress={() => setCatMoodIndex((prev) => (prev + 1) % CAT_MOODS.length)}>
                <Ionicons name="swap-horizontal" size={14} color="#7f6969" />
              </Pressable>
            </View>
          </View>

          {activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={handleDeleteGoal}
              onArchive={handleArchiveGoal}
              onToggleComplete={handleToggleComplete}
              onToggleSubGoal={handleToggleSubGoal}
            />
          ))}

          {isAddOpen ? (
            <View style={styles.addSheet}>
              <View style={styles.addHeader}>
                <Text style={styles.addTitle}>add goal</Text>
                <Pressable onPress={() => setIsAddOpen(false)} style={styles.deleteButton} hitSlop={8}>
                  <Ionicons name="close" size={16} color="#7d6666" />
                </Pressable>
              </View>

              <TextInput
                style={styles.input}
                placeholder="goal name"
                placeholderTextColor="#9c8a8a"
                value={goalName}
                onChangeText={setGoalName}
                onFocus={handleFocusAddInputs}
              />
              <View style={styles.deadlineBlock}>
                <Text style={styles.deadlineLabel}>deadline</Text>
                <Text style={styles.deadlineSummary}>
                  {effectiveDays <= 0
                    ? 'No deadline'
                    : deadlineSlider === MAX_SLIDER_DAYS && extraBeyond120 > 0
                      ? `In ${effectiveDays} days (120+) · ${formatDateDot(
                          addDaysToToday(effectiveDays)
                        )}`
                      : `In ${effectiveDays} day${effectiveDays === 1 ? '' : 's'} · ${formatDateDot(
                          addDaysToToday(effectiveDays)
                        )}`}
                </Text>
                <Slider
                  style={styles.deadlineSlider}
                  minimumValue={0}
                  maximumValue={MAX_SLIDER_DAYS}
                  step={1}
                  value={deadlineSlider}
                  onValueChange={(v) => {
                    const rounded = Math.round(v);
                    setDeadlineSlider(rounded);
                    if (rounded < MAX_SLIDER_DAYS) setExtraBeyond120(0);
                  }}
                  minimumTrackTintColor="#9f7f7f"
                  maximumTrackTintColor="#e0d0d0"
                  thumbTintColor="#5c3d3d"
                />
                <View style={styles.deadlineSliderLabels}>
                  <Text style={styles.deadlineHint}>none</Text>
                  <Text style={styles.deadlineHint}>120+</Text>
                </View>
                {deadlineSlider === MAX_SLIDER_DAYS ? (
                  <View style={styles.extraDaysBlock}>
                    <Text style={styles.deadlineOr}>
                      Add days past 120 (optional — type total days below instead)
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="extra days after 120 (e.g. 30 → 150 total)"
                      placeholderTextColor="#9c8a8a"
                      keyboardType="number-pad"
                      value={extraBeyond120 > 0 ? String(extraBeyond120) : ''}
                      onChangeText={(text) => {
                        if (text === '') {
                          setExtraBeyond120(0);
                          return;
                        }
                        const n = parseInt(text.replace(/[^0-9]/g, ''), 10);
                        if (Number.isNaN(n)) return;
                        setExtraBeyond120(Math.min(MAX_EXTRA_DAYS, Math.max(0, n)));
                      }}
                      onFocus={handleFocusAddInputs}
                    />
                  </View>
                ) : null}
                <Text style={styles.deadlineOr}>or type total days (any length)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 14 or 200"
                  placeholderTextColor="#9c8a8a"
                  keyboardType="number-pad"
                  value={effectiveDays > 0 ? String(effectiveDays) : ''}
                  onChangeText={setTotalDaysFromInput}
                  onFocus={handleFocusAddInputs}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="sub-goals (comma separated)"
                placeholderTextColor="#9c8a8a"
                value={subGoalInput}
                onChangeText={setSubGoalInput}
                onFocus={handleFocusAddInputs}
              />

              <Pressable onPress={handleAddGoal} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>set goal!</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setIsAddOpen(true)} style={styles.addGoalButton}>
              <Ionicons name="add" size={20} color="#5e4747" />
              <Text style={styles.addGoalButtonText}>add goal</Text>
            </Pressable>
          )}
          {archivedGoals.length ? (
            <View style={styles.archivedWrap}>
              <View style={styles.archivedHeaderRow}>
                <Pressable style={styles.archivedToggle} onPress={() => setShowArchived((prev) => !prev)}>
                  <Ionicons name={showArchived ? 'chevron-down' : 'chevron-forward'} size={16} color="#6c5555" />
                  <Text style={styles.archivedToggleText}>
                    {showArchived ? 'hide archived goals' : `show archived goals (${archivedGoals.length})`}
                  </Text>
                </Pressable>
                {showArchived ? (
                  <Pressable
                    style={[styles.archivedEditIconButton, isEditingArchived && styles.archivedEditIconButtonActive]}
                    onPress={() => setIsEditingArchived((prev) => !prev)}
                    hitSlop={6}>
                    <Ionicons name="create-outline" size={16} color={isEditingArchived ? '#4f3a3a' : '#6f5a5a'} />
                  </Pressable>
                ) : null}
              </View>
              {showArchived
                ? archivedGoals.map((goal) => (
                    <View key={goal.id} style={styles.archivedGoalCard}>
                      <Text style={styles.archivedGoalTitle}>{goal.title}</Text>
                      <Text style={styles.archivedGoalMeta}>
                        done {formatDateDot(goal.completedAt)} · archived {formatDateDot(goal.archivedAt)}
                      </Text>
                      {isEditingArchived ? (
                        <View style={styles.archivedGoalActions}>
                          <Pressable
                            onPress={() => handleUnarchiveGoal(goal.id)}
                            style={styles.archivedGoalActionButton}
                            hitSlop={6}>
                            <Ionicons name="arrow-up" size={14} color="#6f5a5a" />
                            <Text style={styles.archivedGoalActionText}>unarchive</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteGoal(goal.id)}
                            style={styles.archivedGoalActionButton}
                            hitSlop={6}>
                            <Ionicons name="trash-outline" size={14} color="#8f555d" />
                            <Text style={[styles.archivedGoalActionText, styles.archivedGoalDeleteText]}>delete</Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  ))
                : null}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f2e4e4',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  foreground: {
    flex: 1,
    paddingHorizontal: 14,
  },
  headerRow: {
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  pageTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(44, 32, 50),
    color: DARK,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: responsive(150, 130, 180),
    gap: 10,
  },
  profileCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bca5a5',
    backgroundColor: '#f5f0df',
    padding: 8,
    flexDirection: 'row',
    gap: 8,
  },
  catWindowColumn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  profileTextBlock: {
    flex: 1,
    backgroundColor: '#f8eaea',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d7bfbf',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  profileText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(20, 15, 24),
    color: '#786161',
    marginBottom: 2,
  },
  catNameInput: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#c9aeae',
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(20, 15, 24),
    color: '#786161',
    paddingVertical: 0,
    marginBottom: 2,
  },
  changeMoodButton: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    opacity: 0.58,
    borderRadius: 999,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d9c4c4',
    backgroundColor: '#f6eeee',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9f7f7f',
    backgroundColor: '#fff8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#7a9f6a',
    borderColor: '#5f7a52',
  },
  goalCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c2a7a7',
    backgroundColor: '#f6e3e3',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  goalCardDone: {
    opacity: 0.85,
    backgroundColor: '#e8dede',
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalTitle: {
    flex: 1,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(24, 18, 28),
    color: DARK,
  },
  goalTitleDone: {
    textDecorationLine: 'line-through',
    color: '#8a7575',
  },
  goalMetaDone: {
    color: '#8a7575',
  },
  deleteButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ead5d5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalDeadline: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(18, 14, 22),
    color: '#755f5f',
    marginTop: 2,
  },
  subGoalsWrap: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#d7c3c3',
    paddingTop: 6,
    gap: 6,
  },
  subGoalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  subCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#9f7f7f',
    backgroundColor: '#fff8f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  subCheckboxChecked: {
    backgroundColor: '#7a9f6a',
    borderColor: '#5f7a52',
  },
  subGoalText: {
    flex: 1,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(17, 13, 20),
    color: '#5f4c4c',
  },
  subGoalDone: {
    textDecorationLine: 'line-through',
    color: '#8a7a7a',
  },
  archiveActionWrap: {
    marginTop: 8,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  archiveHint: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(16, 13, 18),
    color: '#7e6767',
  },
  addSheet: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cdbbb0',
    backgroundColor: '#f6f2e2',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  addHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTitle: {
    flex: 1,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(40, 28, 44),
    color: DARK,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d7c5c5',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(22, 16, 26),
    color: DARK,
  },
  deadlineBlock: {
    gap: 6,
  },
  deadlineLabel: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(22, 16, 26),
    color: DARK,
  },
  deadlineSummary: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(18, 14, 22),
    color: '#6b5555',
  },
  deadlineSlider: {
    width: '100%',
    height: 36,
  },
  deadlineSliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  deadlineHint: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(14, 12, 16),
    color: '#9a8585',
  },
  deadlineOr: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(16, 13, 18),
    color: '#7d6666',
    marginTop: 4,
  },
  extraDaysBlock: {
    gap: 6,
  },
  primaryButton: {
    alignSelf: 'center',
    marginTop: 4,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryButtonText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(40, 28, 44),
    color: DARK,
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#f0dcdc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8bcbc',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addGoalButtonText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(32, 22, 36),
    color: DARK,
  },
  archivedWrap: {
    marginTop: 10,
    gap: 8,
  },
  archivedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  archivedToggle: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8bcbc',
    backgroundColor: '#f0dcdc',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  archivedEditIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ceb3b3',
    backgroundColor: '#f4e3e3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivedEditIconButtonActive: {
    backgroundColor: '#edd2d2',
    borderColor: '#c9a3a3',
  },
  archivedToggleText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(22, 16, 24),
    color: DARK,
  },
  archivedGoalCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cfb8b8',
    backgroundColor: '#ece4e4',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  archivedGoalTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(22, 16, 26),
    color: '#715b5b',
  },
  archivedGoalMeta: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(16, 12, 18),
    color: '#8a7676',
  },
  archivedGoalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  archivedGoalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  archivedGoalActionText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(16, 12, 18),
    color: '#6f5a5a',
  },
  archivedGoalDeleteText: {
    color: '#8f555d',
  },
});
