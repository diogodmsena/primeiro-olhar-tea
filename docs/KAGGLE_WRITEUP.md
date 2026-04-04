# Gemma-4-Good: Bridging the Gap In Neurodevelopment

**Track**: Health & Sciences

## 1. O Desafio Local de Alcance Global

No Brasil e em vastas partes do mundo em desenvolvimento, o diagnóstico do Transtorno do Espectro Autista (TEA) esbarra em um obstáculo logístico: a falta de neuropediatras. Essa carência força mães a entrarem em filas do sistema público de saúde que podem durar mais de dois anos.

Perder a janela entre os 18 e 36 meses de vida afeta irreparavelmente o teto da neuroplasticidade alcançável através das intervenções precoces. O desafio é: Como democratizamos o screening inteligente, que deve ser confiável e totalmente transparente, e acima de tudo ético?

Este projeto, o **Gemma-4-Good**, responde a isso. Trata-se de uma aplicação de triagem multimodal rodando na ponta que combina processadores heurísticos de vídeo e áudio em fusão com um poderoso "Agentic Retriever" estruturado no modelo LLM Gemma 4.

## 2. A Arquitetura Técnica Multimodal

Desenvolvemos um MVP rigoroso composto de:
*   **Next.js Client (Edge-ready UI)**: Tela desenhada em Tailwind que preza por acessibilidade universal, onde pais sobem evidências comportamentais com fricção mínima.
*   **Visão e Prosódia (Aglomerador Base)**: Em background, usamos MediaPipe para extrair Gaze e expressividade facial, protegendo completamente a privacidade ao destruir o vídeo de origem e transformar os dados apenas num JSON de pontuações de tracking.
*   **Risk Engine (FastAPI Backend)**: Modulador ponderado que combina os inputs para gerar uma pontuação matricial (Risk Score). 

A barreira anterior que enfrentávamos era que dados brutos, mesmo se matematicamente acurados, são letais do ponto de vista do choque emocional quando mostrados diretos ao tutores. 

## 3. A Estrela do Show: Gemma 4 Explicit Integration

A magia acontece na camada semântica onde fizemos o "Native Function Calling" / Advanced Prompting com o **Gemma 4**. O Gemma atua com papel de domínio-especialista treinado em aconselhamento pediátrico base.

Para assegurar Groundedness, amarramos fortemente o output às features alimentadas do painel (Contato Visual x, Expressividade Motora y). O modelo compreende a linguagem do paciente e elabora um veredito altamente explicável em markdown. 

Ele atua nas nuances, correlacionando o choro do arquivo de áudio ou a recusa motora extraída por computação visual para produzir um laudo provisório que dita exatamente *porquê* há um risco e a qual especialidade recorrer primariamente — preenchendo a lacuna perfeitamente e garantindo Segurança e Confiança (Trust).

## 4. Projeto Links

*   **Public Repository:** [https://github.com/usuario/gemma-4-good](#)
*   **Live Demo (Mocked Edge):** [https://gemma-4.vercel.app](#) 
*   **Video Submissão:** (Adicionar link do YouTube)
