import React, { useState, useEffect } from "react";
import axios from "axios";

const ApiStatus = () => {
    const [status, setStatus] = useState("Verificando...");
    const [color, setColor] = useState("gray");

    // CPF e NB fixos para a consulta
    const cpf = "8674607845";
    const nb = "1989097003";

    // Função para obter o token de autenticação
    const getAuthToken = async () => {
        const API_URL = "https://api.ajin.io/v3/auth/sign-in";
        const credentials = {
            accessId: "jacqueline.vieira@qualiconsig.com.br",
            password: "Jacque@324",
            authKey: "",
            type: "",
            stayConnected: false
        };

        try {
            console.log("🔄 Tentando obter o token...");
            const response = await axios.post(API_URL, credentials, {
                headers: { "Content-Type": "application/json" }
            });

            // console.log("🔄 Resposta da API de autenticação:", response);

            if (response.status === 200 && response.data.token) {
                // console.log("✅ Token Gerado:", response.data.token);
                return response.data.token;
            } else {
                console.error("❌ Falha ao obter token, resposta inválida:", response.data);
                return null;
            }
        } catch (error) {
            console.error("❌ Erro ao obter o token:", error.message);
            return null;
        }
    };

    const checkApiStatus = async () => {
        try {
            console.log("🔄 Verificando status da API...");
            setStatus("Verificando...");
            setColor("gray");

            const token = await getAuthToken();
            if (!token) {
                setStatus("Erro ao obter token");
                setColor("red");
                return;
            }

            // console.log("📡 Usando token:", token);

            const response = await axios.post(
                "https://api.ajin.io/v3/query-inss-balances/finder/await",
                { identity: cpf, benefitNumber: nb, attempts: 10 },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // console.log("📡 Resposta da API de status:", response.data);

            if (response.status === 200) {
                const { documentNumber, benefitNumber, name } = response.data;
                // console.log("🔍 Identidade:", documentNumber);
                // console.log("🔍 Número do Benefício:", benefitNumber);
                // console.log("🔍 Nome recebido:", name);

                if (documentNumber && benefitNumber) {
                    if (typeof name === "string" && name.trim().length > 0) {
                        console.log("✅ API OK! Definindo status como verde.");
                        setStatus("API OK");
                        setColor("green");
                    } else {
                        console.log("⚠️ Nome inválido ou vazio. Definindo status como instável.");
                        setStatus("Instabilidade");
                        setColor("yellow");
                    }
                } else {
                    console.log("⚠️ Identidade ou Benefício não encontrados. Definindo status como instável.");
                    setStatus("Instabilidade");
                    setColor("yellow");
                }
            } else if (response.status === 400) {
                console.log("⚠️ Resposta 400 - Definindo status como instável.");
                setStatus("Instabilidade");
                setColor("yellow");
            } else if (response.status >= 500) {
                console.log("❌ Erro 500+ - Definindo status como API Fora do ar.");
                setStatus("API Fora do ar");
                setColor("red");
            }
        } catch (error) {
            console.error("❌ Erro na requisição da API:", error.message);
            setStatus("API Fora do ar");
            setColor("red");
        }
    };

    useEffect(() => {
        checkApiStatus();

        // Atualiza a cada 30 segundos
        const interval = setInterval(() => {
            checkApiStatus();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            background: "#f8f9fa",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            width: "fit-content",
            marginBottom: "15px"
        }}>
            <span style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: color,
                display: "inline-block",
                marginRight: "10px"
            }}></span>
            <strong>Status da API:</strong> {status}
        </div>
    );
};

export default ApiStatus;
