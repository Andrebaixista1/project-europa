import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ConsultaINSS.css"; // Importar o CSS personalizado
import { saveToSupabase } from "./saveToSupabase";
import { getAuthToken } from "./tokenGeneretor";
import ApiStatus from "./ApiStatus";

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

const ConsultaINSS = () => {
    const [cpf, setCpf] = useState("");
    const [nb, setNb] = useState("");
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState("");

    // ESTADO PARA ARMAZENAR AS INFORMAÇÕES DO BANCO (BrasilAPI)
    const [bankInfo, setBankInfo] = useState(null);

    useEffect(() => {
        const fetchToken = async () => {
            const newToken = await getAuthToken();
            setToken(newToken);
        };
        fetchToken();
    }, []);

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

        if (!token) {
            toast.error("Erro ao obter o token de autenticação!");
            return;
        }

        setLoading(true);

        const URL = "https://api.ajin.io/v3/query-inss-balances/finder/await";
        const HEADERS = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        try {
            const response = await axios.post(
                URL,
                { identity: cpf, benefitNumber: nb, attempts: 10 },
                { headers: HEADERS }
            );

            setDados(response.data);
            await saveToSupabase(response.data); // Salva os dados no Supabase

            if (response.status === 200) {
                toast.success("Dados carregados com sucesso!");
            } else if (response.status === 204) {
                toast.info("Encontrei, porém não tem dados \\o/");
            } else {
                toast.success(`Consulta realizada com sucesso! Status: ${response.status}`);
            }
        } catch (error) {
            if (error.response && error.response.status === 400) {
                toast.error("Infelizmente não achei nenhuma informação.");
            } else {
                toast.error(`Erro na consulta: ${error.response?.status || "Sem código"}`);
            }
            setDados(null);
        }

        setLoading(false);
    };

    // USEEFFECT PARA BUSCAR AS INFORMAÇÕES DO BANCO BASEADO NO CÓDIGO (BrasilAPI)
    useEffect(() => {
        const fetchBankInfo = async () => {
            // se não houver código de banco, não faz nada
            const bankCode = dados?.disbursementBankAccount?.bank;
            if (!bankCode) {
                setBankInfo(null);
                return;
            }
            try {
                const response = await axios.get(
                    `https://brasilapi.com.br/api/banks/v1/${bankCode}`
                );
                setBankInfo(response.data);
            } catch (error) {
                console.error("Erro ao buscar informações do banco:", error);
                setBankInfo(null);
            }
        };

        fetchBankInfo();
    }, [dados]);

    const handleCopy = () => {
        if (!dados) return;

        // Exemplo de como incluir banco de desembolso no texto copiado
        const bancoDesembolso =
            bankInfo ? `${bankInfo.code} - ${bankInfo.fullName}` : dados.disbursementBankAccount?.bank || "-";

        const dataToCopy = Object.entries({
            "Número do Benefício": dados.benefitNumber || "-",
            "Número do Documento": dados.documentNumber || "-",
            Nome: dados.name || "-",
            Estado: dados.state || "-",
            Pensão: dados.alimony === "payer" ? "SIM" : "NÃO",
            "Data de Nascimento": formatDate(dados.birthDate),
            "Tipo de Bloqueio": dados.blockType
                ? dados.blockType.trim().toLowerCase() === "not_blocked"
                    ? "Nenhum"
                    : dados.blockType.trim().toLowerCase().includes("blocked")
                    ? "Bloqueado"
                    : dados.blockType
                : "-",
            "Data de Concessão": formatDate(dados.grantDate),
            "Tipo de Crédito":
                dados.creditType === "checking_account"
                    ? "Conta Corrente"
                    : "Cartão Magnético",
            "Limite Cartão Benefício": dados.benefitCardLimit?.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
            }) || "-",
            "Saldo Cartão Benefício": dados.benefitCardBalance?.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
            }) || "-",
            "Status do Benefício":
                dados.benefitStatus === "elegible"
                    ? "Elegível"
                    : dados.benefitStatus === "inelegible"
                    ? "Inelegível"
                    : "Bloqueado",
            "Data Fim Benefício": formatDate(dados.benefitEndDate),
            "Limite Cartão Consignado": dados.consignedCardLimit?.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
            }) || "-",
            "Saldo Cartão Consignado": dados.consignedCardBalance?.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
            }) || "-",
            "Saldo Crédito Consignado": dados.consignedCreditBalance?.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
            }) || "-",
            "Saldo Total Máximo": dados.maxTotalBalance?.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
            }) || "-",
            "Saldo Total Utilizado": dados.usedTotalBalance?.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
            }) || "-",
            "Saldo Total Disponível": dados.availableTotalBalance?.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
            }) || "-",
            "Data da Consulta": formatDateTime(dados.queryDate),
            "Data de Retorno da Consulta": formatDateTime(dados.queryReturnDate),
            "Tempo de Retorno da Consulta": dados.queryReturnTime || "-",
            "Nome do Representante Legal": dados.legalRepresentativeName || "-",
            // AQUI USAMOS A INFO DO bankInfo ou, em caso de erro, exibimos o código cru
            "Banco de Desembolso": bancoDesembolso,
            "Agência de Desembolso": dados.disbursementBankAccount?.branch || "-",
            "Número da Conta de Desembolso": dados.disbursementBankAccount?.number || "-",
            "Dígito da Conta de Desembolso": dados.disbursementBankAccount?.digit || "-",
            "Número de Portabilidades":
                dados.numberOfPortabilities !== undefined ? dados.numberOfPortabilities : "-",
        })
            .map(([key, value]) => `*${key}*: ${value}`)
            .join("\n");

        navigator.clipboard.writeText(dataToCopy)
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
            {/* Overlay de Carregamento */}
            {loading && (
                <div className="spinner-overlay">
                    <div className="spinner-container">
                        <div className="spinner"></div>
                        <p className="spinner-text">Loading...</p>
                    </div>
                </div>
            )}
            <ApiStatus/>

            <div className="d-flex justify-content-between align-items-center">
                <h2>Vieira IN100</h2>
                <img
                    src="https://i.postimg.cc/PJNBSjRS/IMG-20250124-WA0039.jpg"
                    alt="Logo"
                    style={{ height: "165px", margin: "-45px" }}
                />
            </div>
            <div className="row mb-3">
                <div className="col-md-4">
                    <label className="form-label">CPF:</label>
                    <input
                        type="text"
                        className="form-control"
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        placeholder="Digite o CPF"
                    />
                </div>
                <div className="col-md-4">
                    <label className="form-label">NB:</label>
                    <input
                        type="text"
                        className="form-control"
                        value={nb}
                        onChange={(e) => setNb(e.target.value)}
                        placeholder="Digite o Número do Benefício"
                    />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                    <button
                        className="btn btn-primary w-100"
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        {loading ? "Pesquisando..." : "Pesquisar"}
                    </button>
                </div>
            </div>

            {dados && (
                <div className="table-responsive mt-4">
                    {/* Botão de Copiar Dados */}
                    <div className="d-flex justify-content-start mb-2">
                        <button className="btn btn-secondary" onClick={handleCopy}>
                            Copiar dados
                        </button>
                    </div>
                    <table className="table table-bordered">
                        <tbody>
                            {Object.entries({
                                "Número do Benefício": dados.benefitNumber || "-",
                                "Número do Documento": dados.documentNumber || "-",
                                Nome: dados.name || "-",
                                Estado: dados.state || "-",
                                Pensão: dados.alimony === "payer" ? "SIM" : "NÃO",
                                "Data de Nascimento": formatDate(dados.birthDate),
                                "Tipo de Bloqueio": dados.blockType
                                    ? dados.blockType.trim().toLowerCase() === "not_blocked"
                                        ? "Nenhum"
                                        : dados.blockType.trim().toLowerCase().includes("blocked")
                                        ? "Bloqueado"
                                        : dados.blockType
                                    : "-",
                                "Data de Concessão": formatDate(dados.grantDate),
                                "Tipo de Crédito":
                                    dados.creditType === "checking_account"
                                        ? "Conta Corrente"
                                        : "Cartão Magnético",
                                "Limite Cartão Benefício": dados.benefitCardLimit?.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                }) || "-",
                                "Saldo Cartão Benefício": dados.benefitCardBalance?.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                }) || "-",
                                "Status do Benefício":
                                    dados.benefitStatus === "elegible"
                                        ? "Elegível"
                                        : dados.benefitStatus === "inelegible"
                                        ? "Inelegível"
                                        : "Bloqueado",
                                "Data Fim Benefício": formatDate(dados.benefitEndDate),
                                "Limite Cartão Consignado": dados.consignedCardLimit?.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                }) || "-",
                                "Saldo Cartão Consignado": dados.consignedCardBalance?.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                }) || "-",
                                "Saldo Crédito Consignado": dados.consignedCreditBalance?.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                }) || "-",
                                "Saldo Total Máximo": dados.maxTotalBalance?.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                }) || "-",
                                "Saldo Total Utilizado": dados.usedTotalBalance?.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                }) || "-",
                                "Saldo Total Disponível": dados.availableTotalBalance?.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                }) || "-",
                                "Data da Consulta": formatDateTime(dados.queryDate),
                                "Data de Retorno da Consulta": formatDateTime(dados.queryReturnDate),
                                "Tempo de Retorno da Consulta": dados.queryReturnTime || "-",
                                "Nome do Representante Legal": dados.legalRepresentativeName || "-",
                                // AQUI USAMOS O VALOR DE bankInfo PARA MONTAR O "BANCO DE DESEMBOLSO"
                                "Banco de Desembolso": bankInfo
                                    ? `${bankInfo.code} - ${bankInfo.fullName}`
                                    : dados.disbursementBankAccount?.bank || "-",
                                "Agência de Desembolso": dados.disbursementBankAccount?.branch || "-",
                                "Número da Conta de Desembolso": dados.disbursementBankAccount?.number || "-",
                                "Dígito da Conta de Desembolso": dados.disbursementBankAccount?.digit || "-",
                                "Número de Portabilidades":
                                    dados.numberOfPortabilities !== undefined
                                        ? dados.numberOfPortabilities
                                        : "-",
                            }).map(([key, value]) => {
                                // Determinar a classe com base no tipo de bloqueio
                                let textClass = "";
                                if (key === "Tipo de Bloqueio") {
                                    const tipoBloqueio = value.trim().toLowerCase();
                                    textClass =
                                        tipoBloqueio === "nenhum"
                                            ? "text-success fw-bold"
                                            : "text-danger fw-bold";
                                }

                                return (
                                    <tr key={key}>
                                        <th>{key}</th>
                                        <td className={textClass}>{value}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ConsultaINSS;
