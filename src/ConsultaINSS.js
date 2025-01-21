import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

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

    const handleSearch = async () => {
        if (!cpf || !nb) {
            toast.error("CPF e NB são obrigatórios!");
            return;
        }

        setLoading(true);
        
        const URL = "https://api.ajin.io/v3/query-inss-balances/finder/await";
        const HEADERS = {
            Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYjg4MzMxMjUtZWIyNi00MjVjLTg3NzAtM2QwNGFiMWM4ZWJlIiwic2Vzc2lvbl9pZCI6ImYyZGY1YTgzLTkyNGYtNDQ5NC04NDE1LTJlODc4ODk2ZWY5MiIsImhvc3QiOiJhcGkuYWppbi5pbyIsImlwIjoiMjAxLjAuMjEuMTQzIiwibmJmIjoxNzM3NDY0NzgyLCJleHAiOjE3Mzc1NTExODIsImlhdCI6MTczNzQ2NDc4Mn0.EInux5pL36BbttII7GD5zuItCz4cqOnGAvqRol6oHCU",
            "Content-Type": "application/json"
        };

        try {
            const response = await axios.post(URL, { identity: cpf, benefitNumber: nb }, { headers: HEADERS });
            setDados(response.data);
            toast.success(`Consulta realizada com sucesso! Status: ${response.status}`);
        } catch (error) {
            toast.error(`Erro na consulta: ${error.response?.status || "Sem código"}`);
            setDados(null);
        }

        setLoading(false);
    };

    const handleCopyTable = () => {
        if (!dados) return;
        
        let tableText = "Consulta IN1100 - Projeto Europa v0.1.2025\n\n";
        Object.entries({
            "Número do Benefício": dados.benefitNumber,
            "Número do Documento": dados.documentNumber,
            "Nome": dados.name,
            "Estado": dados.state,
            "Pensão": dados.alimony === "payer" ? "SIM" : "NÃO",
            "Data de Nascimento": formatDate(dados.birthDate),
            "Tipo de Bloqueio": dados.blockType === "not_blocked" ? "Nenhum" : dados.blockType,
            "Data de Concessão": formatDate(dados.grantDate),
            "Tipo de Crédito": dados.creditType,
            "Limite Cartão Benefício": dados.benefitCardLimit?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
            "Saldo Cartão Benefício": dados.benefitCardBalance?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
            "Status do Benefício": dados.benefitStatus === "elegible" ? "Elegível" : dados.benefitStatus,
            "Data Fim Benefício": formatDate(dados.benefitEndDate),
            "Data da Consulta": formatDateTime(dados.queryDate),
            "Data de Retorno da Consulta": formatDateTime(dados.queryReturnDate),
            "Tempo de Retorno da Consulta": dados.queryReturnTime
        }).forEach(([key, value]) => {
            tableText += `${key}: ${value}\n`;
        });

        navigator.clipboard.writeText(tableText)
            .then(() => toast.success("Tabela copiada para a área de transferência!"))
            .catch(() => toast.error("Erro ao copiar a tabela."));
    };

    return (
        <div className="container mt-5 position-relative">
            {loading && (
                <div className="loading-overlay position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-light" role="status">
                        <span className="visually-hidden">Carregando...</span>
                    </div>
                </div>
            )}
            
            <h2 className="mb-4">Consulta INSS</h2>

            <div className="row mb-3">
                <div className="col-md-4">
                    <label className="form-label">CPF:</label>
                    <input type="text" className="form-control" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="Digite o CPF" />
                </div>
                <div className="col-md-4">
                    <label className="form-label">NB:</label>
                    <input type="text" className="form-control" value={nb} onChange={(e) => setNb(e.target.value)} placeholder="Digite o Número do Benefício" />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                    <button className="btn btn-primary w-100" onClick={handleSearch}>Pesquisar</button>
                </div>
            </div>

            {dados && (
                <div className="table-responsive mt-4">
                    <table className="table table-bordered">
                        <tbody>
                            {Object.entries({
                                "Número do Benefício": dados.benefitNumber,
                                "Número do Documento": dados.documentNumber,
                                "Nome": dados.name,
                                "Estado": dados.state,
                                "Pensão": dados.alimony === "payer" ? "SIM" : "NÃO",
                                "Data de Nascimento": formatDate(dados.birthDate),
                                "Tipo de Bloqueio": dados.blockType === "not_blocked" ? "Nenhum" : dados.blockType,
                                "Data de Concessão": formatDate(dados.grantDate),
                                "Tipo de Crédito": dados.creditType,
                                "Status do Benefício": dados.benefitStatus === "elegible" ? "Elegível" : dados.benefitStatus,
                                "Data Fim Benefício": formatDate(dados.benefitEndDate),
                                "Data da Consulta": formatDateTime(dados.queryDate),
                                "Data de Retorno da Consulta": formatDateTime(dados.queryReturnDate),
                                "Tempo de Retorno da Consulta": dados.queryReturnTime
                            }).map(([key, value]) => (
                                <tr key={key}>
                                    <th>{key}</th>
                                    <td>{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button className="btn btn-secondary mt-3" onClick={handleCopyTable}>Copiar Tabela</button>
                </div>
            )}
        </div>
    );
};

export default ConsultaINSS;