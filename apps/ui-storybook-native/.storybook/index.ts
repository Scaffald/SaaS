import AsyncStorage from '@react-native-async-storage/async-storage'
import { view } from './storybook.requires'

export default view.getStorybookUI({
  port: 7007,
  onDeviceUI: true,
  storage: {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
  },
})
