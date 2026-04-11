# Primeiro Olhar - Mobile App 📱

O **Primeiro Olhar Mobile** é o aplicativo desenvolvido em React Native (Expo) que serve como a fronteira móvel voltada para as famílias e cuidadores submeterem vídeos e questionários focados em triagem comportamental e de neurodivergências (TEA). O aplicativo processa os uploads encaminhando-os nativamente para o nosso Backend impulsionado por Inteligência Artificial (Google Gemini Flash Multimodal).

## 🚀 Tecnologias

- **Framework:** [React Native](https://reactnative.dev) + [Expo SDK 54](https://expo.dev/)
- **Estilo:** NativeWind (Tailwind CSS Mobile) com interóp nativa robusta.
- **Navegação:** Expo Router (File-based navigation).
- **Componentes Físicos:** `expo-camera` para captura de vídeo segura e sem compressões pesadas em ambiente de desenvolvimento.
- **Renderização e Parser Gráfico:** `react-native-markdown-display` (para processamento de markdown e negritos injetados do Laudo da inteligência artifical).

## 🛠 Como Executar Para Testes (Emulador e Físico)

### 1. Pré-Requisitos
- Ter o Backend Python e Banco de Dados rodando através do Docker paralelamente.
- Aplicativo **Expo Go** instalado no seu telefone iOS ou Android.

### 2. Configurando as Pontes de Rede
As requisições no aplicativo Mobile (como o pacote multipartes da Triagem) precisam chegar ao Backend. Por rodar na Sandbox de um celular físico via Wi-Fi, o aplicativo desconhece as rotas `localhost` do seu computador.

1. Crie o arquivo `.env` na raiz da pasta `/mobile`.
2. Oculte o IP Dinâmico de rede (IPv4 da sua Máquina no Wi-Fi local onde roda o Docker):
```env
EXPO_PUBLIC_API_URL=http://<SEU_IP_LOCAL_DE_REDE>:8000
```
> **Aviso Crítico:** Emuladores do Android Studio usam `10.0.2.2`. Aparelhos físicos via Expo Go exigem IP explícito de rede (Exemplo: `192.168.x.x`).

### 3. Rodando o Bundler do Expo
Baixe a árvore garantindo que sem dependências peer de versões obsoletas quebrem a UI:
```bash
npm install
```

Sempre inicie o motor do Metro Bundler limpando o cache, especialmente ao inserir tokens ou alterar o `.env`:
```bash
npx expo start -c
```
Em seguida, encoste a câmera natural (iOS) ou a leitura nativa do Expo Go (Android) no QR Code para parear via Tunelamento Local.

## 📂 Arquitetura do App

```text
/mobile
  ├── app/                  # Core de Rotas do celular (Expo Router)
  │    ├── _layout.tsx      # Wrappers Maestrais da aplicação (Auth, i18n, SafeArea)
  │    ├── index.tsx        # Splash Screen Inicial do Primeiro Olhar
  │    ├── triagem.tsx      # Multi-STEP form complexo (Cam -> Forms -> Upload)
  │    ├── resultado.tsx    # Parsing de Score Bars e Laudo do Gemini
  │    └── historico.tsx    # Flatlist Nativo listando avaliações antigas ativas
  ├── components/           # Componentes injetáveis globais
  │    ├── Header.tsx       
  │    └── LucideIcons.tsx  # Proxy blindado de ícones Expo p/ mitigar falhas ESM
  ├── contexts/             # Camada Singleton de Memória (Estados de UI)
  └── global.css            # Ponto de Injeção das chaves Tailwind para CSS Nativo
```

---
Desenvolvido com carinho sob a bandeira de inovação acelerada. 💙
