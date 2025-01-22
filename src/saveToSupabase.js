import { createClient } from "@supabase/supabase-js";

// 🔹 Substitua pelos valores do seu Supabase
const SUPABASE_URL = "https://zxbwehohahcuexwutzqr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4YndlaG9oYWhjdWV4d3V0enFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NzQ4ODIsImV4cCI6MjA1MzE1MDg4Mn0.yLKStnqwWW5-S5VKGXpOtQJz8m0fPaSjddDdqZ2UCCo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  if (dateStr.length === 8) {
    return `${dateStr.substring(0, 2)}/${dateStr.substring(2, 4)}/${dateStr.substring(4)}`;
  }
  return new Date(dateStr).toLocaleDateString("pt-BR");
};

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return "-";
  return new Date(dateTimeStr).toLocaleString("pt-BR", { timeZone: "UTC" });
};

const formatBlockType = (blockType) => {
  if (!blockType) return "-";
  const t = blockType.trim().toLowerCase();
  if (t === "not_blocked") return "Nenhum";
  if (t.includes("blocked")) return "Bloqueado";
  return blockType;
};

const formatCreditType = (creditType) => {
  if (creditType === "checking_account") return "Conta Corrente";
  if (creditType === "magnetic_card") return "Cartão Magnético";
  return "-";
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const saveToSupabase = async (dados, disbursementBankName = "") => {
  if (!dados) return;

  const dataHoraConsulta = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const pensao = dados.alimony === "payer" ? "SIM" : "NÃO";
  const statusBeneficio =
    dados.benefitStatus === "elegible"
      ? "Elegível"
      : dados.benefitStatus === "inelegible"
      ? "Inelegível"
      : "Bloqueado";

  try {
    const { error } = await supabase.from("consultas_inss").insert([
      {
        numero_beneficio: dados.benefitNumber || "-",
        numero_documento: dados.documentNumber || "-",
        nome: dados.name || "-",
        estado: dados.state || "-",
        pensao,
        data_nascimento: formatDate(dados.birthDate),
        tipo_bloqueio: formatBlockType(dados.blockType),
        data_concessao: formatDate(dados.grantDate),
        tipo_credito: formatCreditType(dados.creditType),
        limite_cartao_beneficio: formatCurrency(dados.benefitCardLimit),
        saldo_cartao_beneficio: formatCurrency(dados.benefitCardBalance),
        status_beneficio: statusBeneficio,
        data_fim_beneficio: formatDate(dados.benefitEndDate),
        limite_cartao_consignado: formatCurrency(dados.consignedCardLimit),
        saldo_cartao_consignado: formatCurrency(dados.consignedCardBalance),
        saldo_credito_consignado: formatCurrency(dados.consignedCreditBalance),
        saldo_total_maximo: formatCurrency(dados.maxTotalBalance),
        saldo_total_utilizado: formatCurrency(dados.usedTotalBalance),
        saldo_total_disponivel: formatCurrency(dados.availableTotalBalance),
        data_consulta: formatDateTime(dados.queryDate),
        data_retorno_consulta: formatDateTime(dados.queryReturnDate),
        tempo_retorno_consulta: dados.queryReturnTime || "-",
        nome_representante_legal: dados.legalRepresentativeName || "-",
        codigo_banco_desembolso: dados.disbursementBankAccount?.bank
          ? dados.disbursementBankAccount.bank.toString()
          : "-",
        nome_banco_desembolso: disbursementBankName || "-",
        agencia_desembolso: dados.disbursementBankAccount?.branch || "-",
        numero_conta_desembolso: dados.disbursementBankAccount?.number || "-",
        digito_conta_desembolso: dados.disbursementBankAccount?.digit || "-",
        numero_portabilidades:
          dados.numberOfPortabilities !== undefined ? dados.numberOfPortabilities : "-",
        data_hora_registro: dataHoraConsulta,
      },
    ]);

    if (error) {
      console.error("❌ Erro ao salvar no Supabase:", error.message);
    } else {
      console.log("✅ Dados salvos no Supabase com sucesso!");
    }
  } catch (err) {
    console.error("❌ Erro inesperado ao salvar no Supabase:", err.message);
  }
};
