// src/components/ConsultaINSS.jsx
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

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return "-";
  return new Date(dateTimeStr).toLocaleString("pt-BR", { timeZone: "UTC" });
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

  useEffect(() => {
    if (loading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [loading]);

  const handleSearch = async () => {
    if (!cpf || !nb) {
      toast.info("CPF e Benefício são obrigatórios!");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("https://api.ajin.io/v3/query-inss-balances/finder/await", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apiKey: process.env.REACT_APP_API_KEY
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
    } catch (error) {
      toast.error(`Erro na consulta: ${error.message || "Sem código"}`);
      setDados(null);
    }
    setLoading(false);
  };

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
    fetchBankInfo();
  }, [dados]);

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
      "Margem Cartão": dados.benefitCardBalance?.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }) || "-",
      "Cartão Beneficio": dados.consignedCardBalance?.toLocaleString("pt-BR", {
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
      "Banco de Desembolso": bankInfo
        ? `${bankInfo.code} - ${bankInfo.fullName}`
        : dados.disbursementBankAccount?.bank || "-",
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
      <div className="logo-container">
        <img
          src="https://i.postimg.cc/PJNBSjRS/IMG-20250124-WA0039.jpg"
          alt="Logo"
          style={{ height: "165px", marginTop: "-73px" }}
        />
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
                "Margem Cartão": dados.benefitCardBalance?.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }) || "-",
                "Cartão Benefício": dados.consignedCardBalance?.toLocaleString("pt-BR", {
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
                "Quantidade de Emprestimos":
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
