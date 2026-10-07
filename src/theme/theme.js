import { useIoT } from '../context/IoTContext';
export const usePalette = () => {
  const {
    preferences
  } = useIoT();
  return preferences.darkMode ? {
    bg: '#101B1A',
    card: '#1B2927',
    text: '#ECF3EF',
    muted: '#A1B5AD',
    border: '#30433C',
    accent: '#96DDB9',
    tint: '#2A4438',
    danger: '#FFADA4'
  } : {
    bg: '#F4F6F2',
    card: '#FFFFFF',
    text: '#172E25',
    muted: '#677B70',
    border: '#E0E7DE',
    accent: '#256747',
    tint: '#E6F0E5',
    danger: '#B44236'
  };
};
