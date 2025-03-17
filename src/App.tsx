import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react"; // Подключаем Phantom Wallet
// Кнопка подключения кошелька
import { Metadata, createSPLTokenWithMetadata } from "./scripts/token";
import { uploadImageToIPFS, uploadJSONToIPFS } from "./scripts/ipfs";
import Header from "./components/headers";

import "@solana/wallet-adapter-react-ui/styles.css"; // Стили кнопки Phantom
import Footer from "./components/footer";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import { config } from "./config";
import "./index.css";

function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenTicker, setTokenTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [description, setDescription] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState("6");

  const [loadingFile, setLoadingFile] = useState(false);
  const [tokenLogo, setTokenLogo] = useState<File | Blob>();
  const [tokenLogoLink, setTokenLogoLink] = useState("");

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setLoadingFile(true);
      setTokenLogo(file);
      setTokenLogoLink(URL.createObjectURL(file));
      // try {
      //     const uploadedCid = await uploadImageToIPFS('image', file);
      //     setCid(uploadedCid);
      // } catch (error) {
      //     console.error(error);
      // } finally {
      //   setLoadingFile(false);
      // }
    }
  };

  const { connection } = useConnection();
  const wallet = useWallet(); // Получаем объект кошелька Phantom

  useEffect(() => {
    if (wallet.publicKey) {
      setWalletAddress(wallet.publicKey.toBase58());
    }
  }, [wallet.publicKey]);

  async function releaseToken() {
    if (!wallet.connected) {
      alert("Подключите Phantom Wallet!");
      return;
    }

    setLoading(true);
    setMessage("Создание токена...");

    try {
      const metaDataURL = await deployMetadataJSON(
        tokenName,
        tokenTicker,
        description
      );

      const tokenAddress = await createSPLTokenWithMetadata(
        connection,
        wallet,
        Number(tokenAmount),
        9,
        {
          name: tokenName,
          symbol: tokenTicker,
          uri: metaDataURL,
        }
      );

      setMessage(`✅ Токен создан: ${tokenAddress}`);
    } catch (error) {
      console.error(error);
      setMessage("❌ Ошибка при создании токена!");
    } finally {
      setLoading(false);
    }
  }

  async function deployMetadataJSON(
    tokenName: string,
    tokenTicker: string,
    description: string
  ) {
    if (!tokenLogo) throw new Error("Token logo can't be empty");

    let imageId = await uploadImageToIPFS("userToken", tokenLogo);

    let metadata = {
      name: tokenName,
      symbol: tokenTicker,
      description: description,
      image: `${config.ipfsGateway}/${imageId}`,
    };

    return await uploadJSONToIPFS(metadata);
  }

  return (
    <>
      <Header walletAddress={walletAddress || "Not Connected"} />
      <div className="container py-5 p-3">
        {/* Кнопка подключения Phantom */}
        <div className="row mb-5">
          <h1 className="text-center">Solana Token Creator</h1>
          <h3 className="text-center gradient-description">
            Create tokens in a few clicks!
          </h3>
        </div>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="input-form card text-light py-3">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="token-name">
                        <span className="text-danger">*</span> Token Name
                      </label>
                      <input
                        type="text"
                        value={tokenName}
                        onChange={(e) => setTokenName(e.target.value)}
                        className="form-control"
                        id="token-name"
                        placeholder="Ex: Solana"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="token-amount">Token Supply</label>
                      <input
                        type="number"
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(e.target.value)}
                        className="form-control"
                        id="token-amount"
                        placeholder="1 000 000 000"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="token-amount">Token Decimals</label>
                      <input
                        type="number"
                        value={tokenDecimals}
                        onChange={(e) => setTokenDecimals(e.target.value)}
                        className="form-control"
                        id="token-decimals"
                        placeholder="6"
                      />
                    </div>
                  </div>
                  {/* Token Image (теперь справа) */}
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="token-ticker">
                        <span className="text-danger">*</span> Symbol
                      </label>
                      <input
                        type="text"
                        value={tokenTicker}
                        onChange={(e) => setTokenTicker(e.target.value)}
                        className="form-control"
                        id="token-ticker"
                        placeholder="SOL"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="file-input">Token Image</label>
                      <div className="upload-container">
                        {!tokenLogo && (
                          <label className="upload-box">
                            <i className="bi bi-cloud-upload"></i>
                            <p>Drag and drop here to upload</p>
                            <small>.png .jpg max 5 mb</small>
                            <input
                              type="file"
                              id="file-upload"
                              onChange={handleFileChange}
                              className="form-control"
                              accept=".png, .jpg"
                              hidden
                            />
                          </label>
                        )}
                        {tokenLogo && (
                          <label className="upload-box">
                            <img
                              src={tokenLogoLink}
                              alt="Preview"
                              className="mt-2 w-full h-full control object-cover rounded-lg"
                            />
                            <input
                              type="file"
                              id="file-upload"
                              onChange={handleFileChange}
                              className="form-control"
                              accept=".png, .jpg"
                              hidden
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="description-input">Description</label>
                    <textarea
                      id="description-input"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="form-control description"
                      placeholder="Ex: The most popular coin on Solana."
                    />
                  </div>
                </div>
                <hr />
                <button
                  type="button"
                  className="btn w-100 btn-create-coin"
                  id="create-token"
                  onClick={releaseToken}
                  disabled={loading || !wallet.connected}
                >
                  {loading ? "Creating..." : "Create Token"}
                </button>
                {message && <p className="mt-2">{message}</p>}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}

export default App;
