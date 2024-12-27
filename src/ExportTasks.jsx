// ExportTasks.jsx
import React from "react";
import { Workbook } from "exceljs";
import { saveAs } from "file-saver-es";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const ExportTasks = ({ tasks }) => {
  // Exporte en PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const data = tasks.map((task) => [
      task.id,
      task.titre,
      task.priorite,
      task.details,
    ]);
    doc.autoTable({
      head: [["ID", "Titre", "Priorité", "Détails"]],
      body: data,
    });
    doc.save(`Taches_${Date.now()}.pdf`);
  };

  // Exporte en XLSX
  const exportToXLSX = () => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Taches");
    worksheet.addRow(["ID", "Titre", "Priorité", "Détails"]);
    tasks.forEach((task) =>
      worksheet.addRow([task.id, task.titre, task.priorite, task.details])
    );
    workbook.xlsx.writeBuffer().then((buffer) => {
      saveAs(new Blob([buffer]), `Taches_${Date.now()}.xlsx`);
    });
  };

  return (
    <div className="toolbar-actions">
      <button onClick={exportToPDF}>Exporter en PDF</button>
      <button onClick={exportToXLSX}>Exporter en XLSX</button>
    </div>
  );
};

export default ExportTasks;
