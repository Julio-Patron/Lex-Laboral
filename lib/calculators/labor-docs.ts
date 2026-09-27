import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LaborSettlementResult } from './labor';

type TemplateType = 'A' | 'B' | 'C';

interface DocData {
  employeeName: string;
  employerName: string;
  results: LaborSettlementResult;
  dismissalLabel: string;
  startDate: string;
  endDate: string;
  yearsOfService: number;
  daysOfService: number;
  dailySalary: number;
  minWage: number;
}

const BRANDING_FOOTER = "Documento generado y respaldado por el motor normativo de LexLaboral.com.mx — Conforme a la Ley Federal del Trabajo vigente.";

// --- WORD GENERATION ---
export const generateWordDoc = async (template: TemplateType, data: DocData) => {
  const sections = [];

  const { results, employeeName, employerName, dismissalLabel, yearsOfService, daysOfService, dailySalary } = data;
  const nameLabel = employeeName || '_________________________';
  const employerLabel = employerName || '_________________________';
  const totalAmountStr = `$${results.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;


  if (template === 'A') {
    // Memoria Técnica
    sections.push(
      new Paragraph({ text: "MEMORIA TÉCNICA DE CÁLCULO Y FUNDAMENTACIÓN LFT", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: `Tipo de Caso: ${dismissalLabel}` }),
      new Paragraph({ text: `Fecha de Emisión: ${new Date().toLocaleDateString()}` }),
      new Paragraph({ text: `Antigüedad: ${yearsOfService} años, ${daysOfService} días` }),
      new Paragraph({ text: `Salario Diario Integrado (SDI): $${dailySalary.toFixed(2)}` }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "DESGLOSE ARITMÉTICO Y FUNDAMENTACIÓN:", heading: HeadingLevel.HEADING_2 })
    );

    const breakdown = [
      ['Concepto', 'Monto (MXN)', 'Fundamento'],
      ['Aguinaldo Proporcional', `$${results.aguinaldo.toFixed(2)}`, 'Art. 87 LFT'],
      ['Vacaciones Proporcionales', `$${results.vacations.toFixed(2)}`, 'Art. 76 LFT'],
      ['Prima Vacacional', `$${results.vacationPremium.toFixed(2)}`, 'Art. 80 LFT'],
      ['Indemnización 90 días', `$${results.indemnity90.toFixed(2)}`, 'Art. 48 LFT'],
      ['Indemnización 20 días/año', `$${results.indemnity20.toFixed(2)}`, 'Art. 50 LFT'],
      ['Prima de Antigüedad', `$${results.seniorityPremium.toFixed(2)}`, 'Art. 162 LFT'],
      ['Retención ISR (Estimada)', `-$${results.isr.toFixed(2)}`, 'Art. 95, 96 LISR'],
    ].filter(r => r[0] === 'Concepto' || parseFloat(r[1].replace('$', '').replace('-', '')) > 0);

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: breakdown.map(row => 
        new TableRow({
          children: row.map(cell => 
            new TableCell({ children: [new Paragraph({ text: cell })] })
          )
        })
      )
    });
    
    sections.push(table);
    sections.push(new Paragraph({ text: "" }));
    sections.push(new Paragraph({ text: `TOTAL NETO ESTIMADO: ${totalAmountStr}`, heading: HeadingLevel.HEADING_2 }));

  } else if (template === 'B') {
    // Recibo Finiquito
    sections.push(
      new Paragraph({ text: `BUENO POR: ${totalAmountStr} MXN`, alignment: AlignmentType.RIGHT }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "RECIBO DE FINIQUITO Y LIQUIDACIÓN CIRCUNSTANCIADO", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: `En la ciudad de ________________________, a los ___ días del mes de ______________ de _____, el/la C. ${nameLabel}, manifiesto expresamente y bajo protesta de decir verdad, haber recibido a mi entera satisfacción de mi patrón, la persona (física/moral) denominada ${employerLabel}, la cantidad total neta de ${totalAmountStr} (MXN), mediante (Efectivo / Transferencia / Cheque).` }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "Que la cantidad antes mencionada ampara el pago de todas y cada una de las prestaciones a las que tuve derecho derivadas de mi relación laboral conforme al siguiente desglose:" }),
      new Paragraph({ text: "" })
    );

    const tableRows = [
      new TableRow({ children: [new TableCell({ children: [new Paragraph("Concepto")] }), new TableCell({ children: [new Paragraph("Monto")] })] })
    ];
    if (results.aguinaldo > 0) tableRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph("Aguinaldo Proporcional")] }), new TableCell({ children: [new Paragraph(`$${results.aguinaldo.toFixed(2)}`)] })] }));
    if (results.vacations > 0) tableRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph("Vacaciones Proporcionales")] }), new TableCell({ children: [new Paragraph(`$${results.vacations.toFixed(2)}`)] })] }));
    if (results.vacationPremium > 0) tableRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph("Prima Vacacional")] }), new TableCell({ children: [new Paragraph(`$${results.vacationPremium.toFixed(2)}`)] })] }));
    if (results.indemnity90 > 0) tableRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph("Indemnización (90 días)")] }), new TableCell({ children: [new Paragraph(`$${results.indemnity90.toFixed(2)}`)] })] }));
    if (results.indemnity20 > 0) tableRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph("Indemnización (20 días/año)")] }), new TableCell({ children: [new Paragraph(`$${results.indemnity20.toFixed(2)}`)] })] }));
    if (results.seniorityPremium > 0) tableRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph("Prima de Antigüedad")] }), new TableCell({ children: [new Paragraph(`$${results.seniorityPremium.toFixed(2)}`)] })] }));
    
    sections.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }));
    sections.push(new Paragraph({ text: "" }));
    
    sections.push(
      new Paragraph({ text: "CLÁUSULA DE LIBERACIÓN MUTUA", heading: HeadingLevel.HEADING_3 }),
      new Paragraph({ text: `Con el pago de las cantidades antes descritas, declaro que no se me adeuda cantidad alguna por concepto de salarios ordinarios o extraordinarios, horas extras, aguinaldo, vacaciones, prima vacacional, prima de antigüedad, indemnizaciones, ni ninguna otra prestación derivada de la Ley Federal del Trabajo o contrato individual aplicable. Otorgo el finiquito más amplio que en derecho proceda, no reservándome acción ni derecho alguno, de ninguna naturaleza, en contra de ${employerLabel}, sus socios, representantes o quien sus derechos represente.` }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "____________________________________", alignment: AlignmentType.CENTER }),
      new Paragraph({ text: `Firma y Huella de ${nameLabel}`, alignment: AlignmentType.CENTER })
    );

  } else if (template === 'C') {
    // Carta de Renuncia
    sections.push(
      new Paragraph({ text: "CARTA DE RENUNCIA VOLUNTARIA", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: `Lugar y Fecha: _________________________________________`, alignment: AlignmentType.RIGHT }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: `A LA EMPRESA: ${employerLabel}`, heading: HeadingLevel.HEADING_3 }),
      new Paragraph({ text: "PRESENTE.-" }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: `Por medio del presente escrito y por así convenir a mis intereses particulares, presento formalmente mi RENUNCIA VOLUNTARIA, con carácter de irrevocable, al puesto de ________________________ que venía desempeñando al servicio de ${employerLabel}.` }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: `Hago constar expresamente que durante el tiempo que presté mis servicios me fueron pagados puntual y oportunamente todos mis salarios ordinarios y extraordinarios, así como todas y cada una de las prestaciones a que tuve derecho conforme a la Ley Federal del Trabajo. Asimismo, reconozco que nunca sufrí accidente ni enfermedad de trabajo alguna.` }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: `Agradezco de antemano la oportunidad y la confianza que me fue brindada durante el tiempo que laboré para esta empresa.` }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "ATENTAMENTE", alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "____________________________________", alignment: AlignmentType.CENTER }),
      new Paragraph({ text: `Firma y Huella de ${nameLabel}`, alignment: AlignmentType.CENTER })
    );
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: sections
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `LexLaboral_Plantilla_${template}_${new Date().getTime()}.docx`);
};

// --- PDF GENERATION ---
export const generatePDFDoc = (template: TemplateType, data: DocData) => {
  const doc = new jsPDF();
  const primaryColor: [number, number, number] = [30, 41, 59];
  const goldColor: [number, number, number] = [212, 175, 55];
  const { results, employeeName, employerName, dismissalLabel, startDate, endDate, yearsOfService, daysOfService, dailySalary, minWage } = data;
  const folio = `LEX-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${new Date().getFullYear()}`;
  const nameLabel = employeeName || '_________________________';
  const employerLabel = employerName || '_________________________';
  const totalAmountStr = `$${results.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  const addHeader = (title: string) => {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.setLineWidth(0.5);
    doc.circle(185, 22.5, 12, 'S');
    doc.setFontSize(5);
    doc.setTextColor(255, 255, 255);
    doc.text('VALIDADO', 178, 22);
    doc.text('ALGORITMO', 177, 25);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('LEXLABORAL', 20, 23);
    doc.setFontSize(10);
    doc.text(title, 20, 31);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('HERRAMIENTA PRIVADA E INDEPENDIENTE', 20, 37);
  };

  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text(BRANDING_FOOTER, 105, 285, { align: 'center' });
  };

  if (template === 'A') {
    addHeader('MEMORIA TÉCNICA DE CÁLCULO Y FUNDAMENTACIÓN');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Folio Único: ${folio}`, 145, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 145, 60);
    doc.text(`Tipo de Caso: ${dismissalLabel}`, 20, 55);

    autoTable(doc, {
      startY: 65,
      head: [['Concepto', 'Valor']],
      body: [
        ['Fecha de Ingreso', startDate || 'No especificada'],
        ['Fecha de Baja', endDate || 'No especificada'],
        ['Antigüedad', `${yearsOfService} años, ${daysOfService} días`],
        ['SDI Integrado', `$${dailySalary.toFixed(2)}`],
        ['Salario Mínimo', `$${minWage.toFixed(2)}`],
      ],
      headStyles: { fillColor: primaryColor },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Prestación', 'Monto (MXN)', 'Fundamento']],
      body: [
        ['Aguinaldo Proporcional', `$${results.aguinaldo.toFixed(2)}`, 'Art. 87 LFT'],
        ['Vacaciones Proporcionales', `$${results.vacations.toFixed(2)}`, 'Art. 76 LFT'],
        ['Prima Vacacional', `$${results.vacationPremium.toFixed(2)}`, 'Art. 80 LFT'],
        ['Indemnización 90 días', `$${results.indemnity90.toFixed(2)}`, 'Art. 48 LFT'],
        ['Indemnización 20 días/año', `$${results.indemnity20.toFixed(2)}`, 'Art. 50 LFT'],
        ['Prima de Antigüedad', `$${results.seniorityPremium.toFixed(2)}`, 'Art. 162 LFT'],
        ['Retención ISR (Estimada)', `-$${results.isr.toFixed(2)}`, 'Art. 95, 96 LISR'],
      ].filter(r => parseFloat(r[1].replace('$', '').replace('-', '')) > 0),
      headStyles: { fillColor: goldColor, textColor: [0, 0, 0] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL NETO ESTIMADO: ${totalAmountStr}`, 20, finalY);

  } else if (template === 'B') {
    addHeader('RECIBO DE FINIQUITO Y LIQUIDACIÓN CIRCUNSTANCIADO');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const lines = doc.splitTextToSize(`En la ciudad de ________________________, a los ___ días del mes de ______________ de _____, el/la C. ${nameLabel}, manifiesto expresamente haber recibido de mi patrón ${employerLabel}, la cantidad total neta de ${totalAmountStr} (MXN), mediante (Efectivo/Transferencia/Cheque).`, 170);
    doc.text(lines, 20, 60);

    doc.text("La cantidad mencionada ampara los siguientes conceptos correspondientes a mi relación de trabajo:", 20, 80);

    const bodyData = [];
    if (results.aguinaldo > 0) bodyData.push(['Aguinaldo Proporcional', `$${results.aguinaldo.toFixed(2)}`]);
    if (results.vacations > 0) bodyData.push(['Vacaciones Proporcionales', `$${results.vacations.toFixed(2)}`]);
    if (results.vacationPremium > 0) bodyData.push(['Prima Vacacional', `$${results.vacationPremium.toFixed(2)}`]);
    if (results.indemnity90 > 0) bodyData.push(['Indemnización (90 días)', `$${results.indemnity90.toFixed(2)}`]);
    if (results.indemnity20 > 0) bodyData.push(['Indemnización (20 días/año)', `$${results.indemnity20.toFixed(2)}`]);
    if (results.seniorityPremium > 0) bodyData.push(['Prima de Antigüedad', `$${results.seniorityPremium.toFixed(2)}`]);

    autoTable(doc, {
      startY: 85,
      head: [['Concepto', 'Monto (MXN)']],
      body: bodyData,
      headStyles: { fillColor: primaryColor },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("CLÁUSULA DE LIBERACIÓN MUTUA", 20, finalY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const clausula = doc.splitTextToSize("Con el pago de las cantidades antes descritas, declaro que no se me adeuda cantidad alguna por concepto de salarios, horas extras, aguinaldo, vacaciones, prima vacacional, indemnizaciones, ni ninguna otra prestación derivada de la Ley Federal del Trabajo o contrato. Otorgando el finiquito más amplio que en derecho proceda y no reservándome acción ni derecho alguno en contra del patrón.", 170);
    doc.text(clausula, 20, finalY + 7);

    doc.text("____________________________________", 105, finalY + 50, { align: 'center' });
    doc.text(`Firma y Huella de ${nameLabel}`, 105, finalY + 56, { align: 'center' });

  } else if (template === 'C') {
    addHeader('CARTA DE RENUNCIA VOLUNTARIA');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text(`Lugar y Fecha: _________________________________________`, 190, 60, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`A LA EMPRESA: ${employerLabel}`, 20, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(`PRESENTE.-`, 20, 80);

    const p1 = doc.splitTextToSize(`Por medio de la presente, sirva este conducto para comunicarles formalmente mi RENUNCIA VOLUNTARIA con carácter de irrevocable al puesto de ________________________ que venía desempeñando en esta empresa.`, 170);
    doc.text(p1, 20, 95);

    const p2 = doc.splitTextToSize(`Mi renuncia se debe a motivos estrictamente personales que convienen a mis intereses. Manifiesto que durante el tiempo que presté mis servicios para ${employerLabel}, siempre me fueron cubiertos puntualmente mis salarios, así como todas y cada una de las prestaciones a que tuve derecho, reconociendo que no sufrí accidente de trabajo ni enfermedad profesional alguna.`, 170);
    doc.text(p2, 20, 115);

    doc.text(`Agradezco de antemano la oportunidad que me fue brindada.`, 20, 140);
    doc.setFont('helvetica', 'bold');
    doc.text(`ATENTAMENTE`, 105, 160, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.text("____________________________________", 105, 190, { align: 'center' });
    doc.text(`Firma y Huella de ${nameLabel}`, 105, 196, { align: 'center' });
  }

  addFooter();
  doc.save(`LexLaboral_Plantilla_${template}_${new Date().getTime()}.pdf`);
};
