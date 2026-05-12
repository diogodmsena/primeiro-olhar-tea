import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Header } from '../components/Header';
import { useI18n } from '../contexts/I18nContext';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, Video, UploadCloud, AlertCircle, XCircle, CheckCircle, AlertTriangle } from '../components/LucideIcons';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useToast } from '../contexts/ToastContext';

type Step = 1 | 2 | 3;

export default function TriagemScreen() {
  const { t } = useI18n();
  const router = useRouter();

  // Estados
  const [step, setStep] = useState<Step>(1);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  
  // Referências
  const q2Ref = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const { showToast } = useToast();

  // Form State
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState<number>(3);
  const [concerns, setConcerns] = useState('');
  const [communicationDelays, setCommunicationDelays] = useState('');
  const [respondsToName, setRespondsToName] = useState('');
  const [pretendPlay, setPretendPlay] = useState('');
  const [repetitiveBehaviors, setRepetitiveBehaviors] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Navegação entre passos
  const goToStep = (next: Step) => {
    setStep(next);
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), 50);
  };

  const handleNext = () => goToStep(Math.min(step + 1, 3) as Step);
  const handlePrev = () => goToStep(Math.max(step - 1, 1) as Step);

  // ── GRAVAÇÃO DE VÍDEO (APP NATIVO) ──
  const recordVideo = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      showToast("Permissão de câmera necessária para gravar o vídeo.", "warning");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true, 
      quality: 0.7,
      videoMaxDuration: 30, // O iOS respeita isso, alguns Androids não.
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const videoAsset = result.assets[0];
      
      // duration vem em milissegundos. Colocamos 32000 (32s) para dar uma pequena 
      // margem de tolerância caso o usuário demore 1 segundo a mais para apertar o stop.
      if (videoAsset.duration && videoAsset.duration > 32000) {
        showToast("Vídeo muito longo. Grave no máximo 30 segundos.", "warning");
        return; // Impede que o vídeo seja carregado no app
      }

      setVideoUri(videoAsset.uri);
    }
  };

  // ── ESCOLHER DA GALERIA ──
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.7,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const videoAsset = result.assets[0];

      // Aqui você limitava a 3 minutos (180 segundos) no código original
      if (videoAsset.duration && videoAsset.duration > 185000) {
        showToast("Por favor, escolha um vídeo de até 3 minutos.", "warning");
        return;
      }

      setVideoUri(videoAsset.uri);
    }
  };

  const MAX_VIDEO_SIZE_MB = 50;

  // ── ENVIO DOS DADOS ──
  const submitTriagem = async () => {
    Keyboard.dismiss();
    if (!videoUri) {
      showToast("Por favor, escolha um vídeo para a triagem.", "warning");
      return;
    }
    setIsSubmitting(true);

    try {
      if (Platform.OS !== 'web') {
        const fileInfo = await FileSystem.getInfoAsync(videoUri);
        if (fileInfo.exists && fileInfo.size) {
          const fileSizeMB = fileInfo.size / (1024 * 1024);
          if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
            showToast(`Vídeo muito grande. Use um vídeo de até ${MAX_VIDEO_SIZE_MB}MB.`, "warning");
            setIsSubmitting(false);
            return;
          }
        }
      }

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
      const endpoint = `${apiUrl}/api/triagem`;

      const fetchResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
          'Accept': 'application/json',
        },
        body: formData,
      });

      const responseData = await fetchResponse.json().catch(() => null);

      if (!fetchResponse.ok) {
        const status = fetchResponse.status;
        let msg: string = `Erro ${status}: ${responseData?.detail || 'Erro desconhecido'}`;
        if (status === 403) msg = 'Acesso bloqueado (403). Verifique WAF/Cloudflare.';
        else if (status === 413) msg = 'Vídeo muito grande. Use um vídeo de até 100MB.';
        
        showToast(msg, 'error');
        return;
      }

      if (responseData?.job_id) {
        router.push(`/resultado?job_id=${responseData.job_id}`);
        return;
      }

      showToast('Resposta inesperada do servidor. Tente novamente.', 'error');
    } catch (e: any) {
      showToast(`Erro de conexão: ${e.message}`, 'error');
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
          {isSelected && <View className={`w-4 h-4 rounded-full ${colorClass === 'blue' ? 'bg-blue-500' : 'bg-rose-500'}`} />}
        </View>
        <Text className={`font-bold text-lg ${isSelected ? (colorClass === 'blue' ? 'text-blue-500' : 'text-rose-500') : 'text-slate-600'}`}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Header />

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

              {/* ORIENTAÇÃO DE GRAVAÇÃO - IGUAL AO FRONTEND */}
              <View className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 mb-4">
                <Text className="font-bold text-blue-700 text-base mb-2">💡 Dicas para um vídeo eficaz:</Text>
                <View className="gap-y-1.5">
                  <View className="flex-row items-start">
                    <Text className="text-base text-slate-600 mr-2">•</Text>
                    <Text className="text-base text-slate-600 flex-1">Grave a criança em um ambiente tranquilo e bem iluminado</Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-base text-slate-600 mr-2">•</Text>
                    <Text className="text-base text-slate-600 flex-1">Posicione a câmera na altura do rosto, a cerca de 1 metro de distância</Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-base text-slate-600 mr-2">•</Text>
                    <Text className="text-base text-slate-600 flex-1">Chame a criança pelo nome durante a gravação e observe a reação</Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-base text-slate-600 mr-2">•</Text>
                    <Text className="text-base text-slate-600 flex-1">Ideal: até 30 segundos em uma interação natural (brincar, conversar)</Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-base text-slate-600 mr-2">•</Text>
                    <Text className="text-base text-slate-600 flex-1">Evite muitos estímulos ao redor (TV ligada, outras pessoas falando)</Text>
                  </View>
                </View>
              </View>

              {videoUri ? (
                <View className="bg-emerald-50 items-center justify-center rounded-2xl border-2 border-emerald-500 border-dashed py-12 gap-4">
                  <Video color="#10b981" size={48} />
                  <Text className="text-emerald-700 font-bold text-lg">Vídeo Pronto para Envio</Text>
                  <TouchableOpacity
                    onPress={() => setVideoUri(null)}
                    className="px-6 py-2 bg-emerald-100 rounded-full"
                  >
                    <Text className="text-emerald-700 font-bold">Remover e Escolher Outro</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="bg-slate-50 rounded-2xl border border-slate-200 p-6 gap-4 items-center">
                  <TouchableOpacity
                    onPress={recordVideo}
                    className="w-full bg-blue-500 p-4 rounded-xl flex-row items-center justify-center gap-2"
                  >
                    <Camera color="#fff" size={20} />
                    <Text className="text-white font-bold ml-2">Gravar Vídeo Agora</Text>
                  </TouchableOpacity>
                  
                  <Text className="text-slate-600 text-center font-medium">OU</Text>
                  
                  <TouchableOpacity onPress={pickVideo} className="w-full bg-slate-200 p-4 rounded-xl items-center flex-row justify-center border border-slate-200">
                    <ImageIcon color="#64748b" size={20} />
                    <Text className="font-bold text-slate-600 ml-2">Escolher da Galeria</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View className="bg-orange-50 p-4 rounded-xl mt-4 flex-row items-start gap-3 border border-orange-100 shadow-sm shadow-orange-100/50">
                <AlertTriangle color="#f97316" size={22} />
                <Text className="text-orange-800 text-sm flex-1 leading-5 font-bold">
                  {t('form.privacyNote')}
                </Text>
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