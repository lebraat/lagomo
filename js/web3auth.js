document.addEventListener("DOMContentLoaded", () => {
  const connectButton = document.getElementById("connectWallet");
  const statusText = document.getElementById("status");
  const addressText = document.getElementById("address");
  let provider;
  let web3;

  const updateStatus = (message) => {
    statusText.textContent = message;
  };

  const updateAddress = (address) => {
    addressText.textContent = address ? `Connected Address: ${address}` : "";
  };

  const authenticateWithBackend = async (address) => {
    try {
      // 1. Get nonce from backend
      const nonceResponse = await fetch(`/api/auth/nonce?walletAddress=${address}`);
      const { nonce } = await nonceResponse.json();

      // 2. Sign message with wallet
      const message = `Sign this message to authenticate with Lagomo: ${nonce}`;
      const signature = await web3.eth.personal.sign(message, address);

      // 3. Verify signature with backend
      const authResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address,
          signature,
        }),
      });

      const { token } = await authResponse.json();

      // 4. Store JWT token
      localStorage.setItem("auth_token", token);
      updateStatus("Authenticated successfully!");
            
      return true;
    } catch (error) {
      console.error("Authentication error:", error);
      updateStatus("Authentication failed. Please try again.");
      return false;
    }
  };

  const connectWallet = async () => {
    try {
      updateStatus("Initializing WalletConnect...");
      connectButton.disabled = true;

      // Initialize WalletConnect
      provider = new WalletConnectProvider.default({
        projectId: "78ff0ae8b5f7d79b80f7bcdd00329f63",
        rpc: {
          11155420: "https://optimism-sepolia.infura.io/v3/44895616abc446eb825d9b17ee1453b5", // Optimism Sepolia
        },
        chains: [11155420], // Optimism Sepolia chain ID
        optionalChains: [11155420],
      });

      // Enable session (triggers QR Code modal)
      await provider.enable();

      // Create Web3 instance
      web3 = new Web3(provider);
            
      // Get connected accounts
      const accounts = await web3.eth.getAccounts();
      const address = accounts[0];
            
      updateStatus("Connected! Authenticating...");
      updateAddress(address);

      // Authenticate with backend
      const authenticated = await authenticateWithBackend(address);
      if (authenticated) {
        connectButton.textContent = "Connected";
      } else {
        connectButton.textContent = "Connect Wallet";
        connectButton.disabled = false;
      }

      // Subscribe to accounts change
      provider.on("accountsChanged", async (accounts) => {
        if (accounts.length === 0) {
          updateStatus("Please connect your wallet");
          updateAddress("");
          connectButton.textContent = "Connect Wallet";
          connectButton.disabled = false;
          localStorage.removeItem("auth_token");
        } else {
          const newAddress = accounts[0];
          updateAddress(newAddress);
          await authenticateWithBackend(newAddress);
        }
      });

      // Subscribe to chainId change
      provider.on("chainChanged", (chainId) => {
        console.log("Chain changed:", chainId);
        if (chainId !== "0x2a15c") { // Not Optimism Sepolia
          updateStatus("Please switch to Optimism Sepolia network");
        }
      });

      // Subscribe to session disconnection
      provider.on("disconnect", (code, reason) => {
        console.log("Disconnected:", code, reason);
        updateStatus("Wallet disconnected");
        updateAddress("");
        connectButton.textContent = "Connect Wallet";
        connectButton.disabled = false;
        localStorage.removeItem("auth_token");
      });

    } catch (error) {
      console.error("Error connecting wallet:", error);
      updateStatus("Error connecting wallet. Please try again.");
      connectButton.disabled = false;
            
      // Reset provider if connection failed
      if (provider) {
        await provider.disconnect();
      }
    }
  };

  connectButton.addEventListener("click", connectWallet);
});
