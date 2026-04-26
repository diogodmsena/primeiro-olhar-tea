import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Header } from '../components/Header';
import { useI18n } from '../contexts/I18nContext';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, Video, UploadCloud } from '../components/LucideIcons';
import axios from 'axios';

type Step = 1 | 2 | 3;

export default function TriagemScreen() {
  const { t } = useI18n();
  const router = useRouter();

  // Permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [step, setStep] = useState<Step>(1);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  // FIX #2: camera is lazy — only shown when user explicitly opens it
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraRef = useRef<any>(null);
  const q2Ref = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Form State
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState<number>(3);
  const [concerns, setConcerns] = useState('');
  const [communicationDelays, setCommunicationDelays] = useState('');
  const [respondsToName, setRespondsToName] = useState('');
  const [pretendPlay, setPretendPlay] = useState('');
  const [repetitiveBehaviors, setRepetitiveBehaviors] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FIX #3: scroll to top on every step change
  const goToStep = (next: Step) => {
    setStep(next);
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), 50);
  };

  const handleNext = () => goToStep(Math.min(step + 1, 3) as Step);
  const handlePrev = () => goToStep(Math.max(step - 1, 1) as Step);

  // FIX #2: open camera only when user taps the button
  const handleOpenCamera = async () => {
    if (!cameraPermission?.granted) await requestCameraPermission();
    if (!micPermission?.granted) await requestMicPermission();
    setCameraOpen(true);
  };

  const startRecording = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({ maxDuration: 180 });
      setIsRecording(false);
      if (video?.uri) {
        setVideoUri(video.uri);
        setCameraOpen(false);
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
      setCameraOpen(false);
    }
  };

  const submitTriagem = async () => {
    Keyboard.dismiss();
    if (!videoUri) {
      Alert.alert('Atenção', 'Por favor, grave ou anexe um vídeo da criança.');
      return;
    }
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(videoUri);
        const blob = await response.blob();
        const file = new File([blob], 'video.mp4', { type: 'video/mp4' });
        formData.append('video', file);
      } else {
        formData.append('video', {
          uri: videoUri,
          name: 'video.mp4',
          type: 'video/mp4',
        } as any);
      }

      const parentData = {
        child_name: childName,
        child_age: childAge,
        concerns,
        communication_delays: communicationDelays,
        responds_to_name: respondsToName,
        pretend_play: pretendPlay,
        repetitive_behaviors: repetitiveBehaviors,
      };

      formData.append('parent_answers', JSON.stringify(parentData));

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      console.log('[Triagem] Sending to:', `${apiUrl}/api/triagem`);

      const axiosResponse = await axios.post(`${apiUrl}/api/triagem`, formData, {
        headers: Platform.OS === 'web' ? {} : { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });

      if (axiosResponse.data?.job_id) {
        router.push(`/resultado?job_id=${axiosResponse.data.job_id}`);
      }
    } catch (e: any) {
      console.error('[Triagem] Error:', e.message, e.config?.url);
      if (e.response) {
        console.error('[Triagem] Response data:', JSON.stringify(e.response.data));
      }
      const isNetworkError = e.message === 'Network Error' || e.code === 'ECONNABORTED';
      const msg = isNetworkError
        ? 'Não foi possível conectar ao servidor. Verifique se o celular está na mesma rede Wi-Fi do computador.'
        : (e.response?.data?.detail || 'Erro ao iniciar análise');
      Alert.alert('Erro', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const RadioButton = ({
    label, value, selectedValue, onSelect, colorClass,
  }: {
    label: string; value: string; selectedValue: string;
    onSelect: (val: string) => void; colorClass: 'blue' | 'rose';
  }) => {
    const isSelected = value === selectedValue;
    return (
      <TouchableOpacity
        onPress={() => onSelect(value)}
        className="flex-row items-center mr-6 py-3"
        activeOpacity={0.7}
      >
        <View className={`w-8 h-8 rounded-full border-2 items-center justify-center mr-3 ${isSelected ? (colorClass === 'blue' ? 'border-blue-500' : 'border-rose-500') : 'border-slate-300'}`}>
          {isSelected && (
            <View className={`w-4 h-4 rounded-full ${colorClass === 'blue' ? 'bg-blue-500' : 'bg-rose-500'}`} />
          )}
        </View>
        <Text className={`font-bold text-lg ${isSelected ? (colorClass === 'blue' ? 'text-blue-500' : 'text-rose-500') : 'text-slate-600'}`}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    // FIX #1: SafeAreaView with edges so content never overlaps the status bar
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Header />

        {/* Stepper Progress */}
        <View className="flex-row items-center justify-between px-8 py-6 bg-slate-50 border-b border-slate-100">
          {[1, 2, 3].map((num) => (
            <View key={num} className="items-center flex-1">
              <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= num ? 'bg-blue-500' : 'bg-slate-200'}`}>
                <Text className={`font-bold ${step >= num ? 'text-white' : 'text-slate-400'}`}>{num}</Text>
              </View>
            </View>
          ))}
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── STEP 1 ── */}
          {step === 1 && (
            <View className="gap-4">
              <Text className="text-xl font-bold text-slate-800 mb-4">{t('form.step1Title')}</Text>
              <View className="bg-slate-50 p-6 rounded-2xl border border-slate-100 gap-4">
                <Text className="font-bold text-slate-700">{t('form.childNameLabel')}</Text>
                <TextInput
                  className="bg-white p-4 rounded-xl border border-slate-200 focus:border-blue-500 font-medium text-slate-700"
                  placeholder="Nome da criança"
                  value={childName}
                  onChangeText={setChildName}
                />
              </View>
              <View className="bg-slate-50 p-6 rounded-2xl border border-slate-100 gap-4">
                <Text className="font-bold text-slate-700 mt-2">{t('form.childAgeLabel') || 'Qual a idade da criança?'}</Text>
                <View className="flex-row justify-between mt-1">
                  {[1, 2, 3, 4, 5, 6].map(age => (
                    <TouchableOpacity
                      key={age}
                      onPress={() => setChildAge(age)}
                      activeOpacity={0.7}
                      className={`w-[14%] aspect-square rounded-xl items-center justify-center border-2 ${childAge === age ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-200'}`}
                    >
                      <Text className={`font-bold text-lg ${childAge === age ? 'text-white' : 'text-slate-500'}`}>{age}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text className="text-blue-500 font-bold self-center -mt-1">
                  {childAge} {childAge === 1 ? (t('common.year') || 'ano') : (t('common.years') || 'anos')}
                </Text>

                <View className="flex-column gap-4 mt-4">
                  <TouchableOpacity onPress={handleNext} className="bg-blue-500 p-4 rounded-xl items-center mt-4">
                    <Text className="text-white font-bold">Próximo Passo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/')} className="flex-1 bg-slate-200 p-4 rounded-xl items-center">
                    <Text className="text-slate-600 font-bold">Voltar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <View className="gap-4">
              <Text className="text-xl font-bold text-slate-800 mb-2">{t('form.step2Title')}</Text>

              <View className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4">
                <Text className="text-blue-800 font-bold mb-1">{t('how.step1Desc')}</Text>
                <Text className="text-blue-600 text-sm mt-1">💡 {t('how.step1Tip')}</Text>
              </View>

              {/* FIX #2: Camera is lazy — only render after user taps "Abrir câmera" */}
              {videoUri ? (
                /* Video recorded successfully */
                <View className="bg-emerald-50 items-center justify-center rounded-2xl border-2 border-emerald-500 border-dashed py-12 gap-4">
                  <Video color="#10b981" size={48} />
                  <Text className="text-emerald-700 font-bold text-lg">Vídeo Gravado com Sucesso</Text>
                  <TouchableOpacity
                    onPress={() => { setVideoUri(null); setCameraOpen(false); }}
                    className="px-6 py-2 bg-emerald-100 rounded-full"
                  >
                    <Text className="text-emerald-700 font-bold">Gravar Outro</Text>
                  </TouchableOpacity>
                </View>
              ) : cameraOpen ? (
                /* Camera is open */
                <View className="overflow-hidden rounded-2xl bg-black h-[400] relative">
                  <CameraView
                    ref={cameraRef}
                    style={{ flex: 1 }}
                    mode="video"
                    facing="back"
                  />
                  <View className="absolute bottom-8 left-0 right-0 items-center">
                    {!isRecording ? (
                      <TouchableOpacity
                        onPress={startRecording}
                        className="w-16 h-16 bg-red-500 rounded-full border-4 border-white"
                      />
                    ) : (
                      <TouchableOpacity
                        onPress={stopRecording}
                        className="w-16 h-16 bg-white rounded-full items-center justify-center border-4 border-red-500"
                      >
                        <View className="w-6 h-6 bg-red-500 rounded-sm" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {/* Close camera */}
                  <TouchableOpacity
                    onPress={() => setCameraOpen(false)}
                    className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full"
                  >
                    <Text className="text-white font-bold text-sm">✕ Fechar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Default state: action buttons only */
                <View className="bg-slate-50 rounded-2xl border border-slate-200 p-6 gap-4 items-center">
                  <Camera color="#3b82f6" size={48} />
                  <Text className="text-slate-600 text-center font-medium">
                    Grave um vídeo curto da criança ou escolha um da galeria.
                  </Text>
                  <TouchableOpacity
                    onPress={handleOpenCamera}
                    className="w-full bg-blue-500 p-4 rounded-xl flex-row items-center justify-center gap-2"
                  >
                    <Camera color="#fff" size={20} />
                    <Text className="text-white font-bold ml-2">Abrir Câmera</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View className="flex-row gap-4 mt-2">
                <TouchableOpacity onPress={pickVideo} className="flex-1 bg-slate-100 p-4 rounded-xl items-center flex-row justify-center border border-slate-200">
                  <ImageIcon color="#64748b" size={20} />
                  <Text className="font-bold text-slate-600 ml-2">Usar Galeria</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-4 mt-4">
                <TouchableOpacity onPress={handlePrev} className="flex-1 bg-slate-200 p-4 rounded-xl items-center">
                  <Text className="text-slate-600 font-bold">Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleNext}
                  disabled={!videoUri}
                  className={`flex-1 p-4 rounded-xl items-center ${videoUri ? 'bg-blue-500' : 'bg-blue-300'}`}
                >
                  <Text className="text-white font-bold">Próximo</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <View className="gap-6">
              <Text className="text-xl font-bold text-slate-800 mb-2">{t('form.step3Title')}</Text>

              <View className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 gap-2 flex-col">
                <Text className="text-lg font-bold text-slate-800 leading-tight">{t('form.q3Label') || 'A criança atende pelo nome?'}</Text>
                <View className="flex-column mt-2">
                  <RadioButton label={t('form.q3OptYes') || 'Sim'} value="yes" selectedValue={respondsToName} onSelect={setRespondsToName} colorClass="blue" />
                  <RadioButton label={t('form.q3OptNo') || 'Não'} value="no" selectedValue={respondsToName} onSelect={setRespondsToName} colorClass="rose" />
                </View>
              </View>

              <View className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 gap-2 flex-col">
                <Text className="text-lg font-bold text-slate-800 leading-tight">{t('form.q4Label') || 'A criança brinca de faz de conta?'}</Text>
                <Text className="text-lg text-slate-400 -mt-1 mb-2">{t('form.q4Hint') || '(ex: dar comidinha para boneca)'}</Text>
                <View className="flex-row">
                  <RadioButton label={t('form.optYes') || 'Sim'} value="yes" selectedValue={pretendPlay} onSelect={setPretendPlay} colorClass="blue" />
                  <RadioButton label={t('form.optNo') || 'Não'} value="no" selectedValue={pretendPlay} onSelect={setPretendPlay} colorClass="rose" />
                </View>
              </View>

              <View className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 gap-2 flex-col">
                <Text className="text-lg font-bold text-slate-800 leading-tight">{t('form.q5Label') || 'Costume de enfileirar objetos?'}</Text>
                <View className="flex-row mt-2">
                  <RadioButton label={t('form.optYes') || 'Sim'} value="yes" selectedValue={repetitiveBehaviors} onSelect={setRepetitiveBehaviors} colorClass="blue" />
                  <RadioButton label={t('form.optNo') || 'Não'} value="no" selectedValue={repetitiveBehaviors} onSelect={setRepetitiveBehaviors} colorClass="rose" />
                </View>
              </View>

              <View className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 gap-4 flex-col mt-2">
                <Text className="text-lg font-bold text-slate-800">{t('form.q1Label')}</Text>
                <TextInput
                  multiline
                  blurOnSubmit={false}
                  returnKeyType="next"
                  onSubmitEditing={() => q2Ref.current?.focus()}
                  className="bg-white p-4 h-24 rounded-xl border border-slate-200 focus:border-blue-500 font-medium text-slate-700"
                  placeholder={t('form.q1Placeholder')}
                  value={concerns}
                  onChangeText={setConcerns}
                />

                <Text className="text-lg font-bold text-slate-800 mt-4">{t('form.q2Label')}</Text>
                <TextInput
                  ref={q2Ref}
                  multiline
                  className="bg-white p-4 h-24 rounded-xl border border-slate-200 focus:border-blue-500 font-medium text-slate-700"
                  placeholder={t('form.q2Placeholder')}
                  value={communicationDelays}
                  onChangeText={setCommunicationDelays}
                />
              </View>

              <View className="flex-row gap-4 mt-8">
                <TouchableOpacity onPress={handlePrev} className="flex-1 bg-slate-200 p-4 rounded-xl items-center justify-center">
                  <Text className="text-slate-600 font-bold">Voltar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={submitTriagem}
                  disabled={isSubmitting}
                  className={`flex-[2] flex-row p-4 rounded-xl items-center justify-center ${isSubmitting ? 'bg-emerald-300' : 'bg-emerald-500'}`}
                >
                  {isSubmitting ? <ActivityIndicator color="#fff" /> : <UploadCloud color="#fff" size={20} />}
                  <Text className="text-white font-bold ml-2">{isSubmitting ? t('form.submitLoading') : t('form.submitButton')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}