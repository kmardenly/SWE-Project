import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Keyboard, Modal, PanResponder, Pressable, ScrollView, StyleSheet, TextInput, View, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = ['projects', 'inspirations', 'lists'];

const PROJECT_LIBRARY = [
  {
    id: 'cat-bag',
    name: 'Cat Bag',
    lastEditedAt: Date.now() - 45 * 1000,
    cover:
      'https://images.unsplash.com/photo-1593998066526-65fcab3021a2?auto=format&fit=crop&w=700&q=80',
    folders: [
      {
        id: 'references',
        name: 'References',
        lastEditedAt: Date.now() - 5 * 60 * 60 * 1000,
        files: [
          'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1604881991720-f91add269bed?auto=format&fit=crop&w=600&q=80',
        ],
      },
      {
        id: 'progress',
        name: 'Progress',
        lastEditedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        files: ['https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=600&q=80'],
      },
    ],
    pageElements: [
      { id: 'cat-date', type: 'text', content: '4/23\nStarted the project', x: 195, y: 70, width: 150, height: 75 },
      { id: 'cat-note', type: 'text', content: 'Today I finished making the legs', x: 22, y: 220, width: 280, height: 50 },
      { id: 'cat-note-2', type: 'text', content: 'This is\nwhat it looks\nlike.', x: 24, y: 300, width: 120, height: 94 },
      {
        id: 'cat-photo-main',
        type: 'photo',
        content: 'https://images.unsplash.com/photo-1617953141905-b27fb3d64969?auto=format&fit=crop&w=700&q=80',
        x: 20,
        y: 70,
        width: 150,
        height: 150,
      },
      {
        id: 'cat-photo-side',
        type: 'photo',
        content: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=700&q=80',
        x: 175,
        y: 300,
        width: 190,
        height: 130,
      },
      { id: 'cat-inspo-label', type: 'text', content: 'Inspiration:', x: 135, y: 465, width: 130, height: 28 },
    ],
  },
  {
    id: 'crochet',
    name: 'Crochet',
    lastEditedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    cover:
      'https://images.unsplash.com/photo-1611464907290-3e9ea6cc1976?auto=format&fit=crop&w=700&q=80',
    folders: [
      {
        id: 'materials',
        name: 'Materials',
        lastEditedAt: Date.now() - 22 * 24 * 60 * 60 * 1000,
        files: ['https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=600&q=80'],
      },
      {
        id: 'patterns',
        name: 'Patterns',
        lastEditedAt: Date.now() - 3 * 60 * 60 * 1000,
        files: ['https://images.unsplash.com/photo-1518644961665-ed172691aaa1?auto=format&fit=crop&w=600&q=80'],
      },
    ],
    pageElements: [
      { id: 'cro-1', type: 'text', content: 'Idea sketch v2', x: 25, y: 50, width: 180, height: 38 },
      {
        id: 'cro-2',
        type: 'photo',
        content: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=700&q=80',
        x: 20,
        y: 120,
        width: 170,
        height: 130,
      },
    ],
  },
  {
    id: 'knitting',
    name: 'Knitting',
    lastEditedAt: Date.now() - 4 * 30 * 24 * 60 * 60 * 1000,
    cover:
      'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=700&q=80',
    folders: [
      {
        id: 'color-tests',
        name: 'Color Tests',
        lastEditedAt: Date.now() - 15 * 1000,
        files: ['https://images.unsplash.com/photo-1460788150444-89cd7514fd66?auto=format&fit=crop&w=600&q=80'],
      },
    ],
    pageElements: [
      { id: 'kni-1', type: 'text', content: 'Need warmer colors for this one', x: 28, y: 70, width: 220, height: 42 },
      {
        id: 'kni-2',
        type: 'photo',
        content: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=700&q=80',
        x: 24,
        y: 150,
        width: 170,
        height: 140,
      },
    ],
  },
];

function formatLastEdited(lastEditedAt) {
  const diffSeconds = Math.max(1, Math.floor((Date.now() - lastEditedAt) / 1000));

  if (diffSeconds < 3600) {
    return `${diffSeconds} sec${diffSeconds === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffSeconds / 3600);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffSeconds / (3600 * 24));
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
}

function DraggableElement({
  element,
  isEditing,
  isSelected,
  textInteractionMode,
  onSelect,
  onMove,
  onAutoSize,
  onLongPress,
  markCanvasBusy,
  onDragStateChange,
}) {
  const dragStart = useRef({ x: element.x, y: element.y });
  const latestPosition = useRef({ x: element.x, y: element.y });
  const latestSize = useRef({ width: element.width, height: element.height });
  const resizeStartWidth = useRef(element.width);
  const isEditingRef = useRef(isEditing);
  const isSelectedRef = useRef(isSelected);
  const textModeRef = useRef(textInteractionMode);
  const onMoveRef = useRef(onMove);
  const markCanvasBusyRef = useRef(markCanvasBusy);
  const minTextWidth = 90;
  const minTextHeight = 34;

  useEffect(() => {
    latestPosition.current = { x: element.x, y: element.y };
  }, [element.x, element.y]);

  useEffect(() => {
    latestSize.current = { width: element.width, height: element.height };
  }, [element.width, element.height]);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  useEffect(() => {
    isSelectedRef.current = isSelected;
  }, [isSelected]);

  useEffect(() => {
    textModeRef.current = textInteractionMode;
  }, [textInteractionMode]);

  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  useEffect(() => {
    markCanvasBusyRef.current = markCanvasBusy;
  }, [markCanvasBusy]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        if (!isEditingRef.current) return false;
        if (element.type !== 'text') return true;
        return isSelectedRef.current && textModeRef.current === 'move';
      },
      onMoveShouldSetPanResponder: () => {
        if (!isEditingRef.current) return false;
        if (element.type !== 'text') return true;
        return isSelectedRef.current && textModeRef.current === 'move';
      },
      onPanResponderGrant: () => {
        markCanvasBusyRef.current();
        onDragStateChange(true);
        dragStart.current = { ...latestPosition.current };
      },
      onPanResponderMove: (_, gestureState) => {
        onMoveRef.current(element.id, {
          x: dragStart.current.x + gestureState.dx,
          y: dragStart.current.y + gestureState.dy,
        });
      },
      onPanResponderRelease: () => {
        markCanvasBusyRef.current();
        onDragStateChange(false);
      },
      onPanResponderTerminate: () => {
        onDragStateChange(false);
      },
    })
  ).current;

  const resizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        isEditingRef.current && element.type === 'text' && isSelectedRef.current && textModeRef.current === 'resize',
      onMoveShouldSetPanResponder: () =>
        isEditingRef.current && element.type === 'text' && isSelectedRef.current && textModeRef.current === 'resize',
      onPanResponderGrant: () => {
        markCanvasBusyRef.current();
        onDragStateChange(true);
        resizeStartWidth.current = latestSize.current.width;
      },
      onPanResponderMove: (_, gestureState) => {
        const nextWidth = Math.max(minTextWidth, resizeStartWidth.current + gestureState.dx);
        onMoveRef.current(element.id, { width: nextWidth });
      },
      onPanResponderRelease: () => {
        onDragStateChange(false);
      },
      onPanResponderTerminate: () => {
        onDragStateChange(false);
      },
    })
  ).current;

  return (
    <View
      style={[
        styles.canvasItem,
        {
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          borderColor:
            isEditing && element.type === 'text' && isSelected && textInteractionMode === 'move'
              ? '#6fa37b'
              : isEditing
                ? '#c8a8ad'
                : 'transparent',
          borderWidth: isEditing && element.type === 'text' && isSelected && textInteractionMode === 'move' ? 2 : 1,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Pressable
        style={styles.canvasItemPressable}
        disabled={!isEditing}
        onPressIn={markCanvasBusy}
        onPress={() => {
          if (!isEditing || element.type !== 'text') return;
          onSelect(element.id);
        }}
        onLongPress={() => onLongPress(element)}
        delayLongPress={260}
      >
        {element.type === 'photo' ? (
          <Image source={{ uri: element.content }} style={styles.canvasPhoto} />
        ) : (
          <>
            <Text style={styles.canvasText}>{element.content}</Text>
            <View style={styles.canvasTextMeasureWrap} pointerEvents="none">
              <Text
                style={styles.canvasTextMeasure}
                onTextLayout={(event) => {
                  const lineCount = event?.nativeEvent?.lines?.length || 1;
                  const targetHeight = Math.max(minTextHeight, lineCount * styles.canvasText.lineHeight + 12);
                  onAutoSize(element.id, { height: targetHeight });
                }}
              >
                {element.content}
              </Text>
            </View>
          </>
        )}
      </Pressable>
      {isEditing && element.type === 'text' && isSelected && textInteractionMode === 'resize' ? (
        <View style={styles.textResizeTouchArea} {...resizeResponder.panHandlers}>
          <View style={styles.textResizeNotch}>
            <Ionicons name="resize-outline" size={16} color="#7e5c62" />
          </View>
        </View>
      ) : null}
      {isEditing && element.type === 'text' && isSelected && textInteractionMode === 'move' ? (
        <View style={styles.textMoveBadge}>
          <Text style={styles.textMoveBadgeText}>MOVE</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('projects');
  const [openProjectId, setOpenProjectId] = useState(null);
  const [openFolderId, setOpenFolderId] = useState(null);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [composerVisible, setComposerVisible] = useState(false);
  const [composerMode, setComposerMode] = useState('add');
  const [composerType, setComposerType] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [draftPhotoUrl, setDraftPhotoUrl] = useState('');
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedTextElementId, setSelectedTextElementId] = useState(null);
  const [selectedTextInteractionMode, setSelectedTextInteractionMode] = useState('static');
  const [elementMenuVisible, setElementMenuVisible] = useState(false);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [projectElements, setProjectElements] = useState(() =>
    PROJECT_LIBRARY.reduce((acc, project) => {
      acc[project.id] = project.pageElements || [];
      return acc;
    }, {})
  );
  const canvasTapGuard = useRef(false);

  const openProject = useMemo(
    () => PROJECT_LIBRARY.find((project) => project.id === openProjectId) || null,
    [openProjectId]
  );
  const openFolder = useMemo(
    () => openProject?.folders.find((folder) => folder.id === openFolderId) || null,
    [openProject, openFolderId]
  );
  const openProjectElements = projectElements[openProjectId] || [];

  const markCanvasBusy = () => {
    canvasTapGuard.current = true;
    setTimeout(() => {
      canvasTapGuard.current = false;
    }, 80);
  };

  const openComposer = (type, mode = 'add', sourceElement = null) => {
    setComposerMode(mode);
    setComposerType(type);
    setSelectedElement(sourceElement);
    setDraftText(type === 'text' ? sourceElement?.content || '' : '');
    setDraftPhotoUrl(type === 'photo' ? sourceElement?.content || '' : '');
    setComposerVisible(true);
  };

  const updateOpenProjectElement = (elementId, patch) => {
    if (!openProjectId) return;
    setProjectElements((prev) => ({
      ...prev,
      [openProjectId]: (prev[openProjectId] || []).map((el) => (el.id === elementId ? { ...el, ...patch } : el)),
    }));
  };

  const updateTextElementSize = (elementId, nextSize) => {
    if (!openProjectId) return;
    setProjectElements((prev) => ({
      ...prev,
      [openProjectId]: (prev[openProjectId] || []).map((el) => {
        if (el.id !== elementId || el.type !== 'text') return el;
        const nextWidth = nextSize?.width ?? el.width;
        const nextHeight = nextSize?.height ?? el.height;
        if (Math.abs((el.height || 0) - nextHeight) < 1 && Math.abs((el.width || 0) - nextWidth) < 1) return el;
        return { ...el, width: nextWidth, height: nextHeight };
      }),
    }));
  };

  const handleSaveComposer = () => {
    if (!openProjectId || !composerType) return;

    if (composerMode === 'edit' && selectedElement) {
      updateOpenProjectElement(selectedElement.id, {
        content:
          composerType === 'text'
            ? draftText.trim() || selectedElement.content
            : draftPhotoUrl.trim() || selectedElement.content,
      });
      setComposerVisible(false);
      return;
    }

    const nextElement = {
      id: `${composerType}-${Date.now()}`,
      type: composerType,
      content:
        composerType === 'text'
          ? draftText.trim() || 'New note'
          : draftPhotoUrl.trim() ||
            'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=700&q=80',
      x: 24,
      y: 90 + (openProjectElements.length % 4) * 62,
      width: composerType === 'text' ? 200 : 165,
      height: composerType === 'text' ? 48 : 120,
    };

    setProjectElements((prev) => ({
      ...prev,
      [openProjectId]: [...(prev[openProjectId] || []), nextElement],
    }));
    setComposerVisible(false);
  };

  const renderProjectsRoot = () => (
    <View style={styles.gridWrap}>
      {PROJECT_LIBRARY.map((project) => (
        <Pressable key={project.id} style={styles.projectCard} onPress={() => setOpenProjectId(project.id)}>
          <Image source={{ uri: project.cover }} style={styles.projectThumb} />
          <Text style={styles.projectLabel}>{project.name}</Text>
          <Text style={styles.lastEditedText}>last edited {formatLastEdited(project.lastEditedAt)}</Text>
        </Pressable>
      ))}
    </View>
  );

  const renderOpenProject = () => (
    <View style={styles.folderViewWrap}>
      <View style={styles.rowHeader}>
        <Pressable onPress={() => setOpenProjectId(null)} style={styles.exitButton}>
          <Ionicons name="arrow-back" size={18} color="#6d4f55" />
          <Text style={styles.exitButtonText}>Exit</Text>
        </Pressable>
        <View style={styles.editRow}>
          <Text style={styles.sectionTitle}>{openProject?.name}</Text>
          <Pressable style={styles.editBadge} onPress={() => setIsEditingPage((prev) => !prev)}>
            <Text style={styles.editBadgeText}>{isEditingPage ? 'done' : 'edit'}</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.lastEditedText}>last edited {formatLastEdited(openProject?.lastEditedAt || Date.now())}</Text>

      <Pressable
        style={styles.freeCanvas}
        onPress={() => {
          if (!isEditingPage) return;
          if (canvasTapGuard.current) return;
          setSelectedTextElementId(null);
          setSelectedTextInteractionMode('static');
        }}
        onLongPress={() => {
          if (!isEditingPage || canvasTapGuard.current) return;
          setComposerMode('add');
          setComposerType(null);
          setComposerVisible(true);
        }}
        delayLongPress={320}
      >
        {openProjectElements.map((element) => (
          <DraggableElement
            key={element.id}
            element={element}
            isEditing={isEditingPage}
            isSelected={selectedTextElementId === element.id}
            textInteractionMode={selectedTextInteractionMode}
            onSelect={(elementId) => {
              if (selectedTextElementId !== elementId) {
                setSelectedTextElementId(elementId);
                setSelectedTextInteractionMode('move');
                return;
              }
              if (selectedTextInteractionMode === 'move') {
                setSelectedTextInteractionMode('resize');
                return;
              }
              if (selectedTextInteractionMode === 'resize') {
                setSelectedTextInteractionMode('static');
                return;
              }
              setSelectedTextInteractionMode('move');
            }}
            markCanvasBusy={markCanvasBusy}
            onMove={(elementId, nextPosition) => updateOpenProjectElement(elementId, nextPosition)}
            onAutoSize={(elementId, nextSize) => updateTextElementSize(elementId, nextSize)}
            onLongPress={(nextSelected) => {
              if (!isEditingPage) return;
              setSelectedElement(nextSelected);
              setElementMenuVisible(true);
              markCanvasBusy();
            }}
            onDragStateChange={setIsDraggingElement}
          />
        ))}
      </Pressable>
    </View>
  );

  const renderOpenFolder = () => (
    <View style={styles.folderViewWrap}>
      <View style={styles.rowHeader}>
        <Pressable onPress={() => setOpenFolderId(null)} style={styles.exitButton}>
          <Ionicons name="arrow-back" size={18} color="#6d4f55" />
          <Text style={styles.exitButtonText}>Exit folder</Text>
        </Pressable>
        <Text style={styles.sectionTitle}>{openFolder?.name}</Text>
      </View>
      <Text style={styles.lastEditedText}>last edited {formatLastEdited(openFolder?.lastEditedAt || Date.now())}</Text>

      <View style={styles.folderFilesWrap}>
        {openFolder?.files.map((fileUri) => (
          <Image key={fileUri} source={{ uri: fileUri }} style={styles.folderFileImage} />
        ))}
      </View>
    </View>
  );

  const renderProjectsTab = () => {
    if (openFolderId) return renderOpenFolder();
    if (openProjectId) return renderOpenProject();
    return renderProjectsRoot();
  };

  const renderTabBody = () => {
    if (activeTab === 'projects') return renderProjectsTab();
    if (activeTab === 'inspirations') {
      return (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderTitle}>Inspirations</Text>
          <Text style={styles.placeholderBody}>Save visual ideas and mood references here.</Text>
        </View>
      );
    }
    return (
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderTitle}>Lists</Text>
        <Text style={styles.placeholderBody}>Track supplies, shopping, and project checklists.</Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <Image source={require('@/assets/images/explore_background.png')} resizeMode="cover" style={styles.background} />
      <ScrollView
        scrollEnabled={!isDraggingElement}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#7e5d63" />
          </Pressable>
          <Text style={styles.title}>Projects</Text>
        </View>

        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                onPress={() => {
                  setActiveTab(tab);
                  setOpenFolderId(null);
                  setOpenProjectId(null);
                  setSelectedTextElementId(null);
                  setSelectedTextInteractionMode('static');
                }}
              >
                <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
                  {tab[0].toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {renderTabBody()}
      </ScrollView>

      <Modal visible={elementMenuVisible} transparent animationType="fade" onRequestClose={() => setElementMenuVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setElementMenuVisible(false)}>
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Element options</Text>
            <Pressable
              style={styles.menuAction}
              onPress={() => {
                if (!selectedElement) return;
                openComposer(selectedElement.type, 'edit', selectedElement);
                setElementMenuVisible(false);
              }}
            >
              <Text style={styles.menuActionText}>Change</Text>
            </Pressable>
            <Pressable
              style={styles.menuAction}
              onPress={() => {
                if (!openProjectId || !selectedElement) return;
                setProjectElements((prev) => ({
                  ...prev,
                  [openProjectId]: (prev[openProjectId] || []).filter((el) => el.id !== selectedElement.id),
                }));
                setElementMenuVisible(false);
              }}
            >
              <Text style={styles.menuActionDelete}>Delete</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={composerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss();
          setComposerVisible(false);
        }}
      >
        <Pressable style={styles.modalBackdrop} onPress={Keyboard.dismiss}>
          <Pressable style={styles.composerCard} onPress={() => {}}>
            <Text style={styles.composerTitle}>
              {composerMode === 'edit' ? 'Edit element' : composerType ? `Add ${composerType}` : 'Add to page'}
            </Text>

            {!composerType ? (
              <View style={styles.composerChoiceRow}>
                <Pressable style={styles.choiceButton} onPress={() => setComposerType('text')}>
                  <Text style={styles.choiceText}>Add text</Text>
                </Pressable>
                <Pressable style={styles.choiceButton} onPress={() => setComposerType('photo')}>
                  <Text style={styles.choiceText}>Add photo</Text>
                </Pressable>
              </View>
            ) : composerType === 'text' ? (
              <TextInput
                style={styles.composerInput}
                placeholder="Type text..."
                placeholderTextColor="#9e8888"
                value={draftText}
                onChangeText={setDraftText}
                multiline
                blurOnSubmit
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            ) : (
              <TextInput
                style={styles.composerInput}
                placeholder="Paste photo URL..."
                placeholderTextColor="#9e8888"
                value={draftPhotoUrl}
                onChangeText={setDraftPhotoUrl}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            )}

            <View style={styles.composerActions}>
              <Pressable
                style={styles.composerCancel}
                onPress={() => {
                  Keyboard.dismiss();
                  setComposerVisible(false);
                  setComposerType(null);
                }}
              >
                <Text style={styles.composerCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.composerSave}
                onPress={() => {
                  Keyboard.dismiss();
                  handleSaveComposer();
                  setComposerType(null);
                }}
              >
                <Text style={styles.composerSaveText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f2e4e4',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 150,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  title: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 36,
    color: '#5c3d3d',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    backgroundColor: '#f1e6e6',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccb8b8',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#e8c7cd',
    borderColor: '#c8a1a8',
  },
  tabButtonText: {
    color: '#5f4b4b',
    fontSize: 22,
    fontFamily: 'Gaegu-Bold',
  },
  tabButtonTextActive: {
    color: '#5c3d3d',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  projectCard: {
    width: '47%',
    marginBottom: 8,
  },
  projectThumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#d8d8d8',
    borderWidth: 1,
    borderColor: '#cab7b7',
  },
  projectLabel: {
    marginTop: 4,
    textAlign: 'left',
    color: '#4f3d3d',
    fontSize: 25,
    fontFamily: 'Gaegu-Bold',
  },
  lastEditedText: {
    marginTop: -2,
    color: '#7d6767',
    fontSize: 13,
    fontFamily: 'Gaegu-Bold',
  },
  folderViewWrap: {
    gap: 10,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#efe1e1',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#cdb7b7',
    gap: 4,
  },
  exitButtonText: {
    color: '#624a4f',
    fontFamily: 'Gaegu-Bold',
    fontSize: 18,
  },
  sectionTitle: {
    color: '#5c3d3d',
    fontSize: 24,
    fontFamily: 'Gaegu-Bold',
    flex: 1,
    textAlign: 'right',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  editBadge: {
    backgroundColor: '#e7d6d8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccb3b7',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editBadgeText: {
    fontFamily: 'Gaegu-Bold',
    color: '#5f464a',
    fontSize: 18,
  },
  openProjectCover: {
    width: '100%',
    height: 170,
    borderRadius: 10,
    backgroundColor: '#d9d9d9',
    borderWidth: 1,
    borderColor: '#cab7b7',
  },
  folderHint: {
    color: '#7b6666',
    fontFamily: 'Gaegu-Bold',
    fontSize: 15,
    marginTop: -6,
  },
  freeCanvas: {
    minHeight: 780,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    borderColor: '#d8c3c3',
    position: 'relative',
    paddingBottom: 12,
  },
  canvasItem: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  canvasItemPressable: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  canvasPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: '#d4d4d4',
  },
  canvasText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 16,
    color: '#2f2225',
    lineHeight: 20,
    width: '100%',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  canvasTextMeasureWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
    zIndex: -1,
  },
  canvasTextMeasure: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 16,
    lineHeight: 20,
    width: '100%',
    paddingHorizontal: 4,
    paddingTop: 2,
    color: 'transparent',
  },
  textResizeTouchArea: {
    position: 'absolute',
    right: -18,
    bottom: -18,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  textResizeNotch: {
    position: 'absolute',
    right: 9,
    bottom: 9,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f7e7ea',
    borderWidth: 2,
    borderColor: '#c8a6ad',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  textMoveBadge: {
    position: 'absolute',
    top: -18,
    left: 4,
    backgroundColor: '#dff2e4',
    borderColor: '#6fa37b',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  textMoveBadgeText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 12,
    color: '#3b6f47',
    letterSpacing: 0.4,
  },
  folderList: {
    gap: 8,
  },
  folderCardPressable: {
    minHeight: 94,
    justifyContent: 'center',
    position: 'relative',
  },
  folderShellBack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#e1b4b4',
    borderRadius: 10,
  },
  folderTabBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 50,
    height: 14,
    backgroundColor: '#e1b4b4',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 8,
  },
  folderShellFront: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 22,
    bottom: 0,
    backgroundColor: '#f0d7d7',
    borderRadius: 10,
  },
  folderTabFront: {
    position: 'absolute',
    top: -9,
    left: 0,
    width: 50,
    height: 14,
    backgroundColor: '#f0d7d7',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 8,
  },
  folderContentRow: {
    minHeight: 60,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  folderName: {
    color: '#5c454a',
    fontFamily: 'Gaegu-Bold',
    fontSize: 20,
  },
  folderTextWrap: {
    flex: 1,
  },
  folderEditedText: {
    color: '#7d6767',
    fontSize: 12,
    fontFamily: 'Gaegu-Bold',
  },
  folderFilesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  folderFileImage: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#ddd',
    borderWidth: 1,
    borderColor: '#cab7b7',
  },
  placeholderCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c7b0b0',
    backgroundColor: '#f6e9e9',
    padding: 14,
  },
  placeholderTitle: {
    color: '#5c3d3d',
    fontSize: 27,
    fontFamily: 'Gaegu-Bold',
    marginBottom: 6,
  },
  placeholderBody: {
    color: '#786161',
    fontSize: 18,
    lineHeight: 22,
    fontFamily: 'Gaegu-Bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 23, 23, 0.32)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  menuCard: {
    width: '100%',
    maxWidth: 290,
    borderRadius: 12,
    backgroundColor: '#fbf3f3',
    borderWidth: 1,
    borderColor: '#d7bfc3',
    padding: 12,
    gap: 8,
  },
  menuTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 28,
    color: '#564143',
  },
  menuAction: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9c1c5',
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  menuActionText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 22,
    color: '#5f494d',
  },
  menuActionDelete: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 22,
    color: '#b95360',
  },
  composerCard: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 14,
    backgroundColor: '#fbf1f3',
    borderWidth: 1,
    borderColor: '#d7bcc1',
    padding: 14,
    gap: 10,
  },
  composerTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 30,
    color: '#584346',
  },
  composerChoiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d3b9be',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingVertical: 8,
    alignItems: 'center',
  },
  choiceText: {
    fontFamily: 'Gaegu-Bold',
    color: '#5f484c',
    fontSize: 20,
  },
  composerInput: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#d4bcc0',
    borderRadius: 9,
    backgroundColor: '#fff',
    fontFamily: 'Gaegu-Bold',
    color: '#4c3639',
    fontSize: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  composerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  composerCancel: {
    borderWidth: 1,
    borderColor: '#d4bec2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  composerCancelText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 20,
    color: '#775f63',
  },
  composerSave: {
    borderWidth: 1,
    borderColor: '#c8a3aa',
    borderRadius: 8,
    backgroundColor: '#e8c9ce',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  composerSaveText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 20,
    color: '#523a3e',
  },
});