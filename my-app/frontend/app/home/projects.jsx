import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, Text } from 'react-native';
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

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('projects');
  const [openProjectId, setOpenProjectId] = useState(null);
  const [openFolderId, setOpenFolderId] = useState(null);

  const openProject = useMemo(
    () => PROJECT_LIBRARY.find((project) => project.id === openProjectId) || null,
    [openProjectId]
  );
  const openFolder = useMemo(
    () => openProject?.folders.find((folder) => folder.id === openFolderId) || null,
    [openProject, openFolderId]
  );

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
        <Text style={styles.sectionTitle}>{openProject?.name} folders</Text>
      </View>

      <Image source={{ uri: openProject?.cover }} style={styles.openProjectCover} />
      <Text style={styles.folderHint}>Main display image</Text>
      <Text style={styles.lastEditedText}>last edited {formatLastEdited(openProject?.lastEditedAt || Date.now())}</Text>

      <View style={styles.folderList}>
        {openProject?.folders.map((folder) => (
          <Pressable key={folder.id} style={styles.folderCardPressable} onPress={() => setOpenFolderId(folder.id)}>
            <View style={styles.folderShellBack}>
              <View style={styles.folderTabBack} />
            </View>
            <View style={styles.folderShellFront}>
              <View style={styles.folderTabFront} />
            </View>

            <View style={styles.folderContentRow}>
              <Ionicons name="folder-open-outline" size={17} color="#7e5d63" />
              <View style={styles.folderTextWrap}>
                <Text style={styles.folderName}>{folder.name}</Text>
                <Text style={styles.folderEditedText}>last edited {formatLastEdited(folder.lastEditedAt)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color="#a47f85" />
            </View>
          </Pressable>
        ))}
      </View>
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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
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
});