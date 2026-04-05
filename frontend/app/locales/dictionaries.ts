export type Locale = 'pt' | 'en' | 'es';

export const dictionaries = {
  pt: {
    nav: {
      home: "Início",
      howItWorks: "Como Funciona",
      community: "Comunidade",
      professionalArea: "Área do Profissional"
    },
    hero: {
      badge: "Feito com carinho para famílias",
      titleStart: "Apoio precoce,",
      titleHighlight: "futuro brilhante.",
      subtitle: "Nossa plataforma de triagem utiliza uma inteligência artificial acolhedora para avaliar sinais de neurodivergência de forma leve e acessível.",
      cta: "Quero Iniciar Avaliação"
    },
    form: {
      headerBadge: "Primeiro Passo",
      headerSubtitle: "Preencha com calma. Você está em um ambiente seguro.",
      step1Title: "Vídeo da Criança",
      dropzoneDefaultTitle: "Arraste um vídeo aqui ou clique",
      dropzoneDefaultSubtitle: "MP4 ou MOV (10 a 15 segundos)",
      dropzoneSuccessSubtitle: "Clique novamente para trocar",
      step2Title: "Observações do Cotidiano",
      q1Label: "Quais comportamentos te chamaram atenção?",
      q1Placeholder: "Ex: Ele cruza as perninhas, balança muito as mãos...",
      q2Label: "Há atrasos na fala ou comunicação?",
      q2Placeholder: "Ex: Ainda não formula frases completas...",
      q3Label: "A criança responde quando é chamada pelo nome?",
      q3OptYes: "Sim, responde",
      q3OptNo: "Não, raramente",
      submitButton: "Iniciar Avaliação",
      submitLoading: "Analisando com Carinho..."
    },
    footer: {
      text: "Primeiro Olhar © {year}. Criado para acolher e transformar."
    }
  },
  en: {
    nav: {
      home: "Home",
      howItWorks: "How It Works",
      community: "Community",
      professionalArea: "Professional Area"
    },
    hero: {
      badge: "Made with care for families",
      titleStart: "Early support,",
      titleHighlight: "bright future.",
      subtitle: "Our screening platform uses welcoming AI to assess signs of neurodivergence in a light and accessible way.",
      cta: "Start Assessment"
    },
    form: {
      headerBadge: "First Step",
      headerSubtitle: "Fill it out calmly. You are in a safe environment.",
      step1Title: "Child's Video",
      dropzoneDefaultTitle: "Drag a video here or click",
      dropzoneDefaultSubtitle: "MP4 or MOV (10 to 15 seconds)",
      dropzoneSuccessSubtitle: "Click again to change",
      step2Title: "Daily Observations",
      q1Label: "What behaviors caught your attention?",
      q1Placeholder: "Ex: He crosses his legs, flaps his hands a lot...",
      q2Label: "Are there delays in speech or communication?",
      q2Placeholder: "Ex: Still doesn't form complete sentences...",
      q3Label: "Does the child respond when called by name?",
      q3OptYes: "Yes, responds",
      q3OptNo: "No, rarely",
      submitButton: "Start Assessment",
      submitLoading: "Analyzing with Care..."
    },
    footer: {
      text: "Primeiro Olhar © {year}. Created to welcome and transform."
    }
  },
  es: {
    nav: {
      home: "Inicio",
      howItWorks: "Cómo Funciona",
      community: "Comunidad",
      professionalArea: "Área Profesional"
    },
    hero: {
      badge: "Hecho con cariño para las familias",
      titleStart: "Apoyo temprano,",
      titleHighlight: "futuro brillante.",
      subtitle: "Nuestra plataforma de evaluación utiliza inteligencia artificial acogedora para evaluar signos de neurodivergencia de manera ligera y accesible.",
      cta: "Quiero Iniciar Evaluación"
    },
    form: {
      headerBadge: "Primer Paso",
      headerSubtitle: "Llénalo con calma. Estás en un entorno seguro.",
      step1Title: "Video del Niño/a",
      dropzoneDefaultTitle: "Arrastra un video aquí o haz clic",
      dropzoneDefaultSubtitle: "MP4 o MOV (10 a 15 segundos)",
      dropzoneSuccessSubtitle: "Haz clic de nuevo para cambiar",
      step2Title: "Observaciones Diarias",
      q1Label: "¿Qué comportamientos te llamaron la atención?",
      q1Placeholder: "Ej: Él cruza las piernitas, mueve mucho las manos...",
      q2Label: "¿Hay retrasos en el habla o comunicación?",
      q2Placeholder: "Ej: Todavía no forma oraciones completas...",
      q3Label: "¿El niño/a responde cuando se le llama por su nombre?",
      q3OptYes: "Sí, responde",
      q3OptNo: "No, raramente",
      submitButton: "Iniciar Evaluación",
      submitLoading: "Analizando con Cariño..."
    },
    footer: {
      text: "Primeiro Olhar © {year}. Creado para acoger y transformar."
    }
  }
};

export type DictionaryContext = typeof dictionaries.pt;
