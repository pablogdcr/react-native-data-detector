import type { DetectedEntity } from 'react-native-data-detector';

import type { Phase } from '../hooks/useLiveEntities';
import { EntityChip } from './chips/EntityChip';

interface Props {
  entity: DetectedEntity;
  phase: Phase;
  start: number;
  end: number;
  onCaretMove: (index: number) => void;
}

// One entity's slot in the flowing text. The same chip renders both phases so it
// stays mounted and morphs in place instead of being swapped out.
export function EntitySpan({ entity, phase, start, end, onCaretMove }: Props) {
  return (
    <EntityChip
      entity={entity}
      settled={phase === 'settled'}
      start={start}
      end={end}
      onCaretMove={onCaretMove}
    />
  );
}
