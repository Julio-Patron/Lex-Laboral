# ⚖️ Lex Laboral - Inteligencia Jurídica Laboral

Lex Laboral es una plataforma gratuita de herramientas jurídicas laborales para México. Incluye calculadoras de liquidación, IMSS/INFONAVIT y pensiones, además de un buscador semántico de artículos de la Ley Federal del Trabajo y normatividad vigente. Parámetros actualizados a **2026**.

**🌐 Accede a la aplicación:** [https://lexlaboral.com.mx](https://lexlaboral.com.mx)

## 🚀 Funcionalidades Principales

*   **🧮 Calculadora Laboral 2026:** Finiquitos, indemnizaciones por despido, horas extra, aguinaldo y vacaciones (SMG $312.41).
*   **🏥 Calculadora IMSS e INFONAVIT:** Estimación de cuotas obrero-patronales con tablas de Cesantía y Vejez progresivas (UMA $119.35).
*   **👴 Calculadora de Pensiones:** Estimación bajo la Ley del 73 y la Ley del 97 del IMSS.
*   **🔍 Consultas Jurídicas:** Búsqueda semántica en la LFT, LSS e INFONAVIT con evidencias rankeadas por similitud.
*   **🔔 Centro de Notificaciones:** Alertas internas de la aplicación.

## 🛠️ Tecnologías

*   **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS, desplegado en **Vercel**.
*   **IA:** Google Gemini API (`text-embedding-004`) para recuperación semántica.
*   **Datos:** Base semántica LanceDB en `data/lance` cuando está disponible, con respaldo local versionado en `data/search-index.json`.

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---
*Lex Laboral: La tecnología al servicio de la justicia laboral.*
