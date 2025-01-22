import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zxbwehohahcuexwutzqr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4YndlaG9oYWhjdWV4d3V0enFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NzQ4ODIsImV4cCI6MjA1MzE1MDg4Mn0.yLKStnqwWW5-S5VKGXpOtQJz8m0fPaSjddDdqZ2UCCo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const saveToSupabase = async (dados) => {
  if (!dados) {
    console.error("⚠️ Nenhum dado disponível para salvar.");
    return;
  }

  const dataHoraConsulta = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  try {
    const { data: existingData, error: selectError } = await supabase
      .from("consultas_inss")
      .select("id")
      .eq("numero_beneficio", dados.benefitNumber || "")
      .eq("numero_documento", dados.documentNumber || "");

    if (selectError) {
      console.error("❌ Erro ao pesquisar no Supabase:", selectError.message);
      return;
    }

    const payload = {
      numero_beneficio: dados.benefitNumber || null,
      numero_documento: dados.documentNumber || null,
      nome: dados.name || null,
      estado: dados.state || null,
      pensao: dados.alimony === "payer" ? "SIM" : "NÃO",
      data_nascimento: dados.birthDate || null,
      tipo_bloqueio: dados.blockType || null,
      data_concessao: dados.grantDate || null,
      tipo_credito: dados.creditType || null,
      limite_cartao_beneficio: dados.benefitCardLimit || null,
      saldo_cartao_beneficio: dados.benefitCardBalance || null,
      status_beneficio: dados.benefitStatus || null,
      data_fim_beneficio: dados.benefitEndDate || null,
      limite_cartao_consignado: dados.consignedCardLimit || null,
      saldo_cartao_consignado: dados.consignedCardBalance || null,
      saldo_credito_consignado: dados.consignedCreditBalance || null,
      saldo_total_maximo: dados.maxTotalBalance || null,
      saldo_total_utilizado: dados.usedTotalBalance || null,
      saldo_total_disponivel: dados.availableTotalBalance || null,
      data_consulta: dados.queryDate || null,
      data_retorno_consulta: dados.queryReturnDate || null,
      tempo_retorno_consulta: dados.queryReturnTime || null,
      nome_representante_legal: dados.legalRepresentativeName || null,
      banco_desembolso: dados.disbursementBankAccount?.bank || null,
      agencia_desembolso: dados.disbursementBankAccount?.branch || null,
      numero_conta_desembolso: dados.disbursementBankAccount?.number || null,
      digito_conta_desembolso: dados.disbursementBankAccount?.digit || null,
      numero_portabilidades:
        dados.numberOfPortabilities !== undefined ? dados.numberOfPortabilities : null,
      data_hora_registro: dataHoraConsulta,
    };

    if (existingData && existingData.length > 0) {
      const recordId = existingData[0].id;
      const { error: updateError } = await supabase
        .from("consultas_inss")
        .update(payload)
        .eq("id", recordId);

      if (updateError) {
        console.error("❌ Erro ao atualizar no Supabase:", updateError.message);
      } else {
        console.log("✅ Dados atualizados no Supabase com sucesso!");
      }
    } else {
      const { error: insertError } = await supabase.from("consultas_inss").insert([payload]);
      if (insertError) {
        console.error("❌ Erro ao salvar no Supabase:", insertError.message);
      } else {
        console.log("✅ Dados salvos no Supabase com sucesso!");
      }
    }
  } catch (err) {
    console.error("❌ Erro inesperado ao salvar no Supabase:", err.message);
  }
};
