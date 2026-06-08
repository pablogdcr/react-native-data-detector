import { SafeAreaProvider } from 'react-native-safe-area-context';

import WritingScreen from './screens/WritingScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <WritingScreen />
    </SafeAreaProvider>
  );
}
