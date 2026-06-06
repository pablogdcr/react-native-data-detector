import { Modal, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { ModelLanguage } from 'react-native-data-detector';

import { LANGUAGES } from '../constants';
import { C } from '../theme';

interface Props {
  visible: boolean;
  selected: ModelLanguage;
  onSelect: (code: ModelLanguage) => void;
  onClose: () => void;
}

export function LanguageSheet({ visible, selected, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <Text style={styles.title}>Language model</Text>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {LANGUAGES.map((l) => {
              const active = l.code === selected;

              return (
                <Pressable key={l.code} style={styles.row} onPress={() => onSelect(l.code)}>
                  <Text style={[styles.rowText, active && styles.rowActive]}>{l.name}</Text>
                  {active && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.surfaceHi,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 4,
    paddingTop: 18,
    paddingBottom: 32,
  },
  title: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  list: {
    maxHeight: 360,
  },
  listContent: {
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  rowText: {
    color: C.text,
    fontSize: 16,
    fontWeight: '700',
  },
  rowActive: {
    color: C.accent,
    fontWeight: '700',
  },
  check: {
    color: C.accent,
    fontSize: 16,
    fontWeight: '700',
  },
});
