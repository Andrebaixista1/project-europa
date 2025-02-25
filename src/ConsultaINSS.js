// FRONTEND (src/components/ConsultaINSS.jsx)
import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ConsultaINSS.css";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  if (dateStr.length === 8) {
    return `${dateStr.substring(0, 2)}/${dateStr.substring(2, 4)}/${dateStr.substring(4)}`;
  }
  return new Date(dateStr).toLocaleDateString("pt-BR");
};

const calcularIdade = (birthDate) => {
  if (!birthDate || birthDate.length !== 8) return "-";
  const dia = parseInt(birthDate.substring(0, 2), 10);
  const mes = parseInt(birthDate.substring(2, 4), 10) - 1;
  const ano = parseInt(birthDate.substring(4, 8), 10);
  const hoje = new Date();
  const dataNasc = new Date(ano, mes, dia);

  let idade = hoje.getFullYear() - dataNasc.getFullYear();
  const mesAtual = hoje.getMonth();
  const diaAtual = hoje.getDate();

  if (mesAtual < mes || (mesAtual === mes && diaAtual < dia)) {
    idade--;
  }
  return idade;
};

const ConsultaINSS = () => {
  const [cpf, setCpf] = useState("");
  const [nb, setNb] = useState("");
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bankInfo, setBankInfo] = useState(null);
  const [limiteMensal, setLimiteMensal] = useState(null);
  const [ipExterno, setIpExterno] = useState("");

  // Bloqueia/desbloqueia scroll durante loading
  useEffect(() => {
    if (loading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [loading]);

  // Obtém IP externo do cliente
  useEffect(() => {
    const getMyIp = async () => {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        setIpExterno(data.ip);
      } catch {
        setIpExterno("127.0.0.1");
      }
    };
    getMyIp();
  }, []);

  // Busca o limite mensal no backend (seu servidor), passando o IP no cabeçalho
  const fetchLimiteMensal = async () => {
    try {
      const response = await fetch("https://api-js-in100.vercel.app/api/limit", {
        headers: {
          "Content-Type": "application/json",
          "x-client-ip": ipExterno
        }
      });
      const result = await response.json();
      if (result.success) {
        setLimiteMensal(result.limite);
      } else {
        setLimiteMensal(0);
      }
    } catch {
      setLimiteMensal(0);
    }
  };

  // Assim que obtemos o IP, chamamos a função pra pegar o limite
  useEffect(() => {
    if (ipExterno) {
      fetchLimiteMensal();
    }
  }, [ipExterno]);

  // Faz a pesquisa na API externa (api.ajin.io) SOMENTE se tiver limite
  const handleSearch = async () => {
    if (!cpf || !nb) {
      toast.info("CPF e Benefício são obrigatórios!");
      return;
    }
    if (limiteMensal <= 0) {
      toast.error("Limite de consultas mensal atingido ou IP bloqueado!");
      return;
    }

    setLoading(true);

    try {
      // 1) Chama a API externa
      const response = await fetch("https://api.ajin.io/v3/query-inss-balances/finder/await", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apiKey: process.env.REACT_APP_API_KEY,
          "x-client-ip": ipExterno
        },
        body: JSON.stringify({
          identity: cpf,
          benefitNumber: nb,
          lastDays: 0,
          attempts: 60
        })
      });

      const data = await response.json();
      if (data.name === null) {
        toast.error("Erro: Dados não encontrados!");
        setDados(null);
        setLoading(false);
        return;
      }
      if (data && data.birthDate) {
        data.age = calcularIdade(data.birthDate);
      }
      setDados(data);

      if (response.status === 200) {
        toast.success("Dados carregados com sucesso!");
      } else if (response.status === 204) {
        toast.info("Encontrei, porém não tem dados \\o/");
      } else {
        toast.success(`Consulta realizada com sucesso! Status: ${response.status}`);
      }

      // 2) Agora chama seu backend (rota /api/insert) para consumir 1 do limite
      const responseInsert = await fetch("https://api-js-in100.vercel.app/api/insert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-ip": ipExterno
        },
        body: JSON.stringify({
          id: data.id || Date.now(),
          numero_beneficio: data.benefitNumber || "",
          numero_documento: data.documentNumber || "",
          nome: data.name || "",
          estado: data.state || "",
          pensao: data.alimony || "",
          data_nascimento: data.birthDate || "",
          tipo_bloqueio: data.blockType || "",
          data_concessao: data.grantDate || "",
          tipo_credito: data.creditType || "",
          limite_cartao_beneficio: data.benefitCardLimit || 0,
          saldo_cartao_beneficio: data.benefitCardBalance || 0,
          status_beneficio: data.benefitStatus || "",
          data_fim_beneficio: data.benefitEndDate || "",
          limite_cartao_consignado: data.consignedCardLimit || 0,
          saldo_cartao_consignado: data.consignedCardBalance || 0,
          saldo_credito_consignado: data.consignedCreditBalance || 0,
          saldo_total_maximo: data.maxTotalBalance || 0,
          saldo_total_utilizado: data.usedTotalBalance || 0,
          saldo_total_disponivel: data.availableTotalBalance || 0,
          data_consulta: data.queryDate || "",
          data_retorno_consulta: data.queryReturnDate || "",
          tempo_retorno_consulta: data.queryReturnTime || "",
          nome_representante_legal: data.legalRepresentativeName || "",
          banco_desembolso: data.disbursementBankAccount?.bank || "",
          agencia_desembolso: data.disbursementBankAccount?.branch || "",
          numero_conta_desembolso: data.disbursementBankAccount?.number || "",
          digito_conta_desembolso: data.disbursementBankAccount?.digit || "",
          numero_portabilidades: data.numberOfPortabilities || 0,
          ip_origem: ipExterno,
          data_hora_registro: new Date().toISOString().slice(0, 19).replace("T", " "),
          nome_arquivo: "consulta_pontual"
        })
      });

      // 3) Se inserção retornar 403 => IP bloqueado ou limite atingido
      if (!responseInsert.ok) {
        if (responseInsert.status === 403) {
          toast.error(
            `IP Externo Bloqueado ou Limite de consultas atingido.\nPasse o IP ${ipExterno} para o gerente Expande ou diretamente para o planejamento`
          );
        } else {
          toast.error("Erro ao inserir dados");
        }
        setLoading(false);
        return;
      }

      // 4) Recarrega o limite para atualizar em tempo real
      fetchLimiteMensal();
    } catch (error) {
      toast.error(`Erro na consulta: ${error.message || "Sem código"}`);
      setDados(null);
    }

    setLoading(false);
  };

  // Busca dados bancários (BrasilAPI)
  useEffect(() => {
    const fetchBankInfo = async () => {
      const bankCode = dados?.disbursementBankAccount?.bank;
      if (!bankCode) {
        setBankInfo(null);
        return;
      }
      try {
        const response = await fetch(`https://brasilapi.com.br/api/banks/v1/${bankCode}`);
        const info = await response.json();
        setBankInfo(info);
      } catch (error) {
        console.error("Erro ao buscar informações do banco:", error);
        setBankInfo(null);
      }
    };
    if (dados) {
      fetchBankInfo();
    }
  }, [dados]);

  // Copia dados para área de transferência
  const handleCopy = () => {
    if (!dados) return;
    const bancoDesembolso = bankInfo
      ? `${bankInfo.code} - ${bankInfo.fullName}`
      : dados.disbursementBankAccount?.bank || "-";

    const dataToCopy = Object.entries({
      "Beneficio": dados.benefitNumber || "-",
      "CPF": dados.documentNumber || "-",
      Nome: dados.name || "-",
      Estado: dados.state || "-",
      Pensão: dados.alimony === "payer" ? "SIM" : "NÃO",
      "Data de Nascimento": formatDate(dados.birthDate),
      "Idade": dados.age || "-",
      "Tipo de Bloqueio": dados.blockType
        ? dados.blockType.trim().toLowerCase() === "not_blocked"
          ? "Nenhum"
          : dados.blockType.trim().toLowerCase().includes("blocked")
            ? "Bloqueado"
            : dados.blockType
        : "-",
      "Data de Concessão": formatDate(dados.grantDate),
      "Data de Término do Benefício": dados.benefitEndDate || "-",
      "Tipo de Crédito":
        dados.creditType === "checking_account"
          ? "Conta Corrente"
          : "Cartão Magnético",
      "Margem Cartão": dados.consignedCardBalance?.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }) || "-",
      "Cartão Beneficio": dados.benefitCardBalance?.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }) || "-",
      "Margem Disponivel": dados.consignedCreditBalance?.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }) || "-",
      "Status do Benefício":
        dados.benefitStatus === "elegible"
          ? "Elegível"
          : dados.benefitStatus === "inelegible"
            ? "Inelegível"
            : "Bloqueado",
      "Nome do Representante Legal": dados.legalRepresentativeName || "-",
      "Banco de Desembolso": bancoDesembolso,
      "Agência de Desembolso": dados.disbursementBankAccount?.branch || "-",
      "Número da Conta de Desembolso": dados.disbursementBankAccount?.number || "-",
      "Dígito da Conta de Desembolso": dados.disbursementBankAccount?.digit || "-",
      "Quantidade de Emprestimos":
        dados.numberOfActiveReservations !== undefined
          ? dados.numberOfActiveReservations
          : "-",
    })
      .map(([key, value]) => `*${key}*: ${value}`)
      .join("\n");

    navigator.clipboard
      .writeText(dataToCopy)
      .then(() => {
        toast.success("Dados copiados para a área de transferência!");
      })
      .catch((err) => {
        console.error("Falha ao copiar: ", err);
        toast.error("Falha ao copiar os dados.");
      });
  };

  return (
    <div className="container mt-5">
      <ToastContainer />
      <div className="d-flex align-items-center justify-content-between">
        <div className="logo-container">
          <img
            src="https://i.postimg.cc/PJNBSjRS/IMG-20250124-WA0039.jpg"
            alt="Logo"
            style={{ height: "165px", marginTop: "-73px" }}
          />
        </div>
        <div className="limit-box">
          <strong>IP Externo: </strong>
          {ipExterno} <br />
          <strong>Limite Mensal: </strong>
          {limiteMensal !== null ? limiteMensal : "Carregando..."}
        </div>
      </div>

      <div className="input-row">
        <div className="col-md-4 input-container">
          <label className="form-label">CPF:</label>
          <input
            type="text"
            className="form-control"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="Digite o CPF"
          />
        </div>
        <div className="col-md-4 input-container">
          <label className="form-label">NB:</label>
          <input
            type="text"
            className="form-control"
            value={nb}
            onChange={(e) => setNb(e.target.value)}
            placeholder="Digite o Benefício"
          />
        </div>
        <div className="col-md-4">
          <button
            className="btn btn-primary w-100 search-button"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "Pesquisando..." : "Pesquisar"}
          </button>
        </div>
      </div>

      {dados && (
        <div className="table-responsive mt-4">
          <div className="d-flex justify-content-start mb-2">
            <button className="btn btn-secondary" onClick={handleCopy}>
              Copiar dados
            </button>
          </div>
          <table className="table table-bordered">
            <tbody>
              {Object.entries({
                "Benefício": dados.benefitNumber || "-",
                "CPF": dados.documentNumber || "-",
                Nome: dados.name || "-",
                Estado: dados.state || "-",
                Pensão: dados.alimony === "payer" ? "SIM" : "NÃO",
                "Data de Nascimento": formatDate(dados.birthDate),
                "Idade": dados.age || "-",
                "Tipo de Bloqueio": dados.blockType
                  ? dados.blockType.trim().toLowerCase() === "not_blocked"
                    ? "Nenhum"
                    : dados.blockType.trim().toLowerCase().includes("blocked")
                      ? "Bloqueado"
                      : dados.blockType
                  : "-",
                "Data de Concessão": formatDate(dados.grantDate),
                "Data de Término do Benefício": dados.benefitEndDate || "-",
                "Tipo de Crédito":
                  dados.creditType === "checking_account"
                    ? "Conta Corrente"
                    : "Cartão Magnético",
                "Margem Cartão": dados.consignedCardBalance?.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }) || "-",
                "Cartão Benefício": dados.benefitCardBalance?.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }) || "-",
                "Margem Disponível": dados.consignedCreditBalance?.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }) || "-",
                "Status do Benefício":
                  dados.benefitStatus === "elegible"
                    ? "Elegível"
                    : dados.benefitStatus === "inelegible"
                      ? "Inelegível"
                      : "Bloqueado",
                "Nome do Representante Legal": dados.legalRepresentativeName || "-",
                "Banco de Desembolso": bankInfo
                  ? `${bankInfo.code} - ${bankInfo.fullName}`
                  : dados.disbursementBankAccount?.bank || "-",
                "Agência de Desembolso": dados.disbursementBankAccount?.branch || "-",
                "Número da Conta de Desembolso": dados.disbursementBankAccount?.number || "-",
                "Dígito da Conta de Desembolso": dados.disbursementBankAccount?.digit || "-",
                "Quantidade de Empréstimos":
                  dados.numberOfActiveReservations !== undefined
                    ? dados.numberOfActiveReservations
                    : "-",
              }).map(([key, value]) => (
                <tr key={key}>
                  <th>{key}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && (
        <div className="spinner-overlay">
          <div className="spinner-container">
            <div className="spinner"></div>
            <div className="spinner-text">Carregando...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultaINSS;
