const axios = require("axios");

const API_URL = "https://api.ajin.io/v3/auth/sign-in";
const credentials = {
    accessId: "jacqueline.vieira@qualiconsig.com.br",
    password: "Jacque@324",
    authKey: "",
    type: "",
    stayConnected: true
};

async function getAuthToken() {
    try {
        const response = await axios.post(API_URL, credentials, {
            headers: { "Content-Type": "application/json" }
        });

        const token = response.data.token;
        console.log("🔑 Token Gerado:", token);
        return token;
    } catch (error) {
        console.error("❌ Erro ao obter o token:", error.message);
        return null;
    }
}

module.exports = { getAuthToken };
