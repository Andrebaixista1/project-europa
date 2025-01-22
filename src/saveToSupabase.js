import { createClient } from "@supabase/supabase-js";

// 🔹 Substitua pelos valores do seu Supabase
const SUPABASE_URL = "https://zxbwehohahcuexwutzqr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4YndlaG9oYWhjdWV4d3V0enFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NzQ4ODIsImV4cCI6MjA1MzE1MDg4Mn0.yLKStnqwWW5-S5VKGXpOtQJz8m0fPaSjddDdqZ2UCCo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const saveToSupabase = async (dados) => {
    if (!dados) {
        console.error("⚠️ Nenhum dado disponível para salvar.");
        return;
    }

    // Obtém a data e hora no formato dd/mm/aaaa hh:mm:ss
    const dataHoraConsulta = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    try {
        const { error } = await supabase.from("consultas_inss").insert([
            {
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
                data_hora_registro: dataHoraConsulta // 🔹 Nova coluna adicionada
            }
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
