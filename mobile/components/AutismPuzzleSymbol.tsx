import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing,
  useSharedValue,
  withDelay,
  interpolate
} from 'react-native-reanimated';
import { Puzzle, Heart, Activity } from './LucideIcons';

export const AutismPuzzleSymbol = () => {
  const floatValue = useSharedValue(0);
  const spinValue = useSharedValue(0);
  const floatDelayedValue = useSharedValue(0);

  useEffect(() => {
    // Float animation (6s cycle like web)
    floatValue.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Spin animation (60s cycle like web)
    spinValue.value = withRepeat(
      withTiming(1, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );

    // Delayed float (3s delay like web)
    floatDelayedValue.value = withDelay(
      3000,
      withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(floatValue.value, [0, 1], [0, -10]) }]
  }));

  const floatDelayedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatDelayedValue.value, [0, 1], [0, -10]) },
      { scale: 1.1 }
    ]
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinValue.value * 360}deg` }]
  }));

  return (
    <View className="relative w-80 h-80 items-center justify-center">
      {/* Background flutuante */}
      <Animated.View 
        style={floatStyle}
        className="absolute inset-0 bg-white rounded-[4rem] shadow-xl shadow-slate-200" 
      />
      
      {/* Círculo tracejado girando */}
      <Animated.View 
        style={spinStyle}
        className="absolute w-64 h-64 rounded-full border-8 border-dashed border-amber-400/10" 
      />
      
      {/* Quebra-cabeça Múltiplo (As 4 cores clássicas do autismo) */}
      <Animated.View style={floatDelayedStyle} className="flex-row flex-wrap w-56 h-56 justify-center items-center">
        <View className="p-2">
          <Puzzle size={70} color="#3B82F6" className="opacity-90" />
        </View>
        <View className="p-2 rotate-90">
          <Puzzle size={70} color="#FBBF24" className="opacity-90" />
        </View>
        <View className="p-2 -rotate-90">
          <Puzzle size={70} color="#EF4444" className="opacity-90" />
        </View>
        <View className="p-2 rotate-180">
          <Puzzle size={70} color="#10B981" className="opacity-90" />
        </View>
      </Animated.View>

      {/* Ícones flutuantes periféricos */}
      <Animated.View style={[floatDelayedStyle, { position: 'absolute', top: 40, right: 40 }]}>
        <Heart size={20} color="#EF4444" />
      </Animated.View>
      
      <Animated.View style={[floatStyle, { position: 'absolute', bottom: 48, left: 40 }]}>
        <Activity size={24} color="#10B981" />
      </Animated.View>
    </View>
  );
};
