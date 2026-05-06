import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { CheckCircle, XCircle, AlertTriangle } from '../components/LucideIcons';

type ToastType = 'success' | 'error' | 'warning';

interface ToastContextData {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((msg: string, t: ToastType = 'success') => {
    setMessage(msg);
    setType(t);
    setVisible(true);
    setTimeout(() => setVisible(false), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View 
          entering={FadeInDown.duration(400)}
          exiting={FadeOutDown.duration(400)}
          className={`absolute bottom-10 left-6 right-6 rounded-2xl flex-row items-center p-4 shadow-2xl z-[999] border ${
            type === 'success' ? 'bg-emerald-500 border-emerald-400' : 
            type === 'error' ? 'bg-rose-500 border-rose-400' : 
            'bg-amber-500 border-amber-400'
          }`}
          style={{ elevation: 10 }}
        >
          <View className="bg-white/20 p-2 rounded-full mr-3">
            {type === 'success' && <CheckCircle color="#fff" size={20} />}
            {type === 'error' && <XCircle color="#fff" size={20} />}
            {type === 'warning' && <AlertTriangle color="#fff" size={20} />}
          </View>
          <Text className="text-white font-bold flex-1">{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
