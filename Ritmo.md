 PROMPT MAESTRO: REDISEÑO INTEGRAL DE "LEX LABORAL" BAJO EL FRAMEWORK DEL RITMO

## 1. ROL Y MISIÓN
Actúa como un **Principal Product Architect & UX Strategist especializado en LegalTech y Psicología de la Retención**. 

Tu objetivo es rediseñar la plataforma **Lex Laboral (lexlaboral.com.mx)** para convertirla en el **estándar técnico y de facto en México** para cálculos laborales (liquidaciones, finiquitos, pensiones, cuotas patronales y fundamentación normativa). 

El producto debe mantener una **neutralidad técnica radical**: no toma partido ni por el trabajador ni por el patrón; entrega certeza matemática e interpretativa basada en la Ley Federal del Trabajo (LFT), la Ley del Seguro Social (LSS) y criterios vigentes. Debe ser intuitivo tanto para el usuario que entra por curiosidad como para quien enfrenta una contingencia activa o un litigio profesional (RH, abogados, contadores).

---

## 2. ARQUITECTURA DE VARIABLES: EL FRAMEWORK DEL RITMO

Debes auditar y rediseñar cada pantalla, micro-interacción y flujo del producto bajo las siguientes 5 variables mecánicas:

### A. ROI Cognitivo y Time-to-Hook (Fricción Cero)
* **Regla:** Maximizar el ratio `Valor Percibido / Esfuerzo Exigido`. El usuario debe obtener un dividendo visual o numérico en menos de 5 segundos.
* **Requerimiento:**
  - Mantener la promesa: "100% gratuito y sin registro obligatorio".
  - Implementar un **modo dual de entrada**:
    1. *Modo Exprés (Curiosidad):* Selector rápido de sueldo aproximado y antigüedad en años para un resultado inmediato.
    2. *Modo Forense (Profesional/En conflicto):* Campos exactos de fecha de ingreso, baja, salario diario integrado (SDI), vacaciones pendientes y comisiones.
  - Conservar y potenciar el botón `[Ejemplo]` para testeo instantáneo.

### B. Ventana de Asimilación y Control de Fatiga (Recovery Ratio)
* **Regla:** Mantener un equilibrio entre tensión y digestión ($R_a = T_d / T_e$). Evitar el "efecto saturación" de tablas densas de nómina.
* **Requerimiento:**
  - **Jerarquía en 2 niveles:**
    - *Nivel 1 (Clímax):* Tarjeta de alto contraste con el número total neto estimado y tres métricas ancla (Finiquito, Liquidación Constitucional, Retención ISR).
    - *Nivel 2 (Desglose analítico colapsable):* Gráfico de composición y fórmulas transparentes paso a paso (días $\times$ cuota diaria $\times$ factor) accesible solo mediante clic voluntario ("Ver Composición y Desglose").

### C. Compresión de Intervalo (Cierre del Embudo Post-Cálculo)
* **Regla:** Acelerar el flujo hacia el clímax. El punto de máxima tensión ocurre cuando aparece la cifra final. La interfaz **no debe dejar morir la inercia** con desvíos temáticos ni enfriamientos.
* **Requerimiento:**
  - Sustituir los enlaces horizontales desconectados (como mandar a calcular IMSS en medio de un despido) por un **Módulo de Acción Trifurcado e Imparcial**:
    1. *Ruta Trabajador:* "Comparar contra finiquito ofrecido" o "Guía técnica para audiencia de conciliación".
    2. *Ruta Patrón / RH:* "Calcular contingencia de 20 días por año" o "Generar proyecto de convenio para Centro de Conciliación".
    3. *Ruta Profesional:* "Exportar desglose forense con fundamentación de artículos LFT aplicables".

### D. Variabilidad Estocástica (Ruptura del Patrón "Excel Aburrido")
* **Regla:** Alternar micro-recompensas cuantitativas (números rápidos) con recompensas cualitativas de alto valor semántico.
* **Requerimiento:**
  - Vincular de forma dinámica la calculadora con el **Fundamentador Jurídico**: cada rubro calculado (ej. Prima de Antigüedad - Art. 162 LFT) debe incluir un micro-enlace tooltip que despliegue el fundamento normativo sin abandonar la pantalla de resultados.

### E. Modularidad Atómica y Viralidad de Distribución
* **Regla:** Cada herramienta y cada resultado debe conservar su valor si se aísla de la plataforma.
* **Requerimiento:**
  - **El PDF como Estándar de la Industria:** Rediseñar la exportación de resultados (`[+ PDF]`) para que funcione como un documento con formato de dictamen técnico neutral: folio único, desglose de artículos, fecha, advertencia de imparcialidad y sellos visuales de validez algorítmica. Un documento que un usuario pueda imprimir y llevar directamente al Centro Federal de Conciliación y Registro Laboral o a una junta de RH.
  - **Generación de Enlaces Compartibles:** Opción de "Compartir escenario" mediante URL encriptada o código QR (sin guardar datos personales en servidor) para revisión colaborativa entre trabajador y abogado o patrón y contador.

---

## 3. ENTREGABLES REQUERIDOS

Genera una propuesta detallada que incluya:

1. **Arquitectura de la Pantalla Principal (Landing / Hero):**
   - Estructura y copy exacto del H1, subtítulo y selector central de herramientas (Liquidación, Cuotas IMSS, Pensiones, Fundamentador).
   - Mecánica de neutralidad: cómo comunicar en una frase que la herramienta sirve con la misma precisión a un director de RH, a un obrero o a un actuario.

2. **Flujo de la Calculadora de Liquidación y Finiquito (Paso a Paso):**
   - Wireframe textual de la entrada de datos (Modo Exprés vs. Modo Forense).
   - Diseño del bloque de Clímax (la entrega del número final).
   - Especificación del acordeón de asimilación (fórmulas e ISR).

3. **Módulo de Conversión Post-Cálculo:**
   - Detalle de los componentes que aparecen inmediatamente debajo de la cifra calculada para evitar la fuga de atención y sostener el ritmo.

4. **Especificación del Formato de Exportación (PDF Estándar Nacional):**
   - Estructura visual y elementos que convierten la hoja de resultados en un activo con autoridad probatoria y técnica.