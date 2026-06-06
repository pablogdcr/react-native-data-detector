import { SafeAreaProvider } from 'react-native-safe-area-context';

import DataDetector from './screens/DataDetector';

export default function App() {
  return (
    <SafeAreaProvider>
      <DataDetector />
    </SafeAreaProvider>
  );
}
