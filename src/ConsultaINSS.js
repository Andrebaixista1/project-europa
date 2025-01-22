import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = "https://api.ajin.io/v3/auth/sign-in";
const credentials = {
    accessId: "jacqueline.vieira@qualiconsig.com.br",
    password: "Jacque@324",
    authKey: "",
    type: "",
    stayConnected: true
};

const getAuthToken = async () => {
    try {
        const response = await axios.post(API_URL, credentials, {
            headers: { "Content-Type": "application/json" }
        });
        return response.data.token;
    } catch (error) {
        console.error("❌ Erro ao obter o token:", error.message);
        return null;
    }
};

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

    useEffect(() => {
        const fetchToken = async () => {
            const newToken = await getAuthToken();
            setToken(newToken);
        };
        fetchToken();
    }, []);

    const handleSearch = async () => {
        if (!cpf || !nb) {
            toast.error("CPF e NB são obrigatórios!");
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
            "Content-Type": "application/json"
        };

        try {
            const response = await axios.post(URL, { identity: cpf, benefitNumber: nb, attempts: 10 }, { headers: HEADERS });
            setDados(response.data);
            toast.success(`Consulta realizada com sucesso! Status: ${response.status}`);
        } catch (error) {
            toast.error(`Erro na consulta: ${error.response?.status || "Sem código"}`);
            setDados(null);
        }

        setLoading(false);
    };

    return (
        <div className="container mt-5">
            <h2>Consulta IN100 - Projeto Europa v0.1.2025</h2>
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
                            "Limite Cartão Benefício": dados.benefitCardLimit?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                            "Saldo Cartão Benefício": dados.benefitCardBalance?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                            "Status do Benefício": dados.benefitStatus === "elegible" ? "Elegível" : dados.benefitStatus,
                            "Data Fim Benefício": formatDate(dados.benefitEndDate),
                            "Limite Cartão Consignado": dados.consignedCardLimit?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                            "Saldo Cartão Consignado": dados.consignedCardBalance?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                            "Saldo Crédito Consignado": dados.consignedCreditBalance?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                            "Saldo Total Máximo": dados.maxTotalBalance?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                            "Saldo Total Utilizado": dados.usedTotalBalance?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                            "Saldo Total Disponível": dados.availableTotalBalance?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
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
        </div>
    );
};

export default ConsultaINSS;
