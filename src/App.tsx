import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react"; // Подключаем Phantom Wallet
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"; // Кнопка подключения кошелька
import { createSPLTokenWithMetadata } from "./scripts/token";
import Header from "./components/headers";

import "@solana/wallet-adapter-react-ui/styles.css"; // Стили кнопки Phantom

function App() {

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [metaDataURL, setMetaDataURL] = useState("");
  const [tokenTicker, setTokenTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { connection } = useConnection();
  const wallet = useWallet(); // Получаем объект кошелька Phantom

  useEffect(() => {
    if (wallet.publicKey) {
      setWalletAddress(wallet.publicKey.toBase58());
    }
  }, [wallet.publicKey]);

  async function createToken() {
    if (!wallet.connected) {
      alert("Подключите Phantom Wallet!");
      return;
    }
    
    setLoading(true);
    setMessage("Создание токена...");

    try {
      const tokenAddress = await createSPLTokenWithMetadata(connection, wallet, Number(tokenAmount), 9, {
        name: tokenName,
        symbol: tokenTicker,
        uri: metaDataURL,
      });

      setMessage(`✅ Токен создан: ${tokenAddress}`);
    } catch (error) {
      console.error(error);
      setMessage("❌ Ошибка при создании токена!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="container py-3">
        <Header walletAddress={walletAddress || "Not Connected"} />

        {/* Кнопка подключения Phantom */}
        <div className="d-flex justify-content-end mb-3">
          <WalletMultiButton />
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <div className="card-header">
                <h5>Create Token</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="token-name">Token Name</label>
                      <input
                        type="text"
                        value={tokenName}
                        onChange={(e) => setTokenName(e.target.value)}
                        className="form-control"
                        id="token-name"
                        placeholder="Enter token name"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="token-amount">Token Amount</label>
                      <input
                        type="number"
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(e.target.value)}
                        className="form-control"
                        id="token-amount"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="token-ticker">Token Ticker</label>
                      <input
                        type="text"
                        value={tokenTicker}
                        onChange={(e) => setTokenTicker(e.target.value)}
                        className="form-control"
                        id="token-ticker"
                        placeholder="Enter ticker"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="metaDataURL">MetaData URL</label>
                      <input
                        type="text"
                        value={metaDataURL}
                        onChange={(e) => setMetaDataURL(e.target.value)}
                        className="form-control"
                        id="metaDataURL"
                        placeholder="Enter metadata URL"
                      />
                    </div>
                  </div>
                </div>

                <hr />
                <button
                  type="button"
                  className="btn btn-primary"
                  id="create-token"
                  onClick={createToken}
                  disabled={loading || !wallet.connected}
                >
                  {loading ? "Creating..." : "Create Token"}
                </button>
                {message && <p className="mt-2">{message}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
